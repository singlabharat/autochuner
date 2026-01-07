from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import base64
import io
import numpy as np
import soundfile as sf
import librosa
import uvicorn

import autotuner as at

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def list_from_np(arr, mask_nan_as_none=False):
    out = []
    for v in np.asarray(arr):
        if np.isnan(v):
            out.append(None if mask_nan_as_none else None)
        else:
            out.append(float(v))
    return out


@app.post('/tune')
async def tune(
    audio_file: UploadFile = File(...),
    key: str = Form(None),
    auto_key: str = Form('0'),
    correction: float = Form(1.0),
):
    # Read bytes
    data = await audio_file.read()
    bio = io.BytesIO(data)

    # Use soundfile to read in-memory file
    try:
        audio, sr = sf.read(bio)
    except Exception:
        # fallback to librosa loader
        bio.seek(0)
        audio, sr = librosa.load(bio, sr=None, mono=False)

    if audio.ndim > 1:
        # mix all channels to mono
        audio = np.mean(audio, axis=1)

    # Determine scale
    scale = None if auto_key == '1' else (key or None)

    processed, sr_out, time_points, f0, corrected_f0 = at.autotune(audio, sr, scale, correction, plot=False)

    # Convert processed audio to WAV bytes
    out_buf = io.BytesIO()
    sf.write(out_buf, processed, sr_out, format='WAV')
    out_bytes = out_buf.getvalue()
    b64 = base64.b64encode(out_bytes).decode('ascii')

    # Convert pitch arrays to MIDI and mask unvoiced frames
    # original f0 may have NaNs; tuned pitch should be None where original was unvoiced
    pitch_original = []
    pitch_tuned = []
    for orig, tuned in zip(f0, corrected_f0):
        if np.isnan(orig):
            pitch_original.append(None)
            pitch_tuned.append(None)
        else:
            pitch_original.append(float(librosa.hz_to_midi(orig)))
            pitch_tuned.append(float(librosa.hz_to_midi(tuned)))

    return JSONResponse({
        'audio_base64': b64,
        'time': [float(x) for x in time_points],
        'pitch_original': pitch_original,
        'pitch_tuned': pitch_tuned,
    })


if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000, reload=True)
