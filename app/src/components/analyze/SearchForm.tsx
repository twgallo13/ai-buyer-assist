import React, {useState} from 'react';

type Props = {
  defaultModel:string; temp:number; region:string;
  onQuick:(q:string)=>void;
  onDeep:(q:string)=>void;
};

export default function SearchForm({defaultModel,temp,region,onQuick,onDeep}:Props){
  const [q,setQ] = useState('');
  return (
    <div className="card p-4">
      <div className="muted text-xs mb-2">Model: {defaultModel} · Temp: {temp.toFixed(2)} · Region: {region}</div>
      <textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="Paste SKU / product / brand / collection…" rows={3} className="card p-3 w-full" />
      <div className="flex gap-2 mt-3">
        <button className="btn" onClick={()=>onQuick(q)}>Run Quick</button>
        <button className="btn btn-primary" onClick={()=>onDeep(q)}>Run Deep</button>
      </div>
    </div>
  );
}