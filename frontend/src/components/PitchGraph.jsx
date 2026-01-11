import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

// Function to convert MIDI number to note name
function midiToNoteName(midi) {
  if (midi === null || midi === undefined || isNaN(midi)) return null;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteIndex = Math.round(midi) % 12;
  const octave = Math.floor(midi / 12) - 1; // MIDI 12 is C0, MIDI 0-11 are C-1 and below
  return noteNames[noteIndex] + octave;
}

export default function PitchGraph({ time = [], original = [], tuned = [] }) {
  const ref = useRef();

  useEffect(() => {
    const traces = [];
    if (original.length) {
      traces.push({
        x: time,
        y: original,
        mode: 'lines',
        name: 'Original',
        line: { dash: 'solid' },
        connectgaps: false,
      });
    }
    if (tuned.length) {
      traces.push({
        x: time,
        y: tuned,
        mode: 'lines',
        name: 'Tuned',
        line: { dash: 'solid' },
        connectgaps: false,
      });
    }

    // Get all unique MIDI values for the y-axis
    const allYValues = [...original, ...tuned].filter((y) => y !== null && !isNaN(y));
    if (allYValues.length === 0) {
      const layout = {
        margin: { t: 20, l: 40, r: 20, b: 40 },
        xaxis: { title: 'Time (s)' },
        yaxis: { title: 'Note' },
      };
      Plotly.react(ref.current, traces, layout, { responsive: true });
      return;
    }

    // Find min and max values to create a range
    const minVal = Math.floor(Math.min(...allYValues));
    const maxVal = Math.ceil(Math.max(...allYValues));

    // Create ticks for the y-axis - include all note names from min to max
    const yTickVals = [];
    const yTickTexts = [];

    // Include every MIDI number in the range to show all note names
    for (let i = Math.floor(minVal); i <= Math.ceil(maxVal); i++) {
      yTickVals.push(i);
      yTickTexts.push(midiToNoteName(i));
    }

    const layout = {
      margin: { t: 20, l: 60, r: 20, b: 40 },
      xaxis: { title: 'Time (s)' },
      yaxis: {
        title: 'Note',
        tickvals: yTickVals,
        ticktext: yTickTexts,
      },
    };
    Plotly.react(ref.current, traces, layout, { responsive: true });
  }, [time, original, tuned]);

  return <div ref={ref} style={{ width: '100%', height: 400 }} />;
}
