"use client";

import { useState, useEffect } from "react";
import kyInstance from "@/lib/ky";
import { Loader2, Save, Music } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import instrumentList from "@/data/instrumentList.json";
import skillsList from "@/data/skillsList.json";
import DropdownSelector from "./DropdownSelector";
import AgeSelector from "./AgeSelector";
import HeightSelector from "./HeightSelector";
import { PETS_OPTIONS } from "@/lib/dating/profileOptions";
import { BODY_TYPE_OPTIONS } from "@/lib/dating/profileOptions";

interface GenderPreference {
  gender: string;
  sexualOrientation: string[];
}

export default function DatingPreferencesForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    preferredGenders: [] as GenderPreference[],
    preferredMinAge: 0,
    preferredMaxAge: 0,
    preferredMinHeight: 0,
    preferredMaxHeight: 0,
    preferredMaxDistance: 0,
    preferredCoronavirusVaccinated: "",
    preferredReligions: [] as string[],
    preferredHasKids: "" as "" | "yes" | "no" | "any",
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
    matchMusicTastes: false,
    anyAge: false,
    anyHeight: false,
    anyDistance: false,
    // Mix It Up controls
    variabilityLevel: 0, // 0-100% variability slider
    variabilityFilters: [] as string[], // Array of filter names to include in variability
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await kyInstance
        .get("/api/dating/preferences")
        .json<{
          preferredGender: string;
          preferredSexualOrientation: string;
          preferredMinAge: number;
          preferredMaxAge: number;
          preferredMinHeight: number;
          preferredMaxHeight: number;
          preferredMaxDistanceKm: number;
          preferredCoronavirusVaccinated: string;
          preferredReligions: string[];
        }>();

      const minAge = response.preferredMinAge || 0;
      const maxAge = response.preferredMaxAge || 0;
      const minHeight = response.preferredMinHeight || 0;
      const maxHeight = response.preferredMaxHeight || 0;
      const maxDistance = response.preferredMaxDistanceKm || 0;
      
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
        preferredMaxDistance: Math.round(maxDistance * 0.621371), // Convert km to miles
        preferredCoronavirusVaccinated: response.preferredCoronavirusVaccinated || "",
        preferredReligions: response.preferredReligions || [],
        preferredHasKids: (response as any).preferredHasKids || "",
        preferredSmokes: (response as any).preferredSmokes || "",
        preferredDrinks: (response as any).preferredDrinks || "",
        preferredBodyType: (response as any).preferredBodyType || "",
        preferredActivity: Array.isArray((response as any).preferredActivity) ? (response as any).preferredActivity : ((response as any).preferredActivity ? [(response as any).preferredActivity] : []),
        preferredEducation: (response as any).preferredEducation || [],
        preferredPoliticalViews: (response as any).preferredPoliticalViews || [],
        preferredDiet: (response as any).preferredDiet || [],
        preferredRelationshipType: (response as any).preferredRelationshipType || [],
        preferredPets: (response as any).preferredPets || [],
        preferredInstruments: (response as any).preferredInstruments || [],
        preferredSkills: (response as any).preferredSkills || [],
        matchMusicTastes: (response as any).matchMusicTastes ?? false,
        anyAge: minAge === 18 && maxAge === 130,
        anyHeight: minHeight === 36 && maxHeight === 94, // 3'0" to 7'10"
        anyDistance: maxDistance >= 10000,
        variabilityLevel: (response as any).variabilityLevel ?? 0,
        variabilityFilters: (response as any).variabilityFilters || [],
      });
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast({
        variant: "destructive",
        description: "Failed to load preferences",
      });
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
          bio: "", // Not updating bio here
          age: 0,
          height: 0,
          gender: "",
          location: "",
          coronavirusVaccinated: "",
          religion: "",
          sexualOrientation: "",
          preferredGender: preferredGenderJson,
          preferredMinAge: formData.anyAge ? 18 : formData.preferredMinAge,
          preferredMaxAge: formData.anyAge ? 130 : formData.preferredMaxAge,
          preferredMinHeight: formData.anyHeight ? 36 : formData.preferredMinHeight,
          preferredMaxHeight: formData.anyHeight ? 94 : formData.preferredMaxHeight,
          // API expects km in `preferredMaxDistance` (stored as preferredMaxDistanceKm in DB)
          preferredMaxDistance: formData.anyDistance ? 10000 : Math.round(formData.preferredMaxDistance / 0.621371),
          // Send `null` to CLEAR a previous value when user selects "No preference"
          preferredCoronavirusVaccinated: formData.preferredCoronavirusVaccinated
            ? formData.preferredCoronavirusVaccinated
            : null,
          preferredReligions: formData.preferredReligions,
          preferredBodyType: formData.preferredBodyType ? formData.preferredBodyType : null,
          preferredHasKids: formData.preferredHasKids ? formData.preferredHasKids : null,
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

      toast({
        description: "Preferences updated successfully",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        variant: "destructive",
        description: "Failed to save preferences",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Non-Negotiable Filters Box */}
      <div className="border border-blue-300 rounded-lg p-4 space-y-6 bg-blue-50/50">
        {/* Disclaimer */}
        <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Non-Negotiable Filters:</strong> These filters are automatically treated as deal-breakers unless you set them to &quot;No preference&quot;. Matches must meet these requirements exactly.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-4">
            Gender Preference
          </label>
        <p className="text-sm text-gray-600 mb-4">
          You can select multiple genders, each with their own orientation preference.
        </p>
        <div className="space-y-3">
          {["male", "female", "non-binary", "other"].map((gender) => {
            const isSelected = formData.preferredGenders.some(p => p.gender === gender);
            const preference = formData.preferredGenders.find(p => p.gender === gender);
            
            return (
              <div key={gender} className={`border rounded-lg p-4 transition-colors ${
                isSelected ? "border-purple-500 bg-purple-50" : "border-gray-300"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 w-5 h-5 border-2 border-gray-300 bg-white text-purple-600 focus:ring-2 focus:ring-purple-500"
                      checked={isSelected}
                      onChange={() => toggleGenderPreference(gender)}
                    />
                    <span className="text-gray-900 font-semibold">
                      {gender.charAt(0).toUpperCase() + gender.slice(1).replace("-", " ")}
                    </span>
                  </label>
                </div>
                
                {isSelected && (
                  <div className="ml-8 mt-3">
                    <label className="block text-sm text-gray-900 font-medium mb-2">
                      Their orientation preference
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["straight", "gay", "bisexual", "other"].map((orientation) => {
                        const isChecked = preference?.sexualOrientation?.includes(orientation) || false;
                        return (
                          <label
                            key={orientation}
                            className={`flex items-center p-2 border rounded cursor-pointer text-sm text-gray-900 transition-colors ${
                              isChecked
                                ? "border-purple-500 bg-purple-100"
                                : "border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              checked={isChecked}
                              onChange={() => toggleGenderOrientation(gender, orientation)}
                            />
                            <span className="text-gray-900 font-medium">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-900">
              Minimum Age
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.anyAge}
                onChange={(e) => {
                  const anyAge = e.target.checked;
                  setFormData({
                    ...formData,
                    anyAge,
                    preferredMinAge: anyAge ? 18 : formData.preferredMinAge,
                    preferredMaxAge: anyAge ? 130 : formData.preferredMaxAge,
                  });
                }}
                className="w-4 h-4 rounded border-gray-300 text-purple-600"
              />
              <span className="text-sm text-gray-700">Any</span>
            </label>
          </div>
          <AgeSelector
            value={formData.preferredMinAge || 18}
            onChange={(age) => setFormData({ ...formData, preferredMinAge: age, anyAge: false })}
            label=""
            min={18}
            max={130}
            className={formData.anyAge ? "opacity-50 pointer-events-none" : ""}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Maximum Age
          </label>
          <AgeSelector
            value={formData.preferredMaxAge || 130}
            onChange={(age) => setFormData({ ...formData, preferredMaxAge: age, anyAge: false })}
            label=""
            min={18}
            max={130}
            className={formData.anyAge ? "opacity-50 pointer-events-none" : ""}
          />
        </div>
      </div>

      {/* Height Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-900">
            Height Range
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.anyHeight}
              onChange={(e) => {
                const anyHeight = e.target.checked;
                setFormData({
                  ...formData,
                  anyHeight,
                  preferredMinHeight: anyHeight ? 36 : formData.preferredMinHeight, // 3'0" minimum
                  preferredMaxHeight: anyHeight ? 94 : formData.preferredMaxHeight, // 7'10" maximum
                });
              }}
              className="w-4 h-4 rounded border-gray-300 text-purple-600"
            />
            <span className="text-sm text-gray-700">Any</span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Minimum Height</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="9"
                  className="w-full h-11 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  value={Math.floor(formData.preferredMinHeight / 12) || ""}
                  onChange={(e) => {
                    const feet = parseInt(e.target.value) || 0;
                    const inches = formData.preferredMinHeight % 12;
                    setFormData({ ...formData, preferredMinHeight: feet * 12 + inches, anyHeight: false });
                  }}
                  placeholder="Feet"
                  disabled={formData.anyHeight}
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="11"
                  className="w-full h-11 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  value={formData.preferredMinHeight % 12 || ""}
                  onChange={(e) => {
                    const inches = parseInt(e.target.value) || 0;
                    const feet = Math.floor(formData.preferredMinHeight / 12);
                    setFormData({ ...formData, preferredMinHeight: feet * 12 + inches, anyHeight: false });
                  }}
                  placeholder="Inches"
                  disabled={formData.anyHeight}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Maximum Height</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="9"
                  className="w-full h-11 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  value={Math.floor(formData.preferredMaxHeight / 12) || ""}
                  onChange={(e) => {
                    const feet = parseInt(e.target.value) || 0;
                    const inches = formData.preferredMaxHeight % 12;
                    setFormData({ ...formData, preferredMaxHeight: feet * 12 + inches, anyHeight: false });
                  }}
                  placeholder="Feet"
                  disabled={formData.anyHeight}
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="11"
                  className="w-full h-11 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  value={formData.preferredMaxHeight % 12 || ""}
                  onChange={(e) => {
                    const inches = parseInt(e.target.value) || 0;
                    const feet = Math.floor(formData.preferredMaxHeight / 12);
                    setFormData({ ...formData, preferredMaxHeight: feet * 12 + inches, anyHeight: false });
                  }}
                  placeholder="Inches"
                  disabled={formData.anyHeight}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-900">
              Maximum Distance
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.anyDistance}
                onChange={(e) => {
                  const anyDistance = e.target.checked;
                  setFormData({
                    ...formData,
                    anyDistance,
                    preferredMaxDistance: anyDistance ? 10000 : formData.preferredMaxDistance, // Very large number for "any"
                  });
                }}
                className="w-4 h-4 rounded border-gray-300 text-purple-600"
              />
              <span className="text-sm text-gray-700">Any</span>
            </label>
          </div>
          <input
            type="number"
            min="1"
            max="300"
            className="w-full h-11 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            value={formData.preferredMaxDistance === 0 ? "" : formData.preferredMaxDistance}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setFormData({ ...formData, preferredMaxDistance: value, anyDistance: false });
            }}
            disabled={formData.anyDistance}
          />
        </div>
        <DropdownSelector
            value={formData.preferredCoronavirusVaccinated}
          onChange={(value) =>
            setFormData({ ...formData, preferredCoronavirusVaccinated: value })
            }
          options={[
            { label: "No preference", value: "" },
            { label: "Coronavirus Vaccinated", value: "Yes" },
            { label: "Not Coronavirus Vaccinated", value: "No" },
          ]}
          label="Preferred Vaccination Status"
          placeholder="No preference"
        />
      </div>

      {/* Additional Preferences - Has Kids, Smokes, Drinks, Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          label="Has Kids"
          placeholder="No preference"
        />

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
          label="Smoking Preference"
          placeholder="No preference"
        />

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
          label="Drinking Preference"
          placeholder="No preference"
        />
      </div>

      {/* Body Type */}
      <div>
        <DropdownSelector
          value={formData.preferredBodyType}
          onChange={(value) => setFormData({ ...formData, preferredBodyType: value })}
          options={[{ label: "No preference", value: "" }, ...BODY_TYPE_OPTIONS]}
          label="Body Type"
          placeholder="No preference"
        />
      </div>

      {/* Pets */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Pets (Select all that apply)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PETS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-2 border-gray-300 bg-white checked:bg-purple-500 checked:border-purple-500"
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
              />
              <span className="text-sm font-medium text-gray-900">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Relationship Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Relationship Type
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            {["Monogamous", "Open Relationship", "Casual Dating", "Friends with Benefits", "Long-term Relationship", "Short-term Fun", "Not Sure Yet"].map((type) => (
              <label
                key={type}
                className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
                  formData.preferredRelationshipType.includes(type)
                    ? "bg-purple-50 border border-purple-500"
                    : "border border-gray-300"
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
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-900">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Level */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Activity Level
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {["Active", "Sporting", "Super active", "Couch potato", "Hiker", "Moderate", "Very active", "Gym enthusiast", "Yoga lover", "Outdoor adventurer", "Weekend warrior"].map((activity) => (
            <label
              key={activity}
              className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-2 border-gray-300 bg-white checked:bg-purple-500 checked:border-purple-500"
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
              />
              <span className="text-sm font-medium text-gray-900">{activity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Diet */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Diet Preferences
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            {["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Kosher", "Halal", "Gluten-free", "Keto", "Paleo", "Other"].map((diet) => (
              <label
                key={diet}
                className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
                  formData.preferredDiet.includes(diet)
                    ? "bg-purple-50 border border-purple-500"
                    : "border border-gray-300"
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
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-900">{diet}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Political Views */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Political Views
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            {["Liberal", "Moderate", "Conservative", "Progressive", "Libertarian", "Apolitical", "Other"].map((view) => (
              <label
                key={view}
                className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
                  formData.preferredPoliticalViews.includes(view)
                    ? "bg-purple-50 border border-purple-500"
                    : "border border-gray-300"
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
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-900">{view}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Education Level */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Education Level
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            {["High School", "Some College", "Bachelor's", "Master's", "PhD", "Professional"].map((edu) => (
              <label
                key={edu}
                className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
                  formData.preferredEducation.includes(edu)
                    ? "bg-purple-50 border border-purple-500"
                    : "border border-gray-300"
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
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-900">{edu}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Religion */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Religion Preferences
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            "Christianity",
            "Catholicism",
            "Islam",
            "Judaism",
            "Buddhism",
            "Hinduism",
            "Sikhism",
            "Atheist",
            "Agnostic",
            "Undecided",
          ].map((religion) => (
            <label
              key={religion}
              className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-2 border-gray-300 bg-white checked:bg-purple-500 checked:border-purple-500"
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
                      preferredReligions: formData.preferredReligions.filter(
                        (r) => r !== religion
                      ),
                    });
                  }
                }}
              />
              <span className="text-sm font-medium text-gray-900">{religion}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Music Compatibility Filters - COMMENTED OUT */}
      {false && (
      <div className="border-t pt-6 space-y-6">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Music Compatibility
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Filter matches by preferred instruments and skills
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Preferred Instruments
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2">
                {instrumentList.map((instrument) => (
                  <label
                    key={instrument}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                      formData.preferredInstruments.includes(instrument)
                        ? "bg-purple-50 border border-purple-500"
                        : "border border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.preferredInstruments.includes(instrument)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            preferredInstruments: [
                              ...formData.preferredInstruments,
                              instrument,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            preferredInstruments:
                              formData.preferredInstruments.filter(
                                (i) => i !== instrument
                              ),
                          });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600"
                    />
                    <span className="text-sm text-gray-900">{instrument}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Preferred Skills
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2">
                {skillsList.map((skill) => (
                  <label
                    key={skill}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                      formData.preferredSkills.includes(skill)
                        ? "bg-purple-50 border border-purple-500"
                        : "border border-gray-300"
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
                            preferredSkills: formData.preferredSkills.filter(
                              (s) => s !== skill
                            ),
                          });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600"
                    />
                    <span className="text-sm text-gray-900">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.matchMusicTastes}
              onChange={(e) =>
                setFormData({ ...formData, matchMusicTastes: e.target.checked })
              }
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-900">
                Prioritize instrument and skill match
              </span>
              <p className="text-xs text-gray-600 mt-1">
                When enabled, matches will be ranked by music taste compatibility (instruments & skills). 
                Disable to match based on other factors only.
              </p>
            </div>
          </label>
        </div>
      </div>
      )}
      </div>
      {/* End of Non-Negotiable Filters Box */}

      {/* Mix It Up Section */}
      <div className="pt-6 border-t border-gray-300 space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mix It Up</h3>
          <p className="text-sm text-gray-700 mb-4">
            Add some surprise! Loosen some preferences to discover unexpected connections. Select which filters you&apos;d like to include in variability.
          </p>
          
          {/* Variability Level Slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-900">
                Variability Level
              </label>
              <span className="text-lg font-bold text-purple-600">
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
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-purple-500"
              style={{
                background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${formData.variabilityLevel}%, rgb(209, 213, 219) ${formData.variabilityLevel}%, rgb(209, 213, 219) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0% (Exact matches only)</span>
              <span>50%</span>
              <span>100% (Maximum variety)</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Higher variability = more diverse matches, including some outside your usual preferences.
            </p>
          </div>

          {/* Apply Variability To Checkboxes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Apply variability to:
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
              ].map((filter) => (
                <label
                  key={filter.key}
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors"
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
                    className="w-4 h-4 rounded border-gray-300 bg-white text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-900">{filter.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              All filters are non-negotiable by default. Check the boxes above to allow variability for those specific filters.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

