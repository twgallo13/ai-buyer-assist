type Props = {
  label: string;

  /** New API used by the new dashboard */
  value?: number;
  suffix?: string;

  /** When true, higher numbers are good (default). If false, lower is good. */
  goodHigh?: boolean;

  /** Back-compat with older Analyze/Results code */
  score?: number; // old prop name (maps to value)
  tone?: string;  // ignored here (styling handled locally)
  help?: string;  // ignored here (tooltips handled elsewhere)
};

export default function KpiTile({
  label,
  value,
  suffix = "",
  goodHigh = true,
  // back-compat:
  score,
}: Props) {
  // Prefer new `value`; fall back to old `score`
  const raw = value ?? score;
  const isEmpty = raw === undefined || Number.isNaN(Number(raw));

  const numeric = isEmpty ? undefined : Math.round(Number(raw));
  // Simple tone; refine thresholds later if desired
  const tone = isEmpty
    ? "muted"
    : goodHigh
      ? (Number(raw) >= 60 ? "pos" : "warn")
      : (Number(raw) <= 40 ? "pos" : "warn");

  return (
    <div className={`kpi-tile ${tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {isEmpty ? "—" : numeric}
        {isEmpty ? "" : suffix}
      </div>
    </div>
  );
}
