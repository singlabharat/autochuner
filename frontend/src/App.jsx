import React, { useState, useEffect } from 'react';
import Waveform from './components/Waveform';
import PitchGraph from './components/PitchGraph';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['Major', 'Minor', 'Chromatic'];

export default function App() {
  const [file, setFile] = useState(null);
  const [inputUrl, setInputUrl] = useState(null);
  const [note, setNote] = useState('C');
  const [mode, setMode] = useState('Major');
  const [autoKey, setAutoKey] = useState(false);
  const [correction, setCorrection] = useState(0.5);
  const [tunedAudio, setTunedAudio] = useState(null);
  const [time, setTime] = useState([]);
  const [pitchOriginal, setPitchOriginal] = useState([]);
  const [pitchTuned, setPitchTuned] = useState([]);
  const [detectedKey, setDetectedKey] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tunedAudioUrl, setTunedAudioUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  async function handleTune() {
    if (!file) return;
    setIsProcessing(true);
    const form = new FormData();
    form.append('audio_file', file);
    form.append('key', autoKey ? 'None' : mode === 'Chromatic' ? 'chromatic' : `${note}:${mode}`);
    form.append('auto_key', autoKey ? '1' : '0');
    form.append('correction', String(correction));

    try {
      const res = await fetch('https://autochuner.onrender.com/tune', {
        method: 'POST',
        body: form,
      });
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
      const tunedBlob = new Blob(
        [Uint8Array.from(atob(json.audio_base64), (c) => c.charCodeAt(0))],
        { type: 'audio/wav' }
      );
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
    <div
      className={`min-h-screen p-4 transition-colors duration-300 ${
        darkMode ? 'dark bg-gray-900' : 'light bg-gray-50'
      }`}
    >
      <div className='max-w-7xl mx-auto h-full'>
        {/* Header */}
        <header className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent'>
            AutoChuner
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className='p-2 rounded-full hover:bg-gray-700 transition-colors'
            aria-label='Toggle dark mode'
          >
            {darkMode ? (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                />
              </svg>
            ) : (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                />
              </svg>
            )}
          </button>
        </header>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]'>
          {/* --- CONTROLS PANEL --- */}
          <div className='card p-5 md:col-span-1 h-full flex flex-col'>
            <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
                />
              </svg>
              Controls
            </h2>
            <div className='space-y-5 flex-1'>
              <div>
                <label className='block text-sm font-medium mb-2'>Upload Audio</label>
                <div className='relative'>
                  <input
                    type='file'
                    accept='audio/*'
                    onChange={handleFile}
                    className='input file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700'
                  />
                </div>
              </div>

              <div className='flex items-center'>
                <input
                  id='auto'
                  type='checkbox'
                  checked={autoKey}
                  onChange={(e) => setAutoKey(e.target.checked)}
                  className='w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500'
                />
                <label htmlFor='auto' className='ml-2 text-sm'>
                  Auto-detect key
                </label>
              </div>

              {!autoKey && (
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-sm font-medium mb-2'>Mode</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className='input w-full'
                    >
                      {MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  {mode !== 'Chromatic' && (
                    <div>
                      <label className='block text-sm font-medium mb-2'>Note</label>
                      <select
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className='input w-full'
                      >
                        {NOTES.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {autoKey && detectedKey && (
                <div className='text-sm bg-indigo-900/30 p-3 rounded-lg'>
                  <span className='font-semibold text-indigo-500'>Detected Key:</span>{' '}
                  <span className='font-medium'>{detectedKey}</span>
                </div>
              )}

              <div>
                <label className='block text-sm font-medium'>
                  Correction: {Math.round(correction * 100)}%
                </label>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.01'
                  value={correction}
                  onChange={(e) => setCorrection(Number(e.target.value))}
                  className='slider'
                />
              </div>

              <div className='pt-2'>
                <button
                  className='btn btn-primary w-full py-3'
                  onClick={handleTune}
                  disabled={isProcessing || !file}
                >
                  {isProcessing ? (
                    <span className='flex items-center justify-center'>
                      <svg
                        className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
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
                    <span className='flex items-center justify-center gap-2'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-5 w-5'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                        />
                      </svg>
                      Tune Audio
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* --- VISUALIZATION PANEL --- */}
          <div className='card p-5 flex flex-col md:col-span-2 h-full overflow-y-auto'>
            {time.length === 0 && !tunedAudio ? (
              <div className='flex flex-col items-center justify-center h-full text-center'>
                <div className='mb-6'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-24 w-24 mx-auto text-gray-500'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1}
                      d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                    />
                  </svg>
                </div>
                <h2 className='text-2xl font-bold mb-2'>Welcome to AutoChuner</h2>
                <p className='text-gray-500 max-w-md'>
                  Upload an audio file to begin pitch correction and visualisation
                </p>
              </div>
            ) : (
              <div className='flex-1 overflow-y-auto'>
                {inputUrl && (
                  <div className='mb-6'>
                    <div className='flex justify-between items-center mb-3'>
                      <h2 className='text-xl font-semibold flex items-center gap-2'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
                          />
                        </svg>
                        Input Audio
                      </h2>
                    </div>
                    <Waveform url={inputUrl} />
                  </div>
                )}

                <div className='mb-6'>
                  <div className='flex justify-between items-center mb-3'>
                    <h2 className='text-xl font-semibold flex items-center gap-2'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-5 w-5'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                        />
                      </svg>
                      Output Audio
                    </h2>
                    {tunedAudioUrl && (
                      <button
                        className='btn-icon'
                        onClick={handleDownload}
                        title='Download Tuned Audio'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <Waveform base64={tunedAudio} />
                </div>

                <div className='mt-4'>
                  <h2 className='text-xl font-semibold mb-3 flex items-center gap-2'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-5 w-5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M7 12l5-5 5 5M7 12l5 5 5-5'
                      />
                    </svg>
                    Pitch Analysis
                  </h2>
                  <PitchGraph time={time} original={pitchOriginal} tuned={pitchTuned} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
