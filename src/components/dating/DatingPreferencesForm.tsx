"use client";

import { useState, useEffect } from "react";
import kyInstance from "@/lib/ky";
import { Loader2, Save, Music } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import instrumentList from "@/data/instrumentList.json";
import skillsList from "@/data/skillsList.json";

export default function DatingPreferencesForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    preferredGender: "",
    preferredSexualOrientation: "",
    preferredMinAge: 0,
    preferredMaxAge: 0,
    preferredMinHeight: 0,
    preferredMaxHeight: 0,
    preferredMaxDistance: 0,
    preferredCoronavirusVaccinated: "",
    preferredReligions: [] as string[],
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
      
      setFormData({
        preferredGender: response.preferredGender || "",
        preferredSexualOrientation: response.preferredSexualOrientation || "",
        preferredMinAge: minAge,
        preferredMaxAge: maxAge,
        preferredMinHeight: minHeight,
        preferredMaxHeight: maxHeight,
        preferredMaxDistance: maxDistance,
        preferredCoronavirusVaccinated: response.preferredCoronavirusVaccinated || "",
        preferredReligions: response.preferredReligions || [],
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

  const handleSave = async () => {
    try {
      setSaving(true);
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
          preferredGender: formData.preferredGender,
          preferredSexualOrientation: formData.preferredSexualOrientation,
          preferredMinAge: formData.preferredMinAge,
          preferredMaxAge: formData.preferredMaxAge,
          preferredMinHeight: formData.preferredMinHeight,
          preferredMaxHeight: formData.preferredMaxHeight,
          preferredMaxDistance: formData.preferredMaxDistance,
          preferredCoronavirusVaccinated: formData.preferredCoronavirusVaccinated,
          preferredReligions: formData.preferredReligions,
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
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-4">
          Gender Preference
        </label>
        <div className="grid grid-cols-2 gap-4">
          {["male", "female"].map((gender) => (
            <label
              key={gender}
              className={`flex items-center p-3 border rounded-lg cursor-pointer text-gray-900 transition-colors ${
                formData.preferredGender === gender
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="preferredGender"
                className="mr-3 w-5 h-5"
                checked={formData.preferredGender === gender}
                onChange={() =>
                  setFormData({ ...formData, preferredGender: gender })
                }
              />
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-4">
          Sexual Orientation Preference
        </label>
        <div className="grid grid-cols-2 gap-4">
          {["straight", "gay", "bisexual", "other"].map((orientation) => (
            <label
              key={orientation}
              className={`flex items-center p-3 border rounded-lg cursor-pointer text-gray-900 transition-colors ${
                formData.preferredSexualOrientation === orientation
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="preferredSexualOrientation"
                className="mr-3 w-5 h-5"
                checked={formData.preferredSexualOrientation === orientation}
                onChange={() =>
                  setFormData({ ...formData, preferredSexualOrientation: orientation })
                }
              />
              {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
            </label>
          ))}
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
          <input
            type="number"
            min="18"
            max="130"
            className="w-full p-3 border rounded-lg"
            value={formData.preferredMinAge === 0 ? "" : formData.preferredMinAge}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setFormData({ ...formData, preferredMinAge: value, anyAge: false });
            }}
            disabled={formData.anyAge}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Maximum Age
          </label>
          <input
            type="number"
            min="18"
            max="130"
            className="w-full p-3 border rounded-lg"
            value={formData.preferredMaxAge === 0 ? "" : formData.preferredMaxAge}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setFormData({ ...formData, preferredMaxAge: value, anyAge: false });
            }}
            disabled={formData.anyAge}
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
                  className="w-full p-3 border rounded-lg"
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
                  className="w-full p-3 border rounded-lg"
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
                  className="w-full p-3 border rounded-lg"
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
                  className="w-full p-3 border rounded-lg"
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
            className="w-full p-3 border rounded-lg"
            value={formData.preferredMaxDistance === 0 ? "" : formData.preferredMaxDistance}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setFormData({ ...formData, preferredMaxDistance: value, anyDistance: false });
            }}
            disabled={formData.anyDistance}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Preferred Vaccination Status
          </label>
          <select
            className="w-full p-3 border rounded-lg"
            value={formData.preferredCoronavirusVaccinated}
            onChange={(e) =>
              setFormData({ ...formData, preferredCoronavirusVaccinated: e.target.value })
            }
          >
            <option value="">No preference</option>
            <option value="Yes">Vaccinated</option>
            <option value="No">Not vaccinated</option>
          </select>
        </div>
      </div>

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

      {/* Music Filters */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Music Preferences (Optional)
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Filter matches by preferred instruments and skills
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Preferred Instruments
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-3">
              <div className="space-y-2">
                {instrumentList.slice(0, 10).map((instrument) => (
                  <label
                    key={instrument}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
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
                {formData.preferredInstruments.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.preferredInstruments.length} selected. Use the
                    Filters button on the dating deck for full list.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Preferred Skills
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-3">
              <div className="space-y-2">
                {skillsList.slice(0, 10).map((skill) => (
                  <label
                    key={skill}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
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
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-900">{skill}</span>
                  </label>
                ))}
                {formData.preferredSkills.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.preferredSkills.length} selected. Use the Filters
                    button on the dating deck for full list.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Music Compatibility Preference */}
      <div className="border-t pt-6">
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
              Prioritize music compatibility
            </span>
            <p className="text-xs text-gray-600 mt-1">
              When enabled, matches will be ranked by music taste compatibility (instruments & skills). 
              Disable to match based on other factors only.
            </p>
          </div>
        </label>
      </div>

      <div className="flex justify-between items-center">
        <Button
          onClick={() => window.location.href = "/dating"}
          variant="outline"
          className="border-gray-300 text-gray-900 hover:bg-gray-100 font-bold"
        >
          Back to Dating
        </Button>
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

