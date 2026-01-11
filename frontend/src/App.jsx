import React, { useState, useEffect } from 'react';
import Waveform from './components/Waveform';
import PitchGraph from './components/PitchGraph';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function App() {
  const [file, setFile] = useState(null);
  const [inputUrl, setInputUrl] = useState(null);
  const [key, setKey] = useState('Chromatic');
  const [autoKey, setAutoKey] = useState(false);
  const [correction, setCorrection] = useState(0.5);
  const [tunedAudio, setTunedAudio] = useState(null);
  const [time, setTime] = useState([]);
  const [pitchOriginal, setPitchOriginal] = useState([]);
  const [pitchTuned, setPitchTuned] = useState([]);
  const [detectedKey, setDetectedKey] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tunedAudioUrl, setTunedAudioUrl] = useState(null);

  async function handleTune() {
    if (!file) return;
    setIsProcessing(true);
    const form = new FormData();
    form.append('audio_file', file);
    form.append('key', key);
    form.append('auto_key', autoKey ? '1' : '0');
    form.append('correction', String(correction));

    try {
      const res = await fetch('http://127.0.0.1:8000/tune', { method: 'POST', body: form });
      if (!res.ok) {
        alert('Tune failed');
        return;
      }
      const json = await res.json();

      setTunedAudio(json.audio_base64);
      setTime(json.time || []);
      setPitchOriginal(json.pitch_original || []);
      setPitchTuned(json.pitch_tuned || []);
      // Handle detected key if auto key was used
      if (json.detected_key) setDetectedKey(json.detected_key);

      if (inputUrl) URL.revokeObjectURL(inputUrl); // Clean old one
      const newUrl = URL.createObjectURL(file);
      setInputUrl(newUrl);
      
      // Create URL for tuned audio
      if (tunedAudioUrl) URL.revokeObjectURL(tunedAudioUrl); // Clean old one
      const tunedBlob = new Blob([
        Uint8Array.from(atob(json.audio_base64), c => c.charCodeAt(0))
      ], { type: 'audio/wav' });
      const tunedUrl = URL.createObjectURL(tunedBlob);
      setTunedAudioUrl(tunedUrl);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDownload() {
    if (!tunedAudioUrl) {
      alert('No tuned audio available for download');
      return;
    }
    
    const link = document.createElement('a');
    link.href = tunedAudioUrl;
    link.download = 'tuned_audio.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleFile(e) {
    const f = e.target.files[0];
    setFile(f);
  }

  // Cleanup URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (inputUrl) URL.revokeObjectURL(inputUrl);
      if (tunedAudioUrl) URL.revokeObjectURL(tunedAudioUrl);
    };
  }, [inputUrl, tunedAudioUrl]);

  return (
    <div className='h-screen p-4 bg-gray-50'>
      <div className='max-w-6xl mx-auto h-full grid grid-cols-1 md:grid-cols-3 gap-4'>
        {/* --- LEFT COLUMN (CONTROLS) --- */}
        <div className='bg-white p-4 rounded shadow md:col-span-1'>
          <h2 className='text-lg font-semibold mb-3'>Controls</h2>
          <div className='space-y-3'>
            <div>
              <label className='block text-sm font-medium'>Upload</label>
              <input type='file' accept='audio/*' onChange={handleFile} />
            </div>
            <div className='flex items-center'>
              <input
                id='auto'
                type='checkbox'
                checked={autoKey}
                onChange={(e) => setAutoKey(e.target.checked)}
              />
              <label htmlFor='auto' className='ml-2 text-sm'>
                Auto-detect key
              </label>
            </div>
            {!autoKey && (
              <div>
                <label className='block text-sm font-medium'>Key</label>
                <select value={key} onChange={(e) => setKey(e.target.value)} className='mt-1'>
                  <option value='chromatic'>Chromatic</option>
                  {KEYS.map((k) => (
                    <option key={k} value={`${k}:maj`}>
                      {k} Major
                    </option>
                  ))}
                </select>
              </div>
            )}
            {autoKey && detectedKey && (
              <div className='text-sm text-gray-600'>
                Detected Key: <span className='font-semibold'>{detectedKey}</span>
              </div>
            )}
            <div>
              <label className='block text-sm font-medium'>Correction: {correction}</label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.01'
                value={correction}
                onChange={(e) => setCorrection(Number(e.target.value))}
              />
            </div>
            <div>
              <button
                className='px-4 py-2 bg-blue-600 text-white rounded'
                onClick={handleTune}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className='flex items-center'>
                    <svg
                      className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Tune'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN (VISUALS) --- */}
        <div className='bg-white p-4 rounded shadow flex flex-col md:col-span-2 overflow-y-auto'>
          {time.length === 0 && !tunedAudio ? (
            <div className='flex flex-col items-center justify-center h-full text-center'>
              <h1 className='text-3xl font-bold text-gray-800 mb-4'>Autotuner</h1>
              <p className='text-gray-600 max-w-md'>A web-based audio pitch correction tool...</p>
            </div>
          ) : (
            <div className='flex-1'>
              {inputUrl && (
                <div className='mb-6'>
                  <h2 className='text-lg font-semibold mb-3'>Input Audio</h2>
                  <Waveform url={inputUrl} />
                </div>
              )}

              <div className='mb-6'>
                <div className='flex justify-between items-center'>
                  <h2 className='text-lg font-semibold mb-3'>Output Audio</h2>
                  {tunedAudioUrl && (
                    <button
                      className='px-3 py-1 bg-blue-600 text-white rounded text-sm'
                      onClick={handleDownload}
                    >
                      Download Tuned Audio
                    </button>
                  )}
                </div>
                <Waveform base64={tunedAudio} />
              </div>

              <div className='mt-4'>
                <PitchGraph time={time} original={pitchOriginal} tuned={pitchTuned} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
