"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "available"
    | "claimed"
    | "pending"
    | "registered"
    | "recycled"
    | "in_transit"
    | "flagged"
    | "new";
  size?: "sm" | "md";
  style?: React.CSSProperties;
  className?: string;
}

export function Badge({ children, variant = "available", size = "md", style, className = "" }: BadgeProps) {
  const variantClasses = {
    available: "bg-mint text-emerald",
    claimed: "bg-line-light text-muted",
    pending: "bg-amber-soft text-amber",
    registered: "bg-teal-soft text-teal",
    recycled: "bg-teal-soft text-teal",
    in_transit: "bg-info-soft text-info",
    flagged: "bg-danger-soft text-danger",
    new: "bg-lime text-ink",
  };

  const sizeClasses = {
    sm: "h-5.5 text-xs px-2.5",
    md: "h-7 text-sm px-3",
  };

  return (
    <span className={`bd ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} style={style}>
      <i />
      {children}
    </span>
  );
}