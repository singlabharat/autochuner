import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function Waveform({ url, base64 }) {
  const containerRef = useRef();
  const wsRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Set colors based on dark/light mode
    const isDarkMode = document.documentElement.classList.contains('dark');
    const waveColor = isDarkMode ? '#60a5fa' : '#93c5fd'; // light blue
    const progressColor = isDarkMode ? '#3b82f6' : '#2563eb'; // blue

    wsRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: waveColor,
      progressColor: progressColor,
      height: 100,
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
    });

    wsRef.current.on('finish', () => {
      setLoaded(true);
      setIsPlaying(false);
    });

    wsRef.current.on('play', () => {
      setIsPlaying(true);
    });

    wsRef.current.on('pause', () => {
      setIsPlaying(false);
    });

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

  const togglePlayPause = () => {
    if (wsRef.current) {
      wsRef.current.playPause();
    }
  };

  return (
    <div className='waveform-container'>
      <div ref={containerRef} />
      <div className='mt-3 flex justify-center'>
        <button
          className='btn-icon p-3'
          onClick={togglePlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
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
                d='M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          ) : (
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
                d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
