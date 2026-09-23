import prisma from "@/lib/prisma";
import {
  emptyAppearanceProfile,
  hasAppearanceQuery,
  profileMatchesAppearance,
  type AppearanceProfile,
  type AppearanceQuery,
} from "./appearanceMatch";

type AdvancedPreferences = {
  preferredEyeColors?: string[];
  preferredHairColors?: string[];
  preferredHairStyles?: string[];
  preferredFacialHair?: string[];
  preferredAppearances?: string[];
};

export function appearanceQueryFromPreferences(preferences: AdvancedPreferences): AppearanceQuery {
  return {
    eyeColor: preferences.preferredEyeColors ?? [],
    hairColor: preferences.preferredHairColors ?? [],
    hairStyle: preferences.preferredHairStyles ?? [],
    facialHair: preferences.preferredFacialHair ?? [],
    appearance: preferences.preferredAppearances ?? [],
  };
}

export async function filterMatchesByAppearance<T extends { id: string }>(
  matches: T[],
  preferences: AdvancedPreferences,
  viewerIsIDVerified: boolean,
): Promise<T[]> {
  const query = appearanceQueryFromPreferences(preferences);
  if (!viewerIsIDVerified || !hasAppearanceQuery(query) || matches.length === 0) return matches;

  const ids = matches.map((match) => match.id);
  const [eyes, hair, styles, facial, looks] = await Promise.all([
    prisma.userEyeColor.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, eyeColor: { select: { slug: true } } },
    }),
    prisma.userHairColor.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, hairColor: { select: { slug: true } } },
    }),
    prisma.userHairStyle.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, hairStyle: { select: { slug: true } } },
    }),
    prisma.userFacialHair.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, facialHair: { select: { slug: true } } },
    }),
    prisma.userAppearance.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, appearance: { select: { slug: true } } },
    }),
  ]);

  const profiles = new Map<string, AppearanceProfile>();
  for (const id of ids) profiles.set(id, emptyAppearanceProfile());
  for (const row of eyes) profiles.get(row.userId)?.eyeColor.push(row.eyeColor.slug);
  for (const row of hair) profiles.get(row.userId)?.hairColor.push(row.hairColor.slug);
  for (const row of styles) profiles.get(row.userId)?.hairStyle.push(row.hairStyle.slug);
  for (const row of facial) profiles.get(row.userId)?.facialHair.push(row.facialHair.slug);
  for (const row of looks) profiles.get(row.userId)?.appearance.push(row.appearance.slug);

  return matches.filter((match) => {
    const profile = profiles.get(match.id) ?? emptyAppearanceProfile();
    return profileMatchesAppearance(profile, query);
  });
}
