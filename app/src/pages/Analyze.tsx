import {useEffect, useState} from 'react';
import CsvNotice from '../components/analyze/CsvNotice';
import QueryBuilder from '../components/analyze/QueryBuilder';
import SearchForm from '../components/analyze/SearchForm';
import RightRail from '../components/analyze/RightRail';
import ResultsPanel from '../components/analyze/ResultsPanel';
import { getSettings } from '../lib/settings';

export default function Analyze(){
  const settings = getSettings(); // model/temp/region already persisted
  const [headlines,setHeadlines] = useState<Array<{title:string,url?:string,source?:string}>>([]);
  const [loadingHL,setLoadingHL] = useState(true);
  const [result,setResult] = useState<any>(null);
  const [error,setError] = useState<string>();

  // headlines (right rail)
  useEffect(()=>{
    let stop=false;
    (async()=>{
      try{
        const r = await fetch(`/api/trends?query=sneakers`);
        const j = await r.json();
        if(!stop) setHeadlines((j.items||[]).slice(0,6));
      }catch{ /* ignore */ }
      finally{ if(!stop) setLoadingHL(false); }
    })();
    return ()=>{stop=true};
  },[]);

  // composed query from query builder (only when CSV provides options)
  const handleCompose = (frag:string)=>{
    const el = document.getElementById('analyze-textarea') as HTMLTextAreaElement|null;
    if(!el) return;
    const v = el.value.trim();
    el.value = v ? `${v} ${frag}` : frag;
    el.dispatchEvent(new Event('input',{bubbles:true}));
  };

  const runQuick = async (q:string)=>{
    setError(undefined); setResult(null);
    try{
      const r = await fetch('/api/quick', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({q, settings})});
      const j = await r.json(); setResult(j);
    }catch(e:any){ setError('Quick analysis failed.'); }
  };

  const runDeep = async (q:string)=>{
    setError(undefined); setResult(null);
    try{
      const r = await fetch('/api/deep', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({q, model:settings.model, temperature:settings.temperature, region:settings.regionPreset, reasoningLevel:settings.reasoningLevel})});
      const j = await r.json(); setResult(j);
    }catch(e:any){ setError('Deep analysis failed.'); }
  };

  // TODO: wire these when CSV store is reintroduced
  const mockOptions:any[] = []; // hide QueryBuilder if empty
  const hasCsv = false; // hide CSV banners for now, per product direction

  return (
    <div style={{maxWidth:'1200px', margin:'0 auto', padding:'20px'}}>
      <h1 style={{fontSize:'clamp(28px,3vw,40px)', fontWeight:700, margin:'10px 0 16px'}}>AI Buyer Assistant</h1>

      <div className="grid" style={{gridTemplateColumns:'minmax(0,1fr) 360px', gap:'16px'}}>
        {/* Left column */}
        <div className="space-y-3">
          <CsvNotice hasCsv={hasCsv}/>
          <div id="hero" className="space-y-3">
            <SearchForm
              defaultModel={settings.model}
              temp={settings.temperature}
              region={settings.regionPreset}
              onQuick={runQuick}
              onDeep={runDeep}
            />
            <textarea id="analyze-textarea" style={{display:'none'}} />
          </div>
          <QueryBuilder
            collections={mockOptions}
            categories={mockOptions}
            colors={mockOptions}
            genders={mockOptions}
            onCompose={handleCompose}
          />
          <ResultsPanel result={result} error={error}/>
        </div>

        {/* Right rail */}
        <RightRail headlines={headlines} loading={loadingHL}/>
      </div>
    </div>
  );
}
