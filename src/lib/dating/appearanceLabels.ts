const BLOCKED =
  /\b(race|ethnicity|ethnic|skin|complexion|body|weight|obese|skinny|age|disabled|disability|illness|attractive|attractiveness|handsome|pretty|ugly)\b/i;

export function slugifyAppearance(label: string): string {
  return label
    .toLowerCase()
    .replace(/grey/g, "gray")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Returns a slug, or null when the label must not be stored. */
export function acceptAppearanceLabel(label: string): string | null {
  const trimmed = label.trim();
  if (trimmed.length < 2 || trimmed.length > 40) return null;
  if (!/^[a-z0-9 -]+$/i.test(trimmed)) return null;
  if (BLOCKED.test(trimmed)) return null;
  const slug = slugifyAppearance(trimmed);
  if (slug.length < 2) return null;
  return slug;
}

export type AppearanceProposal = { label: string; confidence: number };

const KINDS = [
  "eyeColor",
  "hairColor",
  "hairStyle",
  "facialHair",
  "appearance",
  "clothing",
  "setting",
] as const;

export type AppearanceKind = (typeof KINDS)[number];

export function parseAppearanceResponse(text: string): Record<AppearanceKind, AppearanceProposal[]> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const result = {} as Record<AppearanceKind, AppearanceProposal[]>;
  for (const kind of KINDS) {
    const raw = parsed[kind];
    if (!Array.isArray(raw)) return null;
    result[kind] = raw.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { label?: unknown; confidence?: unknown };
      if (typeof row.label !== "string" || typeof row.confidence !== "number") return [];
      return [{ label: row.label, confidence: row.confidence }];
    });
  }
  return result;
}

export function acceptedProposals(items: AppearanceProposal[]): { slug: string; label: string; confidence: number }[] {
  const bySlug = new Map<string, { label: string; confidence: number }>();
  for (const item of items) {
    if (item.confidence < 0.6) continue;
    const slug = acceptAppearanceLabel(item.label);
    if (!slug) continue;
    const current = bySlug.get(slug);
    if (!current || item.confidence > current.confidence) {
      bySlug.set(slug, { label: item.label.trim(), confidence: item.confidence });
    }
  }
  return [...bySlug.entries()].map(([slug, value]) => ({ slug, ...value }));
}
