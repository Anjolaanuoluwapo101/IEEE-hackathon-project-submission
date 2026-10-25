interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className = "", style, padding = "md" }: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={`card ${paddingClasses[padding]} ${className}`} style={style}>
      {children}
    </div>
  );
}

interface DarkPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: "none" | "sm" | "md" | "lg";
}

export function DarkPanel({ children, className = "", style, padding = "md" }: DarkPanelProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={`dark ${paddingClasses[padding]} ${className}`} style={style}>
      {children}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: "dark" | "light" | "success";
  icon?: React.ReactNode;
}

export function StatTile({ label, value, subtext, variant = "light", icon }: StatTileProps) {
  const variantClasses = {
    dark: "dark",
    light: "card",
    success: "dark",
  };

  return (
    <div className={`${variantClasses[variant]} ${paddingClasses.md}`}>
      {icon && <div className="mb-2">{icon}</div>}
      <div className="eye" style={{ color: variant === "dark" || variant === "success" ? "#9FE9C3" : undefined }}>
        {label}
      </div>
      <div className="d" style={{ fontSize: "3.5rem", marginTop: "0.625rem" }}>
        {value}
      </div>
      {subtext && (
        <div className="text-sm font-semibold mt-1" style={{ color: variant === "dark" || variant === "success" ? "#BFF3D8" : "#566B60" }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};