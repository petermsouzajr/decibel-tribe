"use client";

import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import kyInstance from "@/lib/ky";
import HeightSelector from "./HeightSelector";
import DropdownSelector from "./DropdownSelector";
import instrumentList from "@/data/instrumentList.json";
import skillsList from "@/data/skillsList.json";
import { BODY_TYPE_OPTIONS, PETS_OPTIONS } from "@/lib/dating/profileOptions";

interface GenderPreference {
  gender: string;
  sexualOrientation: string[];
}

interface DatingFiltersPanelProps {
  open?: boolean; // Optional for modal mode
  onOpenChange?: (open: boolean) => void; // Optional for modal mode
  onFiltersChange?: () => void; // Optional callback
  asModal?: boolean; // Whether to render as modal or standalone form
}

export default function DatingFiltersPanel({
  open,
  onOpenChange,
  onFiltersChange,
  asModal = true, // Default to modal mode for backward compatibility
}: DatingFiltersPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    preferredGenders: [] as GenderPreference[],
    preferredMinAge: 18,
    preferredMaxAge: 130,
    preferredMinHeight: 36, // 3'0" in inches
    preferredMaxHeight: 94, // 7'10" in inches
    preferredMaxDistance: 50, // miles
    preferredCoronavirusVaccinated: "",
    preferredReligions: [] as string[],
    preferredHasKids: "" as "" | "yes" | "no" | "any",
    preferredWantsKids: "" as "" | "yes" | "no" | "maybe" | "any",
    preferredSmokes: "",
    preferredDrinks: "",
    preferredBodyType: "",
    preferredActivity: [] as string[],
    preferredEducation: [] as string[],
    preferredPoliticalViews: [] as string[],
    preferredDiet: [] as string[],
    preferredRelationshipType: [] as string[],
    preferredPets: [] as string[],
    preferredInstruments: [] as string[],
    preferredSkills: [] as string[],
    matchMusicTastes: true,
    anyAge: false,
    anyHeight: false,
    anyDistance: false,
    // Mix It Up controls
    variabilityLevel: 0, // 0-100% variability slider
    variabilityFilters: [] as string[], // Array of filter names to include in variability (e.g., ["gender", "age", "distance", "height", "hasKids", "wantsKids", "smokes", "drinks", "vaccination", "relationshipType", "activity", "diet", "politicalViews", "education", "religion"])
  });

  useEffect(() => {
    if (asModal && open) {
      fetchPreferences();
    } else if (!asModal) {
      fetchPreferences();
    }
  }, [open, asModal]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await kyInstance
        .get("/api/dating/preferences")
        .json<{
          preferredGender?: string;
          preferredSexualOrientation?: string;
          preferredMinAge: number;
          preferredMaxAge: number;
          preferredMinHeight: number;
          preferredMaxHeight: number;
          preferredMaxDistanceKm: number;
          preferredCoronavirusVaccinated: string;
          preferredReligions: string[];
          preferredBodyType?: string | null;
          preferredHasKids?: string;
          preferredWantsKids?: string;
          preferredSmokes?: string;
          preferredDrinks?: string;
          preferredActivity?: string | string[];
          preferredEducation?: string[];
          preferredPoliticalViews?: string[];
          preferredDiet?: string[];
          preferredRelationshipType?: string[];
          preferredPets?: string[];
          preferredInstruments?: string[];
          preferredSkills?: string[];
          matchMusicTastes?: boolean;
          variabilityLevel?: number;
          variabilityFilters?: string[];
        }>();

      const minAge = response.preferredMinAge || 18;
      const maxAge = response.preferredMaxAge || 130;
      const minHeight = response.preferredMinHeight || 36;
      const maxHeight = response.preferredMaxHeight || 94;
      const maxDistanceKm = response.preferredMaxDistanceKm || 50;
      
      // Parse preferredGender - support both JSON array and single string
      let preferredGenders: GenderPreference[] = [];
      if (response.preferredGender) {
        try {
          const parsed = JSON.parse(response.preferredGender);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Already in array format
            preferredGenders = parsed.map((p: any) => ({
              gender: p.gender || p,
              sexualOrientation: Array.isArray(p.sexualOrientation) ? p.sexualOrientation : (p.sexualOrientation ? [p.sexualOrientation] : [])
            }));
          } else if (typeof parsed === 'string') {
            // Single gender string
            preferredGenders = [{
              gender: parsed,
              sexualOrientation: response.preferredSexualOrientation ? [response.preferredSexualOrientation] : []
            }];
          }
        } catch {
          // Not JSON, treat as single gender string
          if (response.preferredGender) {
            preferredGenders = [{
              gender: response.preferredGender,
              sexualOrientation: response.preferredSexualOrientation ? [response.preferredSexualOrientation] : []
            }];
          }
        }
      }

      setFormData({
        preferredGenders,
        preferredMinAge: minAge,
        preferredMaxAge: maxAge,
        preferredMinHeight: minHeight,
        preferredMaxHeight: maxHeight,
        preferredMaxDistance: Math.round(maxDistanceKm * 0.621371), // Convert km to miles
        preferredCoronavirusVaccinated: response.preferredCoronavirusVaccinated || "",
        preferredReligions: response.preferredReligions || [],
        preferredBodyType: (response as any).preferredBodyType || "",
        preferredHasKids: (response.preferredHasKids as "" | "yes" | "no" | "any") || "",
        preferredWantsKids: (response.preferredWantsKids as "" | "yes" | "no" | "maybe" | "any") || "",
        preferredSmokes: response.preferredSmokes || "",
        preferredDrinks: response.preferredDrinks || "",
        preferredActivity: Array.isArray(response.preferredActivity) ? response.preferredActivity : (response.preferredActivity ? [response.preferredActivity] : []),
        preferredEducation: response.preferredEducation || [],
        preferredPoliticalViews: response.preferredPoliticalViews || [],
        preferredDiet: response.preferredDiet || [],
        preferredRelationshipType: response.preferredRelationshipType || [],
        preferredPets: response.preferredPets || [],
        preferredInstruments: response.preferredInstruments || [],
        preferredSkills: response.preferredSkills || [],
        matchMusicTastes: response.matchMusicTastes ?? true,
        anyAge: minAge === 18 && maxAge === 130,
        anyHeight: minHeight === 36 && maxHeight === 94,
        anyDistance: maxDistanceKm >= 10000,
        variabilityLevel: (response as any).variabilityLevel ?? 0,
        variabilityFilters: (response as any).variabilityFilters || [],
      });
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGenderPreference = (gender: string) => {
    const isSelected = formData.preferredGenders.some(p => p.gender === gender);
    if (isSelected) {
      setFormData({
        ...formData,
        preferredGenders: formData.preferredGenders.filter(p => p.gender !== gender)
      });
    } else {
      setFormData({
        ...formData,
        preferredGenders: [...formData.preferredGenders, { gender, sexualOrientation: [] }]
      });
    }
  };

  const toggleGenderOrientation = (gender: string, orientation: string) => {
    const newGenders = formData.preferredGenders.map(pref => {
      if (pref.gender === gender) {
        const currentOrientations = pref.sexualOrientation || [];
        const isSelected = currentOrientations.includes(orientation);
        return {
          ...pref,
          sexualOrientation: isSelected
            ? currentOrientations.filter(o => o !== orientation)
            : [...currentOrientations, orientation]
        };
      }
      return pref;
    });
    setFormData({ ...formData, preferredGenders: newGenders });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Convert preferredGenders array to JSON string for API
      const preferredGenderJson = formData.preferredGenders.length > 0 
        ? JSON.stringify(formData.preferredGenders)
        : undefined;
      
      await kyInstance.post("/api/dating/preferences", {
        json: {
          preferredGender: preferredGenderJson,
          preferredMinAge: formData.anyAge ? 18 : formData.preferredMinAge,
          preferredMaxAge: formData.anyAge ? 130 : formData.preferredMaxAge,
          preferredMinHeight: formData.anyHeight ? 36 : formData.preferredMinHeight,
          preferredMaxHeight: formData.anyHeight ? 94 : formData.preferredMaxHeight,
          // API expects km in `preferredMaxDistance` (stored as preferredMaxDistanceKm in DB)
          preferredMaxDistance: formData.anyDistance
            ? 10000
            : Math.round(formData.preferredMaxDistance / 0.621371), // Convert miles to km
          // Send `null` to CLEAR a previous value when user selects "No preference"
          preferredCoronavirusVaccinated: formData.preferredCoronavirusVaccinated
            ? formData.preferredCoronavirusVaccinated
            : null,
          preferredReligions: formData.preferredReligions,
          preferredBodyType: formData.preferredBodyType ? formData.preferredBodyType : null,
          preferredHasKids: formData.preferredHasKids ? formData.preferredHasKids : null,
          preferredWantsKids: formData.preferredWantsKids ? formData.preferredWantsKids : null,
          preferredSmokes: formData.preferredSmokes ? formData.preferredSmokes : null,
          preferredDrinks: formData.preferredDrinks ? formData.preferredDrinks : null,
          preferredActivity: formData.preferredActivity,
          preferredEducation: formData.preferredEducation,
          preferredPoliticalViews: formData.preferredPoliticalViews,
          preferredDiet: formData.preferredDiet,
          preferredRelationshipType: formData.preferredRelationshipType,
          preferredPets: formData.preferredPets,
          preferredInstruments: formData.preferredInstruments,
          preferredSkills: formData.preferredSkills,
          matchMusicTastes: formData.matchMusicTastes,
          variabilityLevel: formData.variabilityLevel,
          variabilityFilters: formData.variabilityFilters,
        },
      });

      onFiltersChange?.();
      onOpenChange?.(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const religions = [
    "Christianity",
    "Catholicism",
    "Judaism",
    "Islam",
    "Hinduism",
    "Buddhism",
    "Sikhism",
    "Atheism",
    "Agnosticism",
    "Undecided",
  ];

  const content = (
    <>
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
            {/* Non-Negotiable Filters Box */}
            <div className="border border-blue-500/50 rounded-lg p-4 space-y-6 bg-blue-950/20">
              {/* Disclaimer */}
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-200">
                  <strong>Non-Negotiable Filters:</strong> These filters are automatically treated as deal-breakers unless you set them to &quot;No preference&quot;. Matches must meet these requirements exactly.
                </p>
              </div>
              {/* Gender Preference with Nested Sexual Orientation */}
              <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Gender Preference
              </label>
              <p className="text-xs text-gray-400 mb-4">
                You can select multiple genders, each with their own orientation preference.
              </p>
              <div className="space-y-3">
                {["male", "female", "non-binary", "other"].map((gender) => {
                  const isSelected = formData.preferredGenders.some(p => p.gender === gender);
                  const preference = formData.preferredGenders.find(p => p.gender === gender);
                  
                  return (
                    <div key={gender} className={`border rounded-lg p-4 transition-colors ${
                      isSelected ? "border-purple-500 bg-purple-900/30" : "border-gray-700"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-3 w-4 h-4 border-2 border-gray-600 bg-gray-800 text-purple-500 focus:ring-2 focus:ring-purple-500"
                            checked={isSelected}
                            onChange={() => toggleGenderPreference(gender)}
                          />
                          <span className="text-white font-semibold">
                            {gender.charAt(0).toUpperCase() + gender.slice(1).replace("-", " ")}
                          </span>
                        </label>
                      </div>
                      
                      {isSelected && (
                        <div className="ml-7 mt-3">
                          <label className="block text-xs text-gray-300 font-medium mb-2">
                            Their orientation preference
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {["straight", "gay", "bisexual", "other"].map((orientation) => {
                              const isChecked = preference?.sexualOrientation?.includes(orientation) || false;
                              return (
                                <label
                                  key={orientation}
                                  className={`flex items-center p-2 border rounded cursor-pointer text-xs text-white transition-colors ${
                                    isChecked
                                      ? "border-purple-500 bg-purple-900/50"
                                      : "border-gray-700 hover:bg-gray-800"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="mr-2 w-3 h-3 text-purple-500 border-gray-600 bg-gray-800 rounded focus:ring-purple-500"
                                    checked={isChecked}
                                    onChange={() => toggleGenderOrientation(gender, orientation)}
                                  />
                                  <span className="text-gray-100">
                                    {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Age Range */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-white">Age Range</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.anyAge}
                    onChange={(e) => setFormData({ ...formData, anyAge: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500"
                  />
                  <span className="text-sm text-gray-300">Any age</span>
                </label>
              </div>
              {!formData.anyAge && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Min Age</label>
                    <input
                      type="number"
                      min="18"
                      max="130"
                      value={formData.preferredMinAge}
                      onChange={(e) =>
                        setFormData({ ...formData, preferredMinAge: parseInt(e.target.value) || 18 })
                      }
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Max Age</label>
                    <input
                      type="number"
                      min="18"
                      max="130"
                      value={formData.preferredMaxAge}
                      onChange={(e) =>
                        setFormData({ ...formData, preferredMaxAge: parseInt(e.target.value) || 130 })
                      }
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Height Range */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-white">Height Range</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.anyHeight}
                    onChange={(e) => setFormData({ ...formData, anyHeight: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500"
                  />
                  <span className="text-sm text-gray-300">Any height</span>
                </label>
              </div>
              {!formData.anyHeight && (
                <div className="grid grid-cols-2 gap-4">
                  <HeightSelector
                    value={formData.preferredMinHeight}
                    onChange={(heightInInches) => setFormData({ ...formData, preferredMinHeight: heightInInches })}
                    label="Min Height"
                    className=" border-gray-700 "
                  />
                  <HeightSelector
                    value={formData.preferredMaxHeight}
                    onChange={(heightInInches) => setFormData({ ...formData, preferredMaxHeight: heightInInches })}
                    label="Max Height"
                    className=" border-gray-700 "
                  />
                </div>
              )}
            </div>

            {/* Distance */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-white">Maximum Distance</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.anyDistance}
                    onChange={(e) => setFormData({ ...formData, anyDistance: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500"
                  />
                  <span className="text-sm text-gray-300">Any distance</span>
                </label>
              </div>
              {!formData.anyDistance && (
                <div>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={formData.preferredMaxDistance}
                    onChange={(e) =>
                      setFormData({ ...formData, preferredMaxDistance: parseInt(e.target.value) || 50 })
                    }
                    className="w-full p-3 border border-gray-700 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Miles</p>
                </div>
              )}
            </div>

            {/* Vaccination Status */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Vaccination Status
              </label>
              <DropdownSelector
                value={formData.preferredCoronavirusVaccinated}
                onChange={(value) =>
                  setFormData({ ...formData, preferredCoronavirusVaccinated: value })
                }
                options={[
                  { label: "No preference", value: "" },
                  { label: "Coronavirus Vaccinated", value: "yes" },
                  { label: "Not Coronavirus Vaccinated", value: "no" },
                ]}
                label=""
                placeholder="No preference"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Has Kids */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Has Kids
              </label>
              <DropdownSelector
                value={formData.preferredHasKids}
                onChange={(value) =>
                  setFormData({ ...formData, preferredHasKids: value as "" | "yes" | "no" | "any" })
                }
                options={[
                  { label: "No preference", value: "" },
                  { label: "Has kids", value: "yes" },
                  { label: "Doesn't have kids", value: "no" },
                ]}
                label=""
                placeholder="No preference"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Wants Kids */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Wants Kids (Future)
              </label>
              <DropdownSelector
                value={formData.preferredWantsKids}
                onChange={(value) =>
                  setFormData({ ...formData, preferredWantsKids: value as "" | "yes" | "no" | "maybe" | "any" })
                }
                options={[
                  { label: "No preference", value: "" },
                  { label: "Wants kids", value: "yes" },
                  { label: "Doesn't want kids", value: "no" },
                  { label: "Maybe", value: "maybe" },
                ]}
                label=""
                placeholder="No preference"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Smokes */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Smoking Preference
              </label>
              <DropdownSelector
                value={formData.preferredSmokes}
                onChange={(value) =>
                  setFormData({ ...formData, preferredSmokes: value })
                }
                options={[
                  { label: "No preference", value: "" },
                  { label: "Yes", value: "Yes" },
                  { label: "No", value: "No" },
                  { label: "Social", value: "Social" },
                ]}
                label=""
                placeholder="No preference"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Drinks */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Drinking Preference
              </label>
              <DropdownSelector
                value={formData.preferredDrinks}
                onChange={(value) =>
                  setFormData({ ...formData, preferredDrinks: value })
                }
                options={[
                  { label: "No preference", value: "" },
                  { label: "Yes", value: "Yes" },
                  { label: "No", value: "No" },
                  { label: "Social", value: "Social" },
                ]}
                label=""
                placeholder="No preference"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Body Type */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Body Type
              </label>
              <DropdownSelector
                value={formData.preferredBodyType}
                onChange={(value) => setFormData({ ...formData, preferredBodyType: value })}
                options={[{ label: "No preference", value: "" }, ...BODY_TYPE_OPTIONS]}
                label=""
                placeholder="No preference"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Pets */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Pets
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2">
                  {PETS_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                        formData.preferredPets.includes(opt.value)
                          ? "bg-purple-900/50 border border-purple-500"
                          : "border border-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.preferredPets.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              preferredPets: [...formData.preferredPets, opt.value],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              preferredPets: formData.preferredPets.filter((p) => p !== opt.value),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-100">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Relationship Type */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Relationship Type
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2">
                  {["Monogamous", "Open Relationship", "Casual Dating", "Friends with Benefits", "Long-term Relationship", "Short-term Fun", "Not Sure Yet"].map((type) => (
                    <label
                      key={type}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                        formData.preferredRelationshipType.includes(type)
                          ? "bg-purple-900/50 border border-purple-500"
                          : "border border-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.preferredRelationshipType.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              preferredRelationshipType: [...formData.preferredRelationshipType, type],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              preferredRelationshipType: formData.preferredRelationshipType.filter((t) => t !== type),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-100">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Level - Multi-select */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Activity Level
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2">
                  {["Active", "Sporting", "Super active", "Couch potato", "Hiker", "Moderate", "Very active", "Gym enthusiast", "Yoga lover", "Outdoor adventurer", "Weekend warrior"].map((activity) => (
                    <label
                      key={activity}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                        formData.preferredActivity.includes(activity)
                          ? "bg-purple-900/50 border border-purple-500"
                          : "border border-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.preferredActivity.includes(activity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              preferredActivity: [...formData.preferredActivity, activity],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              preferredActivity: formData.preferredActivity.filter((a) => a !== activity),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-100">{activity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Diet */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Diet Preferences
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2">
                  {["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Kosher", "Halal", "Gluten-free", "Keto", "Paleo", "Other"].map((diet) => (
                    <label
                      key={diet}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                        formData.preferredDiet.includes(diet)
                          ? "bg-purple-900/50 border border-purple-500"
                          : "border border-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.preferredDiet.includes(diet)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              preferredDiet: [...formData.preferredDiet, diet],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              preferredDiet: formData.preferredDiet.filter((d) => d !== diet),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-100">{diet}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Political Views */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Political Views
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2">
                  {["Liberal", "Moderate", "Conservative", "Progressive", "Libertarian", "Apolitical", "Other"].map((view) => (
                    <label
                      key={view}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                        formData.preferredPoliticalViews.includes(view)
                          ? "bg-purple-900/50 border border-purple-500"
                          : "border border-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.preferredPoliticalViews.includes(view)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              preferredPoliticalViews: [...formData.preferredPoliticalViews, view],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              preferredPoliticalViews: formData.preferredPoliticalViews.filter((v) => v !== view),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-100">{view}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Education Level */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Education Level
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2">
                  {["High School", "Some College", "Bachelor's", "Master's", "PhD", "Professional"].map((edu) => (
                    <label
                      key={edu}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                        formData.preferredEducation.includes(edu)
                          ? "bg-purple-900/50 border border-purple-500"
                          : "border border-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.preferredEducation.includes(edu)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              preferredEducation: [...formData.preferredEducation, edu],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              preferredEducation: formData.preferredEducation.filter((e) => e !== edu),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-100">{edu}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Religion */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Religion Preferences
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2">
                  {religions.map((religion) => (
                    <label
                      key={religion}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                        formData.preferredReligions.includes(religion)
                          ? "bg-purple-900/50 border border-purple-500"
                          : "border border-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.preferredReligions.includes(religion)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              preferredReligions: [...formData.preferredReligions, religion],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              preferredReligions: formData.preferredReligions.filter((r) => r !== religion),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-100">{religion}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            </div>
            {/* End of Non-Negotiable Filters Box */}

            {/* Mix It Up Section */}
            <div className="pt-6 border-t border-gray-700 space-y-6">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Mix It Up!</h3>
                <p className="text-sm text-gray-300 mb-4">
Select which filters you would like to flex, and how much.
<br /> Add some surprise and find someone that isn&apos;t on your radar!                </p>
                
                {/* Variability Level Slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-start mb-3">
                    <label className="block text-sm font-semibold text-white">
                       Flex Preferences By
                    </label>
                    <span className="text-lg font-bold text-purple-400 ml-8">
                      {formData.variabilityLevel}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.variabilityLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, variabilityLevel: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    style={{
                      background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${formData.variabilityLevel}%, rgb(55, 65, 81) ${formData.variabilityLevel}%, rgb(55, 65, 81) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>0% (Exact matches only)</span>
                    <span>50%</span>
                    <span>100% (Maximum variety)</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Higher percentage = more diverse matches, including some outside your usual preferences.
                  </p>
                </div>

                {/* Apply Variability To Checkboxes */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Choose which preferences to flex:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: "gender", label: "Gender Preference" },
                      { key: "age", label: "Age Range" },
                      { key: "distance", label: "Maximum Distance" },
                      { key: "height", label: "Height Range" },
                      { key: "hasKids", label: "Has Kids" },
                      { key: "wantsKids", label: "Wants Kids" },
                      { key: "smokes", label: "Smoking Preference" },
                      { key: "drinks", label: "Drinking Preference" },
                      { key: "vaccination", label: "Vaccination Status" },
                      { key: "relationshipType", label: "Relationship Type" },
                      { key: "activity", label: "Activity Level" },
                      { key: "diet", label: "Diet Preferences" },
                      { key: "politicalViews", label: "Political Views" },
                      { key: "education", label: "Education Level" },
                      { key: "religion", label: "Religion" },
                      { key: "pets", label: "Pets" },
                      { key: "bodyType", label: "Body Type" },
                    ].map((filter) => (
                      <label
                        key={filter.key}
                        className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-800 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.variabilityFilters.includes(filter.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                variabilityFilters: [...formData.variabilityFilters, filter.key],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                variabilityFilters: formData.variabilityFilters.filter((f) => f !== filter.key),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-200">{filter.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    All filters are non-negotiable by default. Check the boxes above to allow variability for those specific filters.
                  </p>
                </div>
              </div>
            </div>
            {/* Music Compatibility Filters - COMMENTED OUT */}
            {false && (
            <div className="pt-6 border-t border-gray-700 space-y-6">
              <h3 className="text-lg font-semibold text-white">Music Compatibility</h3>
              
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Preferred Instruments
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                  <div className="grid grid-cols-2 gap-2">
                    {instrumentList.map((instrument) => (
                      <label
                        key={instrument}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                          formData.preferredInstruments.includes(instrument)
                            ? "bg-purple-900/50 border border-purple-500"
                            : "border border-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.preferredInstruments.includes(instrument)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                preferredInstruments: [...formData.preferredInstruments, instrument],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                preferredInstruments: formData.preferredInstruments.filter((i) => i !== instrument),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-100">{instrument}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Preferred Skills
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                  <div className="grid grid-cols-2 gap-2">
                    {skillsList.map((skill) => (
                      <label
                        key={skill}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                          formData.preferredSkills.includes(skill)
                            ? "bg-purple-900/50 border border-purple-500"
                            : "border border-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.preferredSkills.includes(skill)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                preferredSkills: [...formData.preferredSkills, skill],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                preferredSkills: formData.preferredSkills.filter((s) => s !== skill),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-100">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.matchMusicTastes}
                    onChange={(e) =>
                      setFormData({ ...formData, matchMusicTastes: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500"
                  />
                  <span className="text-sm font-semibold text-white">Prioritize instrument and skill match</span>
                </label>
                <p className="text-xs text-gray-400 mt-1 ml-6">
                  Show users with matching instruments and skills first (scoring only, never excludes)
                </p>
              </div>
            </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    preferredGenders: [],
                    preferredMinAge: 18,
                    preferredMaxAge: 130,
                    preferredMinHeight: 36,
                    preferredMaxHeight: 94,
                    preferredMaxDistance: 50,
                    preferredCoronavirusVaccinated: "",
                    preferredReligions: [],
                    preferredBodyType: "",
                    preferredHasKids: "",
                    preferredWantsKids: "",
                    preferredSmokes: "",
                    preferredDrinks: "",
                    preferredActivity: [],
                    preferredEducation: [],
                    preferredPoliticalViews: [],
                    preferredDiet: [],
                    preferredRelationshipType: [],
                    preferredPets: [],
                    preferredInstruments: [],
                    preferredSkills: [],
                    matchMusicTastes: true,
                    anyAge: true,
                    anyHeight: true,
                    anyDistance: false,
                    variabilityLevel: 0,
                    variabilityFilters: [],
                  });
                }}
                className="border-gray-700 text-gray-200 hover:bg-gray-800"
              >
                Reset Filters
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange?.(false)}
                  className="border-gray-700 text-gray-200 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {saving ? "Saving..." : "Apply Filters"}
                </Button>
              </div>
            </div>
          </div>
        )}
    </>
  );

  if (asModal) {
    return (
      <Dialog open={open!} onOpenChange={onOpenChange!}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-950 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Filter className="w-5 h-5" />
              Filters
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Standalone form mode (for profile page)
  return <div className="space-y-6">{content}</div>;
}

