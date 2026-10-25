interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "circle" | "rect";
  width?: string;
  height?: string;
}

export function Skeleton({ className = "", variant = "text", width, height }: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded",
    card: "rounded-xl",
    circle: "rounded-full",
    rect: "rounded-lg",
  };

  return (
    <div
      className={`sk ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6 animate-pulse space-y-4">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="30%" />
      <Skeleton variant="rect" height="120px" />
    </div>
  );
}

export function TableRowSkeleton(columns: number) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 pr-4">
          <Skeleton variant="text" width={i === 0 ? "80px" : "60px"} />
        </td>
      ))}
    </tr>
  );
}