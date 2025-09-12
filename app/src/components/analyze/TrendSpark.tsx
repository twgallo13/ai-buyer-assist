type Props = { values: number[]; width?: number; height?: number; stroke?: string };
export default function TrendSpark({ values, width = 160, height = 46, stroke = 'var(--accent)' }: Props) {
  if (!values?.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const norm = (v: number) => max === min ? height / 2 : height - ((v - min) / (max - min)) * height;
  const step = width / (values.length - 1);
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${norm(v)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="trend sparkline">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}
