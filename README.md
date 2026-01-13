# AutoChuner

**Link:** [https://autochuner.vercel.app/](https://autochuner.vercel.app/)

AutoChuner is an automatic pitch correction application that allows users to upload audio files and apply real-time pitch correction with visualization.

## Features

- Upload audio files for pitch correction
- Select key modes (Major, Minor, Chromatic)
- Auto-detect key functionality
- Adjustable correction strength
- Waveform display pitch visualisation for input and output audio
- Download processed audio file

## Frontend Architecture

- React-based user interface
- Tailwind CSS for styling
- Plotly.js for pitch visualisation
- Wavesurfer.js for audio waveform display
- Real-time server health monitoring

## Backend Architecture

- Python FastAPI-based REST API
- Audio processing using librosa, soundfile, scipy, and psola
- Efficient pitch detection and correction algorithms
- Health check endpoint for server monitoring
- CORS support for web application integration

## Running Locally

To run AutoChuner locally, follow these steps:

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the FastAPI server:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

The backend server will be available at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

3. Update the `BACKEND_URL` in `src/App.jsx` to point to your local backend:

   ```javascript
   const BACKEND_URL = 'http://localhost:8000';
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` (or another available port).
