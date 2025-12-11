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

interface GenderPreference {
  gender: string;
  sexualOrientation: string[];
}

interface BasicFiltersPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFiltersChange: () => void;
}

export default function BasicFiltersPanel({
  open,
  onOpenChange,
  onFiltersChange,
}: BasicFiltersPanelProps) {
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
    preferredActivity: "",
    preferredEducation: [] as string[],
    preferredPoliticalViews: [] as string[],
    preferredDiet: [] as string[],
    preferredRelationshipType: [] as string[],
    preferredInstruments: [] as string[],
    preferredSkills: [] as string[],
    matchMusicTastes: true,
    anyAge: false,
    anyHeight: false,
    anyDistance: false,
    // Match strictness controls
    exactMatchAllFilters: false,
    minimumMatchPercentage: 70,
    nonNegotiableFields: [] as string[], // Array of field names that are dealbreakers (height, religion, education, etc.)
  });

  useEffect(() => {
    if (open) {
      fetchPreferences();
    }
  }, [open]);

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
          preferredHasKids?: string;
          preferredWantsKids?: string;
          preferredSmokes?: string;
          preferredDrinks?: string;
          preferredActivity?: string;
          preferredEducation?: string[];
          preferredPoliticalViews?: string[];
          preferredDiet?: string[];
          preferredRelationshipType?: string[];
          preferredInstruments?: string[];
          preferredSkills?: string[];
          matchMusicTastes?: boolean;
          exactMatchAllFilters?: boolean;
          minimumMatchPercentage?: number;
          nonNegotiableFields?: string[];
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
        preferredHasKids: (response.preferredHasKids as "" | "yes" | "no" | "any") || "",
        preferredWantsKids: (response.preferredWantsKids as "" | "yes" | "no" | "maybe" | "any") || "",
        preferredSmokes: response.preferredSmokes || "",
        preferredDrinks: response.preferredDrinks || "",
        preferredActivity: response.preferredActivity || "",
        preferredEducation: response.preferredEducation || [],
        preferredPoliticalViews: response.preferredPoliticalViews || [],
        preferredDiet: response.preferredDiet || [],
        preferredRelationshipType: response.preferredRelationshipType || [],
        preferredInstruments: response.preferredInstruments || [],
        preferredSkills: response.preferredSkills || [],
        matchMusicTastes: response.matchMusicTastes ?? true,
        anyAge: minAge === 18 && maxAge === 130,
        anyHeight: minHeight === 36 && maxHeight === 94,
        anyDistance: maxDistanceKm >= 10000,
        exactMatchAllFilters: response.exactMatchAllFilters ?? false,
        minimumMatchPercentage: response.minimumMatchPercentage ?? 70,
        nonNegotiableFields: response.nonNegotiableFields || [],
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
          preferredMaxDistanceKm: formData.anyDistance ? 10000 : Math.round(formData.preferredMaxDistance / 0.621371), // Convert miles to km
          preferredCoronavirusVaccinated: formData.preferredCoronavirusVaccinated || undefined,
          preferredReligions: formData.preferredReligions,
          preferredHasKids: formData.preferredHasKids || undefined,
          preferredWantsKids: formData.preferredWantsKids || undefined,
          preferredSmokes: formData.preferredSmokes || undefined,
          preferredDrinks: formData.preferredDrinks || undefined,
          preferredActivity: formData.preferredActivity || undefined,
          preferredEducation: formData.preferredEducation,
          preferredPoliticalViews: formData.preferredPoliticalViews,
          preferredDiet: formData.preferredDiet,
          preferredRelationshipType: formData.preferredRelationshipType,
          preferredInstruments: formData.preferredInstruments,
          preferredSkills: formData.preferredSkills,
          matchMusicTastes: formData.matchMusicTastes,
          exactMatchAllFilters: formData.exactMatchAllFilters,
          minimumMatchPercentage: formData.minimumMatchPercentage,
          nonNegotiableFields: formData.nonNegotiableFields,
        },
      });

      onFiltersChange();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-950 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Filter className="w-5 h-5" />
            Filters
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Always Enforced Info Message */}
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
              <p className="text-xs text-blue-200">
                <strong>Always Enforced:</strong> Gender, Age Range, Distance, Has Kids, Wants Kids, Smoking, Drinking, and Vaccination Status are automatically treated as deal-breakers unless you set them to &quot;No preference&quot;.
              </p>
            </div>

            {/* Always Enforced Filters - Grouped Section */}
            <div className="border border-blue-500/50 rounded-lg p-4 space-y-6 bg-blue-950/20">
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
                    <label className="block text-xs text-gray-400 mb-2">Min Age</label>
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
                    <label className="block text-xs text-gray-400 mb-2">Max Age</label>
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
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.anyHeight}
                      onChange={(e) => setFormData({ ...formData, anyHeight: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500"
                    />
                    <span className="text-sm text-gray-300">Any height</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.nonNegotiableFields.includes("height")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            nonNegotiableFields: [...formData.nonNegotiableFields, "height"],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            nonNegotiableFields: formData.nonNegotiableFields.filter((f) => f !== "height"),
                          });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-xs text-red-400">Non-Negotiable</span>
                  </label>
                </div>
              </div>
              {!formData.anyHeight && (
                <div className="grid grid-cols-2 gap-4">
                  <HeightSelector
                    value={formData.preferredMinHeight}
                    onChange={(heightInInches) => setFormData({ ...formData, preferredMinHeight: heightInInches })}
                    label="Min Height"
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <HeightSelector
                    value={formData.preferredMaxHeight}
                    onChange={(heightInInches) => setFormData({ ...formData, preferredMaxHeight: heightInInches })}
                    label="Max Height"
                    className="bg-gray-900 border-gray-700 text-white"
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
                  { label: "Any", value: "any" },
                ]}
                label=""
                placeholder="No preference"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Wants Kids */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-white">
                  Wants Kids (Future)
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nonNegotiableFields.includes("wantsKids")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: [...formData.nonNegotiableFields, "wantsKids"],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: formData.nonNegotiableFields.filter((f) => f !== "wantsKids"),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-xs text-red-400">Non-Negotiable</span>
                </label>
              </div>
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
                  { label: "Any", value: "any" },
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
            </div>
            {/* End of Always Enforced Filters Section */}

            {/* Religion */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-white">
                  Religion Preferences
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nonNegotiableFields.includes("religion")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: [...formData.nonNegotiableFields, "religion"],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: formData.nonNegotiableFields.filter((f) => f !== "religion"),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-xs text-red-400">Non-Negotiable</span>
                </label>
              </div>
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

            {/* Activity Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-white">
                  Activity Level
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nonNegotiableFields.includes("activity")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: [...formData.nonNegotiableFields, "activity"],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: formData.nonNegotiableFields.filter((f) => f !== "activity"),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-xs text-red-400">Non-Negotiable</span>
                </label>
              </div>
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
                  { label: "Moderate", value: "Moderate" },
                  { label: "Very active", value: "Very active" },
                ]}
                label=""
                placeholder="No preference"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>


            {/* Music Filters */}
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

            {/* Preferred Skills */}
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

            {/* Education Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-white">
                  Education Level
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nonNegotiableFields.includes("education")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: [...formData.nonNegotiableFields, "education"],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: formData.nonNegotiableFields.filter((f) => f !== "education"),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-xs text-red-400">Non-Negotiable</span>
                </label>
              </div>
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

            {/* Political Views */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-white">
                  Political Views
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nonNegotiableFields.includes("politicalViews")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: [...formData.nonNegotiableFields, "politicalViews"],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: formData.nonNegotiableFields.filter((f) => f !== "politicalViews"),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-xs text-red-400">Non-Negotiable</span>
                </label>
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2">
                  {["Liberal", "Moderate", "Conservative", "Apolitical", "Other"].map((view) => (
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

            {/* Diet */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-white">
                  Diet Preferences
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nonNegotiableFields.includes("diet")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: [...formData.nonNegotiableFields, "diet"],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: formData.nonNegotiableFields.filter((f) => f !== "diet"),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-xs text-red-400">Non-Negotiable</span>
                </label>
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2">
                  {["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Kosher", "Halal", "Other"].map((diet) => (
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

            {/* Relationship Type */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-white">
                  Relationship Type
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nonNegotiableFields.includes("relationshipType")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: [...formData.nonNegotiableFields, "relationshipType"],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          nonNegotiableFields: formData.nonNegotiableFields.filter((f) => f !== "relationshipType"),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-xs text-red-400">Non-Negotiable</span>
                </label>
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-2">
                  {["Monogamous", "Ethical Non-Monogamous", "Open to Both"].map((type) => (
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

            {/* Match Strictness Controls */}
            <div className="pt-6 border-t border-gray-700 space-y-6">
              <h3 className="text-lg font-semibold text-white">Match Strictness</h3>
              
              {/* Exact Match All Filters */}
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.exactMatchAllFilters}
                    onChange={(e) =>
                      setFormData({ ...formData, exactMatchAllFilters: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-white">Exact Match All Filters</span>
                    <p className="text-xs text-gray-400 mt-1">
                      Require all preferences to match exactly. This is the strictest matching mode.
                    </p>
                  </div>
                </label>
              </div>

              {/* Percentage Match Slider */}
              {!formData.exactMatchAllFilters && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-white">
                      Minimum Match Percentage
                    </label>
                    <span className="text-lg font-bold text-purple-400">
                      {formData.minimumMatchPercentage}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.minimumMatchPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumMatchPercentage: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    style={{
                      background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${formData.minimumMatchPercentage}%, rgb(55, 65, 81) ${formData.minimumMatchPercentage}%, rgb(55, 65, 81) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0% (Any match)</span>
                    <span>50%</span>
                    <span>100% (Perfect match)</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Show only users with at least {formData.minimumMatchPercentage}% compatibility based on your preferences
                  </p>
                </div>
              )}
            </div>

            {/* Music Compatibility Filters - At Bottom */}
            <div className="pt-6 border-t border-gray-700 space-y-6">
              <h3 className="text-lg font-semibold text-white">Music Compatibility</h3>
              
              {/* Preferred Instruments */}
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

              {/* Preferred Skills */}
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

              {/* Match Music Tastes */}
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
                    preferredHasKids: "",
                    preferredWantsKids: "",
                    preferredSmokes: "",
                    preferredDrinks: "",
                    preferredActivity: "",
                    preferredEducation: [],
                    preferredPoliticalViews: [],
                    preferredDiet: [],
                    preferredRelationshipType: [],
                    preferredInstruments: [],
                    preferredSkills: [],
                    matchMusicTastes: true,
                    anyAge: true,
                    anyHeight: true,
                    anyDistance: false,
                    exactMatchAllFilters: false,
                    minimumMatchPercentage: 70,
                    nonNegotiableFields: [],
                  });
                }}
                className="border-gray-700 text-gray-200 hover:bg-gray-800"
              >
                Reset Filters
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
}

