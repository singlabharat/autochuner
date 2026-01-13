from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import base64
import io
import numpy as np
import soundfile as sf
import librosa

import autotuner as at

app = FastAPI()

@app.get("/")
def health():
    return {"ok": True}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://autochuner.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def numpy_to_json_safe(arr):
    """
    Fast conversion of numpy array to list with None for NaNs.
    """
    # Create a mask for valid values
    is_nan = np.isnan(arr)
    # Convert to object array to allow mixed types (float and None)
    out = arr.astype(object)
    out[is_nan] = None
    return out.tolist()

@app.post('/tune')
def tune(
    audio_file: UploadFile = File(...),
    key: str = Form(None),
    auto_key: str = Form('0'),
    correction: float = Form(0.5),
):
    # Load Audio with error handling
    try:
        audio, sr = librosa.load(audio_file.file, sr=22050, mono=True)
    except Exception as e:
        return JSONResponse({'error': 'Please upload a supported format (WAV, MP3, etc.)'}, status_code=400)

    # Setup Parameters
    scale = None if auto_key == '1' else key

    # Run DSP (The heavy lifting)
    try:
        processed, sr_out, time_points, f0, corrected_f0 = at.autotune(
            audio, sr, scale, correction
        )
        # Get the actual scale used (will be the detected key if scale was None)
        actual_scale = scale if scale is not None else getattr(at, 'detected_key', 'C:maj')
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({'error': str(e)}, status_code=500)

    # Export Audio
    out_buf = io.BytesIO()
    sf.write(out_buf, processed, sr_out, format='WAV')
    b64 = base64.b64encode(out_buf.getvalue()).decode('ascii')

    # Process Pitch Data (Vectorized Optimization)
    # Convert Hz to MIDI in one go
    pitch_original_midi = librosa.hz_to_midi(f0)
    pitch_tuned_midi = librosa.hz_to_midi(corrected_f0)

    # Convert to JSON-friendly lists (handling NaNs)
    pitch_original = numpy_to_json_safe(pitch_original_midi)
    pitch_tuned = numpy_to_json_safe(pitch_tuned_midi)

    # Prepare response
    response_data = {
        'audio_base64': b64,
        'time': time_points.tolist(),
        'pitch_original': pitch_original,
        'pitch_tuned': pitch_tuned,
    }
    
    # Include detected key if auto key was used
    if auto_key == '1':
        response_data['detected_key'] = actual_scale

    return JSONResponse(response_data)