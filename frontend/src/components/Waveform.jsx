import React, {useEffect, useImperativeHandle, forwardRef, useRef, useState} from 'react'
import WaveSurfer from 'wavesurfer.js'

const Waveform = forwardRef((props, ref) => {
  const containerRef = useRef()
  const wsRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(()=>{
    wsRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#93c5fd',
      progressColor: '#2563eb',
      height: 120,
    })
    return ()=> wsRef.current.destroy()
  },[])

  useImperativeHandle(ref, ()=>({
    async loadBase64(b64){
      const blob = base64ToBlob(b64)
      const url = URL.createObjectURL(blob)
      wsRef.current.load(url)
      setLoaded(true)
    }
  }))

  function base64ToBlob(b64){
    const byteCharacters = atob(b64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i=0;i<byteCharacters.length;i++) byteNumbers[i]=byteCharacters.charCodeAt(i)
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], {type: 'audio/wav'})
  }

  return (
    <div>
      <div ref={containerRef} />
      <div className="mt-2 flex gap-2">
        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>wsRef.current.playPause()}>Play/Pause</button>
        <a className="px-3 py-1 bg-gray-200 rounded" download="tuned.wav" onClick={(e)=>{
          if(!wsRef.current || !loaded) return
          wsRef.current.getArrayBuffer().then(buf=>{
            const blob = new Blob([buf], {type:'audio/wav'})
            const url = URL.createObjectURL(blob)
            e.currentTarget.href = url
          })
        }}>Download</a>
      </div>
    </div>
  )
})

export default Waveform
