import React, {useEffect, useRef} from 'react'
import Plotly from 'plotly.js-dist-min'

export default function PitchGraph({time=[], original=[], tuned=[]}){
  const ref = useRef()

  useEffect(()=>{
    const traces = []
    if(original.length){
      traces.push({x: time, y: original, mode:'lines', name:'Original', line:{dash:'dash'}, connectgaps:false})
    }
    if(tuned.length){
      traces.push({x: time, y: tuned, mode:'lines', name:'Tuned', line:{dash:'solid'}, connectgaps:false})
    }
    const layout = {margin:{t:20,l:40,r:20,b:40}, xaxis:{title:'Time (s)'}, yaxis:{title:'MIDI note'}}
    Plotly.react(ref.current, traces, layout, {responsive:true})
  }, [time, original, tuned])

  return <div ref={ref} style={{width:'100%',height:300}} />
}
