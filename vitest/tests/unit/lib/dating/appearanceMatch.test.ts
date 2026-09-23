import { describe, expect, it } from "vitest";
import { acceptAppearanceLabel, acceptedProposals, parseAppearanceResponse } from "@/lib/dating/appearanceLabels";
import { emptyAppearanceProfile, profileMatchesAppearance } from "@/lib/dating/appearanceMatch";

describe("appearance matching", () => {
  it("treats several labels in one group as any of them", () => {
    const profile = { ...emptyAppearanceProfile(), eyeColor: ["green"] };
    expect(
      profileMatchesAppearance(profile, { ...emptyAppearanceProfile(), eyeColor: ["blue", "green"] }),
    ).toBe(true);
  });

  it("requires every selected group to match", () => {
    const profile = { ...emptyAppearanceProfile(), eyeColor: ["green"], hairColor: ["black"] };
    expect(
      profileMatchesAppearance(profile, {
        ...emptyAppearanceProfile(),
        eyeColor: ["green"],
        hairColor: ["blonde"],
      }),
    ).toBe(false);
  });

  it("ignores empty groups and drops someone missing a selected trait", () => {
    const profile = emptyAppearanceProfile();
    expect(profileMatchesAppearance(profile, emptyAppearanceProfile())).toBe(true);
    expect(
      profileMatchesAppearance(profile, { ...emptyAppearanceProfile(), hairStyle: ["buzz-cut"] }),
    ).toBe(false);
  });
});

describe("appearance labels", () => {
  it("stores gray and grey as one slug", () => {
    expect(acceptAppearanceLabel("Grey")).toBe("gray");
    expect(acceptAppearanceLabel("Gray")).toBe("gray");
  });

  it("rejects race, body size, and attractiveness", () => {
    expect(acceptAppearanceLabel("ethnicity")).toBeNull();
    expect(acceptAppearanceLabel("slim body")).toBeNull();
    expect(acceptAppearanceLabel("very attractive")).toBeNull();
  });

  it("keeps a confident new style label and drops a weak one", () => {
    const parsed = parseAppearanceResponse(
      '{"eyeColor":[{"label":"Green","confidence":0.9}],"hairColor":[],"hairStyle":[{"label":"Wolf cut","confidence":0.8},{"label":"Maybe","confidence":0.2}],"facialHair":[],"appearance":[],"clothing":[],"setting":[]}',
    );
    expect(parsed).not.toBeNull();
    expect(acceptedProposals(parsed!.hairStyle).map((row) => row.slug)).toEqual(["wolf-cut"]);
  });
});
