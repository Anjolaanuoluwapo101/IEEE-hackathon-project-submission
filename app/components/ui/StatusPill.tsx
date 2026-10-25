"use client";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  registered: { bg: "bg-green-100", text: "text-green-800", label: "Registered" },
  in_transit: { bg: "bg-blue-100", text: "text-blue-800", label: "In transit" },
  received: { bg: "bg-green-100", text: "text-green-800", label: "Received" },
  flagged: { bg: "bg-amber-100", text: "text-amber-800", label: "Flagged" },
  retired: { bg: "bg-neutral-100", text: "text-neutral-800", label: "Retired" },
};

const SIZE_STYLES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

interface StatusPillProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusPill({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const style = STATUS_STYLES[status] || { bg: "bg-neutral-100", text: "text-neutral-800", label: status };
  const sizeClass = SIZE_STYLES["md"];

  return (
    <span className={`inline-flex items-center ${SIZE_STYLES[size]} rounded-full font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}