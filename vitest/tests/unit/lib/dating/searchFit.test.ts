import { describe, expect, it } from "vitest";
import { profileFitsPreferences, type FitPreferences, type FitProfile } from "@/lib/dating/searchFit";

function person(overrides: Partial<FitProfile> = {}): FitProfile {
  return {
    age: 28,
    height: 66,
    gender: "female",
    sexualOrientation: "straight",
    coronavirusVaccinated: null,
    religion: null,
    hasKids: null,
    wantsKids: null,
    smokes: null,
    drinks: null,
    activity: null,
    relationshipType: null,
    diet: null,
    politicalViews: null,
    education: null,
    bodyType: null,
    pets: [],
    instruments: [],
    skills: [],
    isIDVerified: false,
    ...overrides,
  };
}

function prefs(overrides: Partial<FitPreferences> = {}): FitPreferences {
  return {
    preferredGender: JSON.stringify([{ gender: "female", sexualOrientation: ["straight"] }]),
    preferredSexualOrientation: null,
    preferredMinAge: 18,
    preferredMaxAge: 130,
    preferredMinHeight: 36,
    preferredMaxHeight: 94,
    preferredMaxDistanceKm: 10000,
    preferredCoronavirusVaccinated: null,
    preferredReligions: [],
    preferredHasKids: null,
    preferredWantsKids: null,
    preferredSmokes: null,
    preferredDrinks: null,
    preferredActivity: [],
    preferredRelationshipType: [],
    preferredDiet: [],
    preferredPoliticalViews: [],
    preferredEducation: [],
    preferredBodyType: null,
    preferredPets: [],
    preferredInstruments: [],
    preferredSkills: [],
    idVerificationFilter: "show_all",
    ...overrides,
  };
}

describe("profileFitsPreferences", () => {
  it("includes someone inside an age range", () => {
    expect(
      profileFitsPreferences(person({ age: 28 }), prefs({ preferredMinAge: 25, preferredMaxAge: 35 }), null),
    ).toBe(true);
  });

  it("excludes someone outside an age range", () => {
    expect(
      profileFitsPreferences(person({ age: 42 }), prefs({ preferredMinAge: 25, preferredMaxAge: 35 }), null),
    ).toBe(false);
  });

  it("treats 18 to 130 as any age", () => {
    expect(
      profileFitsPreferences(person({ age: 42 }), prefs({ preferredMinAge: 18, preferredMaxAge: 130 }), null),
    ).toBe(true);
  });

  it("excludes a gender the search is not looking for", () => {
    expect(
      profileFitsPreferences(person({ gender: "male" }), prefs(), null),
    ).toBe(false);
  });

  it("does not filter gender when the search has no gender preference", () => {
    expect(
      profileFitsPreferences(person({ gender: "male" }), prefs({ preferredGender: null }), null),
    ).toBe(true);
  });

  it("excludes someone farther than the max distance", () => {
    expect(
      profileFitsPreferences(person(), prefs({ preferredMaxDistanceKm: 16 }), 40),
    ).toBe(false);
  });

  it("ignores distance when the search is anywhere", () => {
    expect(
      profileFitsPreferences(person(), prefs({ preferredMaxDistanceKm: 10000 }), 4000),
    ).toBe(true);
  });

  it("requires a published instrument when that filter is set", () => {
    expect(
      profileFitsPreferences(
        person({ instruments: ["Piano"] }),
        prefs({ preferredInstruments: ["Guitar"] }),
        null,
      ),
    ).toBe(false);
    expect(
      profileFitsPreferences(
        person({ instruments: ["Guitar"] }),
        prefs({ preferredInstruments: ["Guitar"] }),
        null,
      ),
    ).toBe(true);
  });
});
