import { canAppearInIdVerifiedFilter } from "./verificationTiers";

export type GenderPreference = {
  gender: string;
  sexualOrientation: string[];
};

/** Fields on the person being tested against someone else's filters. */
export type FitProfile = {
  age: number | null;
  height: number | null;
  gender: string | null;
  sexualOrientation: string | null;
  coronavirusVaccinated: string | null;
  religion: string | null;
  hasKids: boolean | null;
  wantsKids: string | null;
  smokes: string | null;
  drinks: string | null;
  activity: string | null;
  relationshipType: string | null;
  diet: string | null;
  politicalViews: string | null;
  education: string | null;
  bodyType: string | null;
  pets: string[];
  instruments: string[];
  skills: string[];
  isIDVerified: boolean;
  hasPersonPerks: boolean;
  hasIdPerks: boolean;
};

/** Active search settings. Empty or "any" values do not exclude anyone. */
export type FitPreferences = {
  preferredGender: string | null;
  preferredSexualOrientation: string | null;
  preferredMinAge: number | null;
  preferredMaxAge: number | null;
  preferredMinHeight: number | null;
  preferredMaxHeight: number | null;
  preferredMaxDistanceKm: number | null;
  preferredCoronavirusVaccinated: string | null;
  preferredReligions: string[];
  preferredHasKids: string | null;
  preferredWantsKids: string | null;
  preferredSmokes: string | null;
  preferredDrinks: string | null;
  preferredActivity: string[];
  preferredRelationshipType: string[];
  preferredDiet: string[];
  preferredPoliticalViews: string[];
  preferredEducation: string[];
  preferredBodyType: string | null;
  preferredPets: string[];
  preferredInstruments: string[];
  preferredSkills: string[];
  idVerificationFilter: string | null;
};

export function parseGenderPreferences(
  raw: string | null | undefined,
  legacyOrientation?: string | null,
): GenderPreference[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((p) => p && p.gender)
        .map((p) => ({
          gender: String(p.gender),
          sexualOrientation: Array.isArray(p.sexualOrientation)
            ? p.sexualOrientation.map(String)
            : p.sexualOrientation
              ? [String(p.sexualOrientation)]
              : [],
        }));
    }
    if (typeof parsed === "string") {
      return [{
        gender: parsed,
        sexualOrientation: legacyOrientation ? [legacyOrientation] : [],
      }];
    }
  } catch {
    return [{
      gender: raw,
      sexualOrientation: legacyOrientation ? [legacyOrientation] : [],
    }];
  }
  return [{
    gender: raw,
    sexualOrientation: legacyOrientation ? [legacyOrientation] : [],
  }];
}

/** Matches the Filters screen: min 18 and max 130 means Any age. */
export function isAnyAge(min: number | null | undefined, max: number | null | undefined) {
  if (min == null || max == null) return true;
  return min <= 18 && max >= 130;
}

/** Matches the Filters screen: 36" to 94" means Any height. Missing bounds also mean Any. */
export function isAnyHeight(min: number | null | undefined, max: number | null | undefined) {
  if (min == null || max == null) return true;
  return min <= 36 && max >= 94;
}

/** Matches the Filters screen: 9000km or more means Anywhere. */
export function isAnywhere(km: number | null | undefined) {
  if (km == null) return true;
  return km >= 9000;
}

function norm(value: string | null | undefined) {
  return value ? value.toLowerCase().trim() : null;
}

function normReligion(value: string | null | undefined) {
  const v = norm(value);
  if (!v) return null;
  const mapping: Record<string, string> = {
    christian: "christianity",
    catholic: "catholicism",
    jewish: "judaism",
    muslim: "islam",
    atheist: "atheism",
    agnostic: "agnosticism",
  };
  return mapping[v] || v;
}

function listHas(values: string[] | null | undefined, value: string | null) {
  if (!values || values.length === 0) return true;
  if (!value) return false;
  const wanted = new Set(values.map((v) => norm(v)).filter(Boolean));
  return wanted.has(norm(value));
}

