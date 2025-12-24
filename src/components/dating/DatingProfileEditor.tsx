"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import PhotoManager from "./PhotoManager";
import DatingFiltersPanel from "./DatingFiltersPanel";
import DatingHeader from "./DatingHeader";
import datingInterests from "@/data/datingInterests.json";
import HeightSelector from "./HeightSelector";
import DropdownSelector from "./DropdownSelector";
import AgeSelector from "./AgeSelector";
import { BODY_TYPE_OPTIONS, JOB_OPTIONS, PETS_OPTIONS, normalizeBodyTypeValue, normalizeJobValue, normalizePetsArray } from "@/lib/dating/profileOptions";

export default function DatingProfileEditor() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "photos" | "preferences">("profile");

  const [formData, setFormData] = useState({
    bio: "",
    age: 0,
    height: 0,
    gender: "",
    zipCode: "",
    coronavirusVaccinated: "",
    religion: "",
    bodyType: "",
    sexualOrientation: "",
    hasKids: null as boolean | null,
    smokes: "",
    drinks: "",
    activity: "",
    education: "",
    job: "",
    pets: [] as string[],
    interests: [] as string[],
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await kyInstance
        .get("/api/dating/profile")
        .json<{
          profile: any;
          bio: string;
        }>();

      if (response.profile) {
        setFormData({
          bio: response.bio || "",
          age: response.profile.age || 0,
          height: response.profile.height || 0,
          gender: response.profile.gender || "",
          zipCode: response.profile.zipCode || "",
          coronavirusVaccinated: response.profile.coronavirusVaccinated || "",
          religion: response.profile.religion || "",
          bodyType: normalizeBodyTypeValue(response.profile.bodyType),
          sexualOrientation: response.profile.sexualOrientation || "",
          hasKids: response.profile.hasKids ?? null,
          smokes: response.profile.smokes || "",
          drinks: response.profile.drinks || "",
          activity: response.profile.activity || "",
          education: response.profile.education || "",
          job: normalizeJobValue(response.profile.job),
          pets: normalizePetsArray(response.profile.pets),
          interests: response.profile.interests || [],
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        variant: "destructive",
        description: "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await kyInstance.put("/api/dating/profile", {
        json: formData,
      });

      toast({
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        description: "Failed to save profile",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="w-full px-2 sm:px-4 lg:max-w-4xl lg:mx-auto">
        <DatingHeader title="Edit Profile" />
        <div className="mb-6">
          <p className="text-gray-600">Manage your dating profile, photos, and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-sm border-b">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "profile"
                  ? "bg-purple-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "photos"
                  ? "bg-purple-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Photos
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Bio
                </label>
                <textarea
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Tell us about yourself and your music taste..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AgeSelector
                  value={formData.age}
                  onChange={(age) => setFormData({ ...formData, age })}
                  label="Age"
                  min={18}
                  max={130}
                />

                <HeightSelector
                  value={formData.height}
                  onChange={(heightInInches) => setFormData({ ...formData, height: heightInInches })}
                  label="Height"
                />

                <DropdownSelector
                  value={formData.gender}
                  onChange={(value) => setFormData({ ...formData, gender: value })}
                  options={[
                    { label: "Select gender", value: "" },
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                  ]}
                  label="Gender"
                  placeholder="Select gender"
                />

                <DropdownSelector
                  value={formData.sexualOrientation}
                  onChange={(value) => setFormData({ ...formData, sexualOrientation: value })}
                  options={[
                    { label: "Select orientation", value: "" },
                    { label: "Straight", value: "straight" },
                    { label: "Gay", value: "gay" },
                    { label: "Bisexual", value: "bisexual" },
                    { label: "Other", value: "other" },
                  ]}
                  label="Sexual Orientation"
                  placeholder="Select orientation"
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Location (Zip Code)
                  </label>
                  <input
                    type="text"
                    className="w-full h-11 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 90210"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your zip code for distance matching</p>
                </div>

                <DropdownSelector
                  value={formData.coronavirusVaccinated}
                  onChange={(value) => setFormData({ ...formData, coronavirusVaccinated: value })}
                  options={[
                    { label: "Select status", value: "" },
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ]}
                  label="Vaccination Status"
                  placeholder="Select status"
                />

                <DropdownSelector
                  value={formData.religion}
                  onChange={(value) => setFormData({ ...formData, religion: value })}
                  options={[
                    { label: "Select religion", value: "" },
                    { label: "Christianity", value: "christianity" },
                    { label: "Catholicism", value: "catholicism" },
                    { label: "Judaism", value: "judaism" },
                    { label: "Islam", value: "islam" },
                    { label: "Hinduism", value: "hinduism" },
                    { label: "Buddhism", value: "buddhism" },
                    { label: "Sikhism", value: "sikhism" },
                    { label: "Atheism", value: "atheism" },
                    { label: "Agnosticism", value: "agnosticism" },
                    { label: "Undecided", value: "undecided" },
                  ]}
                  label="Religion"
                  placeholder="Select religion"
                />

                <DropdownSelector
                  value={formData.hasKids === null ? "" : formData.hasKids ? "yes" : "no"}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      hasKids: value === "" ? null : value === "yes",
                    })
                  }
                  options={[
                    { label: "Prefer not to say", value: "" },
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ]}
                  label="Has Kids"
                  placeholder="Prefer not to say"
                />

                <DropdownSelector
                  value={formData.smokes}
                  onChange={(value) => setFormData({ ...formData, smokes: value })}
                  options={[
                    { label: "Select option", value: "" },
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                    { label: "Social", value: "Social" },
                  ]}
                  label="Smokes"
                  placeholder="Select option"
                      />

                <DropdownSelector
                  value={formData.drinks}
                  onChange={(value) => setFormData({ ...formData, drinks: value })}
                  options={[
                    { label: "Select option", value: "" },
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                    { label: "Social", value: "Social" },
                  ]}
                  label="Drinks"
                  placeholder="Select option"
                />

                <DropdownSelector
                  value={formData.activity}
                  onChange={(value) => setFormData({ ...formData, activity: value })}
                  options={[
                    { label: "Select activity level", value: "" },
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
                  placeholder="Select activity level"
                />

                <div>
                  <DropdownSelector
                    value={formData.education}
                    onChange={(value) => setFormData({ ...formData, education: value })}
                    options={[
                      { label: "Select education level", value: "" },
                      { label: "High School", value: "high_school" },
                      { label: "Some College", value: "some_college" },
                      { label: "Bachelor's", value: "bachelors" },
                      { label: "Master's", value: "masters" },
                      { label: "PhD", value: "phd" },
                      { label: "Professional", value: "professional" },
                    ]}
                    label="Education Level"
                    placeholder="Select education level"
                  />
                </div>

                <div>
                  <DropdownSelector
                    value={formData.job}
                    onChange={(value) => setFormData({ ...formData, job: value })}
                    options={JOB_OPTIONS}
                    label="Job"
                    placeholder="Select job category"
                  />
                </div>

                <div>
                  <DropdownSelector
                    value={formData.bodyType}
                    onChange={(value) => setFormData({ ...formData, bodyType: value })}
                    options={[{ label: "Select body type (optional)", value: "" }, ...BODY_TYPE_OPTIONS]}
                    label="Body Type"
                    placeholder="Select body type (optional)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Pets (Select all that apply)
                  </label>
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {PETS_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.pets.includes(opt.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  pets: [...formData.pets, opt.value],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  pets: formData.pets.filter((p) => p !== opt.value),
                                });
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {formData.pets.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.pets.length} pet option{formData.pets.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
                </div>

              {/* Interests Section */}
                <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Interests (Select all that apply)
                  </label>
                <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {datingInterests.map((interest) => (
                      <label
                        key={interest}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(interest)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                interests: [...formData.interests, interest],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                interests: formData.interests.filter((i) => i !== interest),
                              });
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {formData.interests.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.interests.length} interest{formData.interests.length !== 1 ? "s" : ""} selected
                  </p>
                )}
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
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "photos" && <PhotoManager />}
          
          {activeTab === "preferences" && (
            <DatingFiltersPanel
              asModal={false}
              onFiltersChange={() => {
                // Optional: show success message or refresh data
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}



