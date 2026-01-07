import React, {useState, useRef} from 'react'
import Waveform from './components/Waveform'
import PitchGraph from './components/PitchGraph'

const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

export default function App(){
  const [file, setFile] = useState(null)
  const [key, setKey] = useState('C')
  const [autoKey, setAutoKey] = useState(false)
  const [correction, setCorrection] = useState(0.5)
  const [tunedAudio, setTunedAudio] = useState(null)
  const [time, setTime] = useState([])
  const [pitchOriginal, setPitchOriginal] = useState([])
  const [pitchTuned, setPitchTuned] = useState([])
  const waveformRef = useRef()

  async function handleTune(){
    if(!file) return
    const form = new FormData()
    form.append('audio_file', file)
    form.append('key', key)
    form.append('auto_key', autoKey ? '1' : '0')
    form.append('correction', String(correction))

    const res = await fetch('/tune', {method:'POST', body: form})
    if(!res.ok) { alert('Tune failed'); return }
    const json = await res.json()
    setTunedAudio(json.audio_base64)
    setTime(json.time || [])
    setPitchOriginal(json.pitch_original || [])
    setPitchTuned(json.pitch_tuned || [])
    // load into waveform component via ref
    if(waveformRef.current){
      waveformRef.current.loadBase64(json.audio_base64)
    }
  }

  function handleFile(e){
    const f = e.target.files[0]
    setFile(f)
  }

  return (
    <div className="h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto h-full grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Controls</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Upload</label>
              <input type="file" accept="audio/*" onChange={handleFile} />
            </div>
            <div>
              <label className="block text-sm font-medium">Key</label>
              <select value={key} onChange={e=>setKey(e.target.value)} className="mt-1">
                {KEYS.map(k=> <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="flex items-center">
              <input id="auto" type="checkbox" checked={autoKey} onChange={e=>setAutoKey(e.target.checked)} />
              <label htmlFor="auto" className="ml-2 text-sm">Auto-detect key</label>
            </div>
            <div>
              <label className="block text-sm font-medium">Correction: {correction}</label>
              <input type="range" min="0" max="1" step="0.01" value={correction} onChange={e=>setCorrection(Number(e.target.value))} />
            </div>
            <div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleTune}>Tune</button>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow flex flex-col">
          <h2 className="text-lg font-semibold mb-3">Output</h2>
          <div className="flex-1">
            <Waveform ref={waveformRef} />
            <div className="mt-4">
              <PitchGraph time={time} original={pitchOriginal} tuned={pitchTuned} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
