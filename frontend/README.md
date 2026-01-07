# Autotuner Frontend

Development

1. Install deps

```bash
npm install
```

2. Run dev server

```bash
npm run dev
```

The frontend expects a backend POST `/tune` at the same origin. The backend should return JSON with `audio_base64`, `time`, `pitch_original`, `pitch_tuned`.
