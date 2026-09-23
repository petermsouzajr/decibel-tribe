export type AppearanceProfile = {
  eyeColor: string[];
  hairColor: string[];
  hairStyle: string[];
  facialHair: string[];
  appearance: string[];
};

export type AppearanceQuery = AppearanceProfile;

const KEYS = ["eyeColor", "hairColor", "hairStyle", "facialHair", "appearance"] as const;

export function emptyAppearanceProfile(): AppearanceProfile {
  return { eyeColor: [], hairColor: [], hairStyle: [], facialHair: [], appearance: [] };
}

export function hasAppearanceQuery(query: AppearanceQuery): boolean {
  return KEYS.some((key) => query[key].length > 0);
}

/** Every selected group must match. Several slugs in one group mean any of them. */
export function profileMatchesAppearance(profile: AppearanceProfile, query: AppearanceQuery): boolean {
  return KEYS.every((key) => {
    if (query[key].length === 0) return true;
    const have = new Set(profile[key]);
    return query[key].some((slug) => have.has(slug));
  });
}
