interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, className = "", style, showLabel = false }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`pb ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div style={{ width: `${percentage}%` }} />
      {showLabel && <span className="sr-only">{percentage}%</span>}
    </div>
  );
}