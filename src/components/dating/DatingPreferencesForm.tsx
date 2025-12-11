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
    preferredActivity: "",
    preferredInstruments: [] as string[],
    preferredSkills: [] as string[],
    matchMusicTastes: false,
    anyAge: false,
    anyHeight: false,
    anyDistance: false,
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
        preferredActivity: (response as any).preferredActivity || "",
        preferredInstruments: (response as any).preferredInstruments || [],
        preferredSkills: (response as any).preferredSkills || [],
        matchMusicTastes: (response as any).matchMusicTastes ?? false,
        anyAge: minAge === 18 && maxAge === 130,
        anyHeight: minHeight === 36 && maxHeight === 94, // 3'0" to 7'10"
        anyDistance: maxDistance >= 10000,
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
          preferredMaxDistanceKm: formData.anyDistance ? 10000 : Math.round(formData.preferredMaxDistance / 0.621371),
          preferredCoronavirusVaccinated: formData.preferredCoronavirusVaccinated,
          preferredReligions: formData.preferredReligions,
          preferredHasKids: formData.preferredHasKids || undefined,
          preferredSmokes: formData.preferredSmokes || undefined,
          preferredDrinks: formData.preferredDrinks || undefined,
          preferredActivity: formData.preferredActivity || undefined,
          preferredInstruments: formData.preferredInstruments,
          preferredSkills: formData.preferredSkills,
          matchMusicTastes: formData.matchMusicTastes,
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
      {/* Always Enforced Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800">
          <strong>Always Enforced:</strong> Gender, Age Range, Distance, Has Kids, Wants Kids, Smoking, Drinking, and Vaccination Status are automatically treated as deal-breakers unless you set them to &quot;No preference&quot;.
        </p>
      </div>

      {/* Always Enforced Filters - Grouped Section */}
      <div className="border border-blue-300 rounded-lg p-4 space-y-6 bg-blue-50/50">
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

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-900">
            Preferred Height Range
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-900">
              Maximum Distance (miles)
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
            { label: "Any", value: "any" },
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
      </div>
      {/* End of Always Enforced Filters Section */}

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Preferred Religions (Optional)
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

      {/* Activity Level */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Activity Level
        </label>
        <DropdownSelector
          value={formData.preferredActivity}
          onChange={(value) =>
            setFormData({ ...formData, preferredActivity: value })
          }
          options={[
            { label: "No preference", value: "" },
            { label: "Active", value: "Active" },
            { label: "Sporting", value: "Sporting" },
            { label: "Super active", value: "Super active" },
            { label: "Couch potato", value: "Couch potato" },
            { label: "Hiker", value: "Hiker" },
            { label: "Gym enthusiast", value: "Gym enthusiast" },
            { label: "Yoga lover", value: "Yoga lover" },
            { label: "Outdoor adventurer", value: "Outdoor adventurer" },
            { label: "Weekend warrior", value: "Weekend warrior" },
            { label: "Moderately active", value: "Moderately active" },
          ]}
          label=""
          placeholder="No preference"
        />
      </div>

      {/* Music Compatibility Filters - At Bottom */}
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

        {/* Music Compatibility Preference */}
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