/**
 * True when `person` satisfies `prefs`.
 * Discover uses the viewer's prefs against each candidate.
 * Into You uses each candidate's prefs against the viewer.
 */
export function profileFitsPreferences(
  person: FitProfile,
  prefs: FitPreferences,
  distanceKm: number | null,
): boolean {
  const genders = parseGenderPreferences(prefs.preferredGender, prefs.preferredSexualOrientation);
  const gendered = genders.filter((p) => p.gender && p.sexualOrientation.length > 0);
  if (gendered.length > 0) {
    if (!person.gender || !person.sexualOrientation) return false;
    const matchesGender = gendered.some((pref) => {
      const genderMatch = pref.gender.toLowerCase() === person.gender!.toLowerCase();
      const orientationMatch = pref.sexualOrientation.some(
        (orientation) => orientation.toLowerCase() === person.sexualOrientation!.toLowerCase(),
      );
      return genderMatch && orientationMatch;
    });
    if (!matchesGender) return false;
  }

  if (!isAnyAge(prefs.preferredMinAge, prefs.preferredMaxAge)) {
    if (person.age == null || person.age < prefs.preferredMinAge! || person.age > prefs.preferredMaxAge!) {
      return false;
    }
  }

  if (!isAnyHeight(prefs.preferredMinHeight, prefs.preferredMaxHeight)) {
    if (
      person.height == null ||
      person.height < prefs.preferredMinHeight! ||
      person.height > prefs.preferredMaxHeight!
    ) {
      return false;
    }
  }

  if (!isAnywhere(prefs.preferredMaxDistanceKm) && distanceKm != null) {
    if (distanceKm > prefs.preferredMaxDistanceKm!) return false;
  }

  const idFilter = prefs.idVerificationFilter || "show_all";
  const hasIdAccess = canAppearInIdVerifiedFilter({
    isIDVerified: person.isIDVerified,
    hasPersonPerks: person.hasPersonPerks,
    hasIdPerks: person.hasIdPerks,
  });
  if (idFilter === "show_id_verified_only" && !hasIdAccess) return false;
  if (idFilter === "show_unverified_only" && hasIdAccess) return false;

  if (prefs.preferredCoronavirusVaccinated) {
    const wanted = norm(prefs.preferredCoronavirusVaccinated);
    const actual = norm(person.coronavirusVaccinated);
    if (!wanted || !actual || wanted !== actual) return false;
  }

  if (prefs.preferredReligions.length > 0) {
    const wanted = new Set(prefs.preferredReligions.map(normReligion).filter(Boolean));
    const actual = normReligion(person.religion);
    if (!actual || !wanted.has(actual)) return false;
  }

  if (prefs.preferredHasKids && norm(prefs.preferredHasKids) !== "any") {
    const wantsKids = norm(prefs.preferredHasKids) === "yes";
    if (person.hasKids !== wantsKids) return false;
  }

  if (prefs.preferredWantsKids && norm(prefs.preferredWantsKids) !== "any") {
    const actual = norm(person.wantsKids) === "not_sure" ? "maybe" : norm(person.wantsKids);
    if (actual !== norm(prefs.preferredWantsKids)) return false;
  }

  if (prefs.preferredSmokes && norm(person.smokes) !== norm(prefs.preferredSmokes)) return false;
  if (prefs.preferredDrinks && norm(person.drinks) !== norm(prefs.preferredDrinks)) return false;
  if (!listHas(prefs.preferredActivity, person.activity)) return false;
  if (!listHas(prefs.preferredRelationshipType, person.relationshipType)) return false;
  if (!listHas(prefs.preferredDiet, person.diet)) return false;
  if (!listHas(prefs.preferredPoliticalViews, person.politicalViews)) return false;
  if (!listHas(prefs.preferredEducation, person.education)) return false;
  if (prefs.preferredBodyType && norm(person.bodyType) !== norm(prefs.preferredBodyType)) return false;

  if (prefs.preferredPets.length > 0) {
    const wanted = new Set(prefs.preferredPets.map(norm));
    const hasPet = person.pets.some((pet) => wanted.has(norm(pet)));
    if (!hasPet) return false;
  }

  return true;
}
