import React from 'react';

type Headline = { title: string; url?: string; source?: string };
type Props = { headlines: Headline[]; loading: boolean };

export default function RightRail({ headlines, loading }: Props) {
    return (
        <div className="space-y-3">
            <div className="card p-3">
                <div className="font-semibold mb-2">AI Headlines</div>
                {loading ? <div className="muted text-sm">Loading signals…</div> :
                    (headlines.length ? headlines.map((h, i) => (
                        <a key={i} href={h.url} target="_blank" rel="noreferrer" className="block text-sm mb-1">
                            {h.title} {h.source ? <span className="muted">· {h.source}</span> : null}
                        </a>
                    )) : <div className="muted text-sm">No headlines right now.</div>)
                }
            </div>
            <div className="card p-3">
                <div className="font-semibold mb-2">Tips</div>
                <ul className="list-disc ml-5 text-sm">
                    <li>Paste SKU or catalog title.</li>
                    <li>Add color or material terms.</li>
                    <li>Use "vs" to compare styles.</li>
                </ul>
            </div>
        </div>
    );
}