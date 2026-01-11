from pathlib import Path
import librosa
import numpy as np
import soundfile as sf
import scipy.signal as sig
import psola

SEMITONES_IN_OCTAVE = 12

def interpolate_nans(x):
    """
    Helper to fill NaN values in a 1D array using linear interpolation.
    Essential for PSOLA which cannot handle NaNs.
    """
    # Create a boolean mask for valid (non-NaN) values
    valid_mask = ~np.isnan(x)
    # If the whole array is NaNs, return zeros (silence/unvoiced)
    if not np.any(valid_mask):
        return np.zeros_like(x)
    
    # Get the indices of the valid values
    valid_indices = valid_mask.nonzero()[0]
    # Get the indices of the whole array
    all_indices = np.arange(len(x))
    
    # Interpolate using numpy
    return np.interp(all_indices, valid_indices, x[valid_mask])


def smooth_pitch_contours(pitch_array, window_length=11, polyorder=3):
    """
    Apply Savitzky-Golay filter to smooth pitch contours.
    This helps reduce jagged lines in the pitch plot while preserving the overall shape.
    """
    from scipy.signal import savgol_filter
    
    # Only apply smoothing to valid (non-NaN) values
    valid_mask = ~np.isnan(pitch_array)
    if not np.any(valid_mask):
        return pitch_array  # Return as-is if all values are NaN
    
    # Create a copy of the array to avoid modifying the original
    smoothed_pitch = pitch_array.copy()
    
    # Apply smoothing only if we have enough valid points
    if np.sum(valid_mask) >= window_length:
        # Apply Savitzky-Golay filter to valid values only
        # We need to handle segments separately to avoid smoothing across silences
        smoothed_values = savgol_filter(pitch_array[valid_mask], window_length, polyorder)
        smoothed_pitch[valid_mask] = smoothed_values
    
    return smoothed_pitch


def get_target_pitch(f0, scale=None):
    """
    Returns the 'perfect' snapped pitch for each frame without smoothing.
    Smoothing is handled later in the delta stage.
    """
    if scale is None or scale.lower() == 'chromatic':
        degrees = np.arange(SEMITONES_IN_OCTAVE + 1)  # 0 to 12 inclusive
    else:
        degrees = librosa.key_to_degrees(scale)
        degrees = np.concatenate((degrees, [degrees[0] + SEMITONES_IN_OCTAVE]))

    midi_note = librosa.hz_to_midi(f0)
    degree_vals = midi_note % SEMITONES_IN_OCTAVE
    
    # Vectorized search for closest degree
    distances = np.abs(degree_vals[:, np.newaxis] - degrees[np.newaxis, :])
    closest_degree_indices = np.argmin(distances, axis=1)
    closest_degrees = degrees[closest_degree_indices]
    
    degree_difference = degree_vals - closest_degrees
    corrected_midi = midi_note - degree_difference
    
    return librosa.midi_to_hz(corrected_midi)

def detect_key(f0):
    """
    Detects the key that minimizes the total pitch correction error.
    Returns a string like 'C:maj', 'F#:maj', etc.
    """
    chromatic_notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    # Filter out NaNs to calculate error on voiced segments only
    valid_f0 = f0[~np.isnan(f0)]
    
    min_error = float('inf')
    best_major_idx = 0

    # Convert to MIDI
    midi_f0 = librosa.hz_to_midi(valid_f0) % SEMITONES_IN_OCTAVE
    
    # Check all 12 Major keys
    for i, note in enumerate(chromatic_notes):
        scale_name = f"{note}:maj"
        
        degrees = librosa.key_to_degrees(scale_name)
        # Add octave for correct wrapping
        degrees = np.concatenate((degrees, [degrees[0] + SEMITONES_IN_OCTAVE]))
        
        # Find distance to nearest allowed degree
        distances = np.abs(midi_f0[:, np.newaxis] - degrees[np.newaxis, :])
        min_dists = np.min(distances, axis=1)
        
        # Sum the errors (how much we would have to tune)
        total_error = np.sum(min_dists)
        
        # Update winner
        if total_error < min_error:
            min_error = total_error
            best_major_idx = i

    major_tonic = best_major_idx
    major_dom = (best_major_idx + 7) % 12
    
    minor_tonic = (best_major_idx - 3) % 12
    minor_dom = (minor_tonic + 7) % 12

    def count_hits(target_idx):
        dist = np.abs(midi_f0 - target_idx)
        dist = np.minimum(dist, 12 - dist)
        return np.sum(dist < 0.5)

    maj_score = count_hits(major_tonic) * 1.0 + count_hits(major_dom) * 0.5
    min_score = count_hits(minor_tonic) * 1.0 + count_hits(minor_dom) * 0.5
    
    # Decide between major or its relative minor
    if min_score > maj_score:
        return f'{chromatic_notes[minor_tonic]}:min'
    return f'{chromatic_notes[major_tonic]}:maj'

def autotune(audio, sr, scale, alpha, plot):
    frame_length = 2048
    hop_length = frame_length // 2
    fmin = librosa.note_to_hz('G1')
    fmax = librosa.note_to_hz('C8')

    # Track Pitch
    f0, _, _ = librosa.pyin(
        audio, frame_length=frame_length, hop_length=hop_length, sr=sr, fmin=fmin, fmax=fmax
    )

    # Compute RMS energy per frame
    rms = librosa.feature.rms(
        y=audio,
        frame_length=frame_length,
        hop_length=hop_length
    )[0]

    energy_threshold = 0.02 * np.max(rms)

    # Set f0 to NaN for silent frames
    f0[rms < energy_threshold] = np.nan

    # Detect key if not provided
    if scale is None:
        scale = detect_key(f0)
        print(f"Detected Key: {scale}")
        # Store the detected key in module for access from main.py
        globals()['detected_key'] = scale

    # Interpolate NaNs (Fixes PSOLA issues)
    f0_continuous = interpolate_nans(f0)

    # Calculate Target Pitch (The "Grid")
    target_f0 = get_target_pitch(f0_continuous, scale)

    # Calculate the Delta (Correction Amount)
    delta = target_f0 - f0_continuous

    # Smooth the Delta (Savgol Filter)
    smoothed_delta = sig.savgol_filter(delta, window_length=7, polyorder=3)

    # Apply Correction with Strength (Alpha)
    corrected_f0 = f0_continuous + (smoothed_delta * alpha)

    # Pitch-shifting (PSOLA)
    # PSOLA receives the clean, interpolated, naturally corrected pitch
    processed = psola.vocode(audio, sample_rate=int(sr), target_pitch=corrected_f0, fmin=fmin, fmax=fmax)

    # Create a time axis for frames (seconds)
    time_points = librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=hop_length)

    # Apply smoothing to the pitch data for better visualization in frontend
    # This preserves the original processing for audio but smooths the visualization
    f0_smoothed = smooth_pitch_contours(f0.copy())
    corrected_f0_smoothed = smooth_pitch_contours(corrected_f0.copy())

    # Return processed audio plus pitch diagnostics
    return processed, sr, time_points, f0_smoothed, corrected_f0_smoothed

def main():
    # filepath = Path("audio/tumko_dekha.mp3")
    filepath = Path("audio/aapki_amit.mp3")
    
    # Load audio
    y, sr = librosa.load(str(filepath), sr=None, mono=False)
    if y.ndim > 1:
        y = y[0, :]

    # target_scale = 'C:maj'
    # target_scale = 'chromatic'
    
    # alpha=1.0 is hard correction (but smoothed), alpha=0.5 is subtle
    processed, sr_out, time_points, f0, corrected_f0 = autotune(y, sr, scale=None, alpha=1)

    filepath = filepath.parent / (filepath.stem + '_natural_tuned' + filepath.suffix)
    sf.write(str(filepath), processed, sr_out)

if __name__=='__main__':
    main()
