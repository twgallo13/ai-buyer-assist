import React, {useEffect,useMemo,useState} from 'react';
import TrendSpark from './TrendSpark';
type Headline = { title:string; url?:string; source?:string };
type Props = { headlines:Headline[]; loading:boolean };

const REGIONS = [
    {label:'Global', value:'global'},
    {label:'Central CA', value:'central-ca'},
    {label:'Las Vegas NV', value:'las-vegas'},
    {label:'Texas (limited)', value:'texas'},
    {label:'Seattle WA (limited)', value:'seattle'},
];

export default function RightRail({headlines,loading}:Props){
    const saved = typeof localStorage!=='undefined' ? localStorage.getItem('rightRail.region') : null;
    const [region,setRegion] = useState<string>(saved||'global');
    const [items,setItems] = useState<Headline[]>(headlines);
    const [busy,setBusy] = useState<boolean>(loading);

    // recompute “index” and sparkline (simple heuristic)
    const {index,series} = useMemo(()=>{
        const len = items.length;
        const idx = Math.min(100, Math.round(len * 12)); // 0..100 by count
        // create a small series from title lengths (stable-ish)
        const base = items.slice(0,8).map(h=>Math.min(100, (h.title?.length||20)%100));
        return { index: idx, series: base.length? base : [25,35,40,30,45,60,55,65] };
    },[items]);

    useEffect(()=>{
        let stop=false;
        (async ()=>{
            try{
                setBusy(true);
                const r = await fetch(`/api/trends?query=sneakers&region=${encodeURIComponent(region)}`);
                const j = await r.json();
                if(!stop) setItems((j.items||[]).slice(0,6));
            }catch{
                if(!stop) setItems([]);
            }finally{
                if(!stop) setBusy(false);
            }
        })();
        if(typeof localStorage!=='undefined') localStorage.setItem('rightRail.region', region);
        return ()=>{stop=true};
    },[region]);

    return (
        <div className="space-y-3">
            <div className="card p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">AI Headlines</div>
                    <select
                        className="card p-1 text-sm"
                        value={region}
                        onChange={(e)=>setRegion(e.target.value)}
                        aria-label="Region filter"
                    >
                        {REGIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>
                {busy ? <div className="muted text-sm">Loading signals…</div> :
                    (items.length? items.map((h,i)=>(
                        <a key={i} href={h.url} target="_blank" rel="noreferrer" className="block text-sm mb-1">
                            {h.title} {h.source ? <span className="muted">· {h.source}</span>:null}
                        </a>
                    )) : <div className="muted text-sm">No headlines right now.</div>)
                }
            </div>

            <div className="card p-3">
                <div className="font-semibold mb-1">Trend Index</div>
                <div className="muted text-sm mb-2">Composite signal strength for “sneakers”</div>
                <TrendSpark values={series}/>
                <div className="text-sm mt-2">Index: <strong>{index}</strong> / 100</div>
            </div>

            <div className="card p-3">
                <div className="font-semibold mb-2">Tips</div>
                <ul className="list-disc ml-5 text-sm">
                    <li>Paste SKU or catalog title.</li>
                    <li>Add color or material terms.</li>
                    <li>Use “vs” to compare styles.</li>
                </ul>
            </div>
        </div>
    );
}