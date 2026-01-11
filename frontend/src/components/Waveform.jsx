import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function Waveform({ url, base64 }) {
  const containerRef = useRef();
  const wsRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    wsRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#93c5fd',
      progressColor: '#2563eb',
      height: 100,
    });
    wsRef.current.on('finish', () => setLoaded(true));
    return () => wsRef.current.destroy();
  }, []);

  // Watch for changes in props and load accordingly
  useEffect(() => {
    if (!wsRef.current) return;

    let blobUrl = url;
    let isInternalUrl = false;

    // Convert base64 to blob URL if needed
    if (!url && base64) {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      blobUrl = URL.createObjectURL(blob);
      isInternalUrl = true;
    }

    if (blobUrl) {
      wsRef.current.load(blobUrl);
      setLoaded(true);
    }

    return () => {
      if (isInternalUrl && blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [url, base64]);

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
      </div>
    </div>
  );
}
