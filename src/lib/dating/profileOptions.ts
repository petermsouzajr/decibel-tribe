export type SelectOption = { label: string; value: string };

export const JOB_OPTIONS: SelectOption[] = [
  { label: "Artist / Musician", value: "music" },
  { label: "Creative (Design / Media)", value: "creative" },
  { label: "Technology", value: "tech" },
  { label: "Business / Finance", value: "business" },
  { label: "Coaching / Consulting", value: "coaching_consulting" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Education", value: "education" },
  { label: "Hospitality / Service", value: "hospitality" },
  { label: "Trades", value: "trades" },
  { label: "Government", value: "government" },
  { label: "Non-profit", value: "nonprofit" },
  { label: "Sales", value: "sales" },
  { label: "Self-employed", value: "self_employed" },
  { label: "Student", value: "student" },
  { label: "Marketing", value: "marketing" },
  { label: "Unemployed", value: "unemployed" },
  { label: "Other", value: "other" },
];

export const PETS_OPTIONS: SelectOption[] = [
  { label: "No pets", value: "none" },
  { label: "Dog(s)", value: "dogs" },
  { label: "Cat(s)", value: "cats" },
  { label: "Dog(s) & Cat(s)", value: "dogs_and_cats" },
  { label: "Rabbit(s)", value: "rabbits" },
  { label: "Bird(s)", value: "birds" },
  { label: "Fish(es)", value: "fish" },
  { label: "Reptile(s)", value: "reptiles" },
  { label: "Other", value: "other" },
];

export const BODY_TYPE_OPTIONS: SelectOption[] = [
  { label: "Slim", value: "slim" },
  { label: "Athletic", value: "athletic" },
  { label: "Average", value: "average" },
  { label: "Curvy", value: "curvy" },
  { label: "Muscular", value: "muscular" },
  { label: "Plus-size", value: "plus_size" },
  { label: "Other", value: "other" },
];

function findLabel(options: SelectOption[], value: string | null | undefined): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? null;
}

export function getJobLabel(value: string | null | undefined): string | null {
  return findLabel(JOB_OPTIONS, value);
}

export function getPetsLabel(value: string | null | undefined): string | null {
  return findLabel(PETS_OPTIONS, value);
}

export function getBodyTypeLabel(value: string | null | undefined): string | null {
  return findLabel(BODY_TYPE_OPTIONS, value);
}

export function getPetsLabels(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => getPetsLabel(v) ?? v)
    .filter((v): v is string => !!v && v.trim().length > 0);
}

/**
 * Back-compat: if legacy free-text values exist in DB, map them into a supported option
 * so dropdowns don't show empty values.
 */
export function normalizeJobValue(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (JOB_OPTIONS.some((o) => o.value === v)) return v;

  const lower = v.toLowerCase();
  if (/(musician|artist|band|dj|producer|guitar|drummer|singer)/.test(lower)) return "music";
  if (/(design|designer|phot|video|film|media|writer|marketing|content)/.test(lower)) return "creative";
  if (/(engineer|developer|software|tech|it|data|product|qa)/.test(lower)) return "tech";
  if (/(finance|account|bank|sales|consult|business)/.test(lower)) return "business";
  if (/(nurse|doctor|health|therapy|therapist|clinic|medical)/.test(lower)) return "healthcare";
  if (/(teacher|professor|education|school|tutor)/.test(lower)) return "education";
  if (/(restaurant|bar|server|chef|hospitality|hotel)/.test(lower)) return "hospitality";
  if (/(electric|plumb|carpenter|construction|trade|mechanic)/.test(lower)) return "trades";
  if (/(government|public|military|army|navy|air force)/.test(lower)) return "government";
  if (/(nonprofit|non-profit|charity)/.test(lower)) return "nonprofit";
  if (/(self employed|self-employed|freelance|contractor)/.test(lower)) return "self_employed";
  if (/(student)/.test(lower)) return "student";
  if (/(unemployed|between jobs)/.test(lower)) return "unemployed";

  return "other";
}

export function normalizePetsValue(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (PETS_OPTIONS.some((o) => o.value === v)) return v;

  const lower = v.toLowerCase();
  const hasDog = /(dog|dogs|puppy|puppies)/.test(lower);
  const hasCat = /(cat|cats|kitten|kittens)/.test(lower);
  const hasRabbit = /(rabbit|rabbits|bunny|bunnies)/.test(lower);
  const hasBird = /(bird|birds|parrot|parakeet|canary)/.test(lower);
  const hasFish = /(fish|fishes|goldfish|betta)/.test(lower);
  const hasReptile = /(reptile|reptiles|snake|lizard|gecko|iguana|turtle)/.test(lower);
  if (/(none|no pets)/.test(lower)) return "none";
  if (hasDog && hasCat) return "dogs_and_cats";
  if (hasDog) return "dogs";
  if (hasCat) return "cats";
  if (hasRabbit) return "rabbits";
  if (hasBird) return "birds";
  if (hasFish) return "fish";
  if (hasReptile) return "reptiles";
  return "other";
}

export function normalizePetsArray(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => normalizePetsValue(typeof v === "string" ? v : String(v)))
      .filter((v) => !!v);
  }
  if (typeof value === "string") {
    const v = normalizePetsValue(value);
    return v ? [v] : [];
  }
  const v = normalizePetsValue(String(value));
  return v ? [v] : [];
}

export function normalizeBodyTypeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const v = String(value).trim();
  if (!v) return "";
  if (BODY_TYPE_OPTIONS.some((o) => o.value === v)) return v;

  const lower = v.toLowerCase();
  if (lower === "other") return "other";
  if (/(slim|thin)/.test(lower)) return "slim";
  if (/(athletic|fit)/.test(lower)) return "athletic";
  if (/(average|medium)/.test(lower)) return "average";
  if (/(curvy)/.test(lower)) return "curvy";
  if (/(muscular|muscle)/.test(lower)) return "muscular";
  if (/(plus|plus-size|plussize)/.test(lower)) return "plus_size";
  return "";
}

