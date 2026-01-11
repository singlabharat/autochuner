import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

// Removed forwardRef, we don't need it anymore
export default function Waveform({ audioBase64 }) {
  const containerRef = useRef();
  const wsRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // 1. Initialize WaveSurfer on Mount
  useEffect(() => {
    wsRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#93c5fd',
      progressColor: '#2563eb',
      height: 120,
      normalize: true, // Helpful for making the waveform look "full"
    });

    // Handle interaction
    wsRef.current.on('finish', () => setLoaded(true)); // Just to ensure state updates

    return () => wsRef.current.destroy();
  }, []);

  // 2. Watch for changes in audio data and load it
  useEffect(() => {
    if (!audioBase64 || !wsRef.current) return;

    const blob = base64ToBlob(audioBase64);
    const url = URL.createObjectURL(blob);

    wsRef.current.load(url);
    setLoaded(true);

    // Cleanup URL to avoid memory leaks
    return () => URL.revokeObjectURL(url);
  }, [audioBase64]);

  function base64ToBlob(b64) {
    const byteCharacters = atob(b64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'audio/wav' });
  }

  return (
    <div>
      <div ref={containerRef} />
      <div className='mt-2 flex gap-2'>
        <button
          className='px-3 py-1 bg-green-600 text-white rounded'
          onClick={() => wsRef.current && wsRef.current.playPause()}
        >
          Play/Pause
        </button>
        <a
          className='px-3 py-1 bg-gray-200 rounded cursor-pointer'
          onClick={(e) => {
            if (!wsRef.current || !loaded) return;
            // Generate blob for download on click
            wsRef.current.getArrayBuffer().then((buf) => {
              const blob = new Blob([buf], { type: 'audio/wav' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'tuned.wav';
              a.click();
              URL.revokeObjectURL(url);
            });
          }}
        >
          Download
        </a>
      </div>
    </div>
  );
}
