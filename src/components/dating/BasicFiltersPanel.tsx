"use client";

import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import kyInstance from "@/lib/ky";
import HeightSelector from "./HeightSelector";
import DropdownSelector from "./DropdownSelector";

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
    preferredMinAge: 18,
    preferredMaxAge: 130,
    preferredMinHeight: 36, // 3'0" in inches
    preferredMaxHeight: 94, // 7'10" in inches
    preferredMaxDistance: 50, // miles
    preferredCoronavirusVaccinated: "",
    preferredReligions: [] as string[],
    preferredHasKids: "" as "" | "yes" | "no" | "any",
    preferredSmokes: "",
    preferredDrinks: "",
    preferredActivity: "",
    anyAge: false,
    anyHeight: false,
    anyDistance: false,
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
          preferredMinAge: number;
          preferredMaxAge: number;
          preferredMinHeight: number;
          preferredMaxHeight: number;
          preferredMaxDistanceKm: number;
          preferredCoronavirusVaccinated: string;
          preferredReligions: string[];
          preferredHasKids?: string;
          preferredSmokes?: string;
          preferredDrinks?: string;
          preferredActivity?: string;
        }>();

      const minAge = response.preferredMinAge || 18;
      const maxAge = response.preferredMaxAge || 130;
      const minHeight = response.preferredMinHeight || 36;
      const maxHeight = response.preferredMaxHeight || 94;
      const maxDistanceKm = response.preferredMaxDistanceKm || 50;
      
      setFormData({
        preferredMinAge: minAge,
        preferredMaxAge: maxAge,
        preferredMinHeight: minHeight,
        preferredMaxHeight: maxHeight,
        preferredMaxDistance: Math.round(maxDistanceKm * 0.621371), // Convert km to miles
        preferredCoronavirusVaccinated: response.preferredCoronavirusVaccinated || "",
        preferredReligions: response.preferredReligions || [],
        preferredHasKids: (response.preferredHasKids as "" | "yes" | "no" | "any") || "",
        preferredSmokes: response.preferredSmokes || "",
        preferredDrinks: response.preferredDrinks || "",
        preferredActivity: response.preferredActivity || "",
        anyAge: minAge === 18 && maxAge === 130,
        anyHeight: minHeight === 36 && maxHeight === 94,
        anyDistance: maxDistanceKm >= 10000,
      });
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await kyInstance.post("/api/dating/preferences", {
        json: {
          preferredMinAge: formData.anyAge ? 18 : formData.preferredMinAge,
          preferredMaxAge: formData.anyAge ? 130 : formData.preferredMaxAge,
          preferredMinHeight: formData.anyHeight ? 36 : formData.preferredMinHeight,
          preferredMaxHeight: formData.anyHeight ? 94 : formData.preferredMaxHeight,
          preferredMaxDistanceKm: formData.anyDistance ? 10000 : Math.round(formData.preferredMaxDistance / 0.621371), // Convert miles to km
          preferredCoronavirusVaccinated: formData.preferredCoronavirusVaccinated || undefined,
          preferredReligions: formData.preferredReligions,
          preferredHasKids: formData.preferredHasKids || undefined,
          preferredSmokes: formData.preferredSmokes || undefined,
          preferredDrinks: formData.preferredDrinks || undefined,
          preferredActivity: formData.preferredActivity || undefined,
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
            <DropdownSelector
              value={formData.preferredCoronavirusVaccinated}
              onChange={(value) =>
                setFormData({ ...formData, preferredCoronavirusVaccinated: value })
              }
              options={[
                { label: "No preference", value: "" },
                { label: "Vaccinated", value: "yes" },
                { label: "Not vaccinated", value: "no" },
              ]}
              label="Vaccination Status"
              placeholder="No preference"
              className="bg-gray-900 border-gray-700 text-white"
            />

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

            {/* Has Kids */}
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
              className="bg-gray-900 border-gray-700 text-white"
            />

            {/* Smokes */}
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
              className="bg-gray-900 border-gray-700 text-white"
            />

            {/* Drinks */}
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
              className="bg-gray-900 border-gray-700 text-white"
            />

            {/* Activity Level */}
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
              label="Activity Level"
              placeholder="No preference"
              className="bg-gray-900 border-gray-700 text-white"
            />

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    preferredMinAge: 18,
                    preferredMaxAge: 130,
                    preferredMinHeight: 36,
                    preferredMaxHeight: 94,
                    preferredMaxDistance: 50,
                    preferredCoronavirusVaccinated: "",
                    preferredReligions: [],
                    preferredHasKids: "",
                    preferredSmokes: "",
                    preferredDrinks: "",
                    preferredActivity: "",
                    anyAge: true,
                    anyHeight: true,
                    anyDistance: false,
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

