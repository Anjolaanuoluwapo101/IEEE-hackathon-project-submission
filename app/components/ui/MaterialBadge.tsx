"use client";

type Material =
  | "pet"
  | "hdpe"
  | "paper"
  | "glass"
  | "aluminum"
  | "metal"
  | "organic"
  | "e_waste"
  | "tires"
  | "plastic"
  | "general_mixed_recyclables";

const MATERIAL_LABELS: Record<Material, string> = {
  pet: "PET",
  hdpe: "HDPE",
  paper: "Paper",
  glass: "Glass",
  aluminum: "Aluminium",
  metal: "Metal",
  organic: "Organic",
  e_waste: "E-waste",
  tires: "Tires",
  plastic: "Plastic",
  general_mixed_recyclables: "Mixed",
};

const MATERIAL_COLORS: Record<Material, { bg: string; text: string }> = {
  pet: { bg: "bg-[#E8F5E9]", text: "text-[#1B5E20]" },
  hdpe: { bg: "bg-[#E3F2FD]", text: "text-[#0D47A1]" },
  paper: { bg: "bg-[#FFF3E0]", text: "text-[#E65100]" },
  glass: { bg: "bg-[#F3E5F5]", text: "text-[#4A148C]" },
  aluminum: { bg: "bg-[#ECEFF1]", text: "text-[#37474F]" },
  metal: { bg: "bg-[#ECEFF1]", text: "text-[#37474F]" },
  organic: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]" },
  e_waste: { bg: "bg-[#FBE9E7]", text: "text-[#BF360C]" },
  tires: { bg: "bg-[#EFEBE9]", text: "text-[#3E2723]" },
  plastic: { bg: "bg-[#E8F5E9]", text: "text-[#1B5E20]" },
  general_mixed_recyclables: { bg: "bg-[#F5F5F5]", text: "text-[#616161]" },
};

interface MaterialBadgeProps {
  material: string;
  size?: "sm" | "md" | "lg";
}

export function MaterialBadge({ material, size = "md" }: MaterialBadgeProps) {
  const normalized = material.toLowerCase().replace(/\s+/g, "_") as Material;
  const label = MATERIAL_LABELS[normalized] || material.toUpperCase();
  const colors = MATERIAL_COLORS[normalized] || { bg: "bg-neutral-100", text: "text-neutral-700" };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-semibold ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  );
}