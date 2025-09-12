import React from 'react';

type Props = { hasCsv: boolean };

export default function CsvNotice({ hasCsv }: Props) {
    if (hasCsv) return null;
    return (
        <div className="card p-3">
            <div className="text-sm">
                <strong>Running without Sales Anchors.</strong> AI will infer from public trend signals; confidence may be lower.
            </div>
        </div>
    );
}