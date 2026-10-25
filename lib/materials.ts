export const CANONICAL_MATERIALS = [
  "pet",
  "hdpe",
  "plastic",
  "paper",
  "glass",
  "metal",
  "aluminum",
  "organic",
  "e_waste",
  "tires",
  "general_mixed_recyclables",
] as const;

export type CanonicalMaterial = (typeof CANONICAL_MATERIALS)[number];

const ALIASES: Record<string, CanonicalMaterial> = {
  pet: "pet",
  pet_plastic: "pet",
  pet_bottles: "pet",
  plastic_bottles: "pet",
  hdpe: "hdpe",
  hdpe_plastic: "hdpe",
  plastic: "plastic",
  mixed_plastic: "plastic",
  soft_plastic: "plastic",
  paper: "paper",
  paper_cardboard: "paper",
  cardboard: "paper",
  carton: "paper",
  glass: "glass",
  glass_bottles: "glass",
  metal: "metal",
  metals: "metal",
  steel: "metal",
  steel_cans: "metal",
  tin_cans: "metal",
  scrap_metal: "metal",
  aluminum: "aluminum",
  aluminium: "aluminum",
  organic: "organic",
  organic_compost: "organic",
  compost: "organic",
  food_waste: "organic",
  e_waste: "e_waste",
  ewaste: "e_waste",
  electronic_waste: "e_waste",
  electronics: "e_waste",
  tires: "tires",
  tyres: "tires",
  general_mixed_recyclables: "general_mixed_recyclables",
  mixed: "general_mixed_recyclables",
  mixed_recyclables: "general_mixed_recyclables",
};

const FACTOR_KEYS: Record<CanonicalMaterial, string[]> = {
  pet: ["pet", "pet_plastic"],
  hdpe: ["hdpe", "hdpe_plastic"],
  plastic: ["plastic", "general_mixed_recyclables"],
  paper: ["paper", "paper_cardboard"],
  glass: ["glass"],
  metal: ["metal", "steel_cans", "steel"],
  aluminum: ["aluminum", "aluminium"],
  organic: ["organic", "organic_compost", "compost"],
  e_waste: ["e_waste", "ewaste"],
  tires: ["tires", "tyres"],
  general_mixed_recyclables: ["general_mixed_recyclables", "mixed"],
};

export const MATERIAL_LABELS: Record<CanonicalMaterial, string> = {
  pet: "PET plastic",
  hdpe: "HDPE plastic",
  plastic: "Mixed plastic",
  paper: "Paper & cardboard",
  glass: "Glass",
  metal: "Metal",
  aluminum: "Aluminium",
  organic: "Organic waste",
  e_waste: "E-waste",
  tires: "Tyres",
  general_mixed_recyclables: "Mixed recyclables",
};

/**
 * Fallback table cited by the PRD (EPA AP-42 / IPCC AR6).
 * config.json and emissions_factors.json override these values.
 */
export const DEFAULT_EMISSION_FACTORS: Record<CanonicalMaterial, number> = {
  pet: 2.1,
  hdpe: 1.9,
  plastic: 1.0,
  paper: 1.2,
  glass: 0.4,
  metal: 1.8,
  aluminum: 9.3,
  organic: 0.8,
  e_waste: 1.5,
  tires: 1.3,
  general_mixed_recyclables: 1.0,
};

/** Demo price table in NGN per kg; config.json overrides these values. */
export const DEFAULT_PRICES_NGN: Record<CanonicalMaterial, number> = {
  pet: 250,
  hdpe: 220,
  plastic: 150,
  paper: 90,
  glass: 50,
  metal: 180,
  aluminum: 350,
  organic: 40,
  e_waste: 300,
  tires: 80,
  general_mixed_recyclables: 60,
};

export function normalizeMaterial(value: unknown): CanonicalMaterial | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return ALIASES[key] ?? null;
}

export function factorKeys(material: CanonicalMaterial): string[] {
  return FACTOR_KEYS[material];
}

export function materialLabel(value: unknown): string {
  const canonical = normalizeMaterial(value);
  return canonical ? MATERIAL_LABELS[canonical] : String(value ?? "");
}
