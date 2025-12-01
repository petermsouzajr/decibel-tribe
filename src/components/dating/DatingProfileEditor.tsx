"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import PhotoManager from "./PhotoManager";
import DatingPreferencesForm from "./DatingPreferencesForm";

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
    location: "",
    coronavirusVaccinated: "",
    religion: "",
    sexualOrientation: "",
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
          location: response.profile.location || "",
          coronavirusVaccinated: response.profile.coronavirusVaccinated || "",
          religion: response.profile.religion || "",
          sexualOrientation: response.profile.sexualOrientation || "",
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Dating Profile</h1>
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
            <button
              onClick={() => setActiveTab("preferences")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "preferences"
                  ? "bg-purple-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Preferences
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
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="Tell us about yourself and your music taste..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    className="w-full p-3 border rounded-lg"
                    value={formData.age === 0 ? "" : formData.age}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, age: value });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Height
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="9"
                        className="w-full p-3 border rounded-lg"
                        value={Math.floor(formData.height / 12) || ""}
                        onChange={(e) => {
                          const feet = parseInt(e.target.value) || 0;
                          const inches = formData.height % 12;
                          setFormData({ ...formData, height: feet * 12 + inches });
                        }}
                        placeholder="Feet"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="11"
                        className="w-full p-3 border rounded-lg"
                        value={formData.height % 12 || ""}
                        onChange={(e) => {
                          const inches = parseInt(e.target.value) || 0;
                          const feet = Math.floor(formData.height / 12);
                          setFormData({ ...formData, height: feet * 12 + inches });
                        }}
                        placeholder="Inches"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Gender
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Sexual Orientation
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={formData.sexualOrientation}
                    onChange={(e) =>
                      setFormData({ ...formData, sexualOrientation: e.target.value })
                    }
                  >
                    <option value="">Select orientation</option>
                    <option value="straight">Straight</option>
                    <option value="gay">Gay</option>
                    <option value="bisexual">Bisexual</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg"
                    placeholder="Zip code"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Vaccination Status
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={formData.coronavirusVaccinated}
                    onChange={(e) =>
                      setFormData({ ...formData, coronavirusVaccinated: e.target.value })
                    }
                  >
                    <option value="">Select status</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Religion
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={formData.religion}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  >
                    <option value="">Select religion</option>
                    <option value="christianity">Christianity</option>
                    <option value="catholicism">Catholicism</option>
                    <option value="judaism">Judaism</option>
                    <option value="islam">Islam</option>
                    <option value="hinduism">Hinduism</option>
                    <option value="buddhism">Buddhism</option>
                    <option value="sikhism">Sikhism</option>
                    <option value="atheism">Atheism</option>
                    <option value="agnosticism">Agnosticism</option>
                    <option value="undecided">Undecided</option>
                  </select>
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
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "photos" && <PhotoManager />}

          {activeTab === "preferences" && <DatingPreferencesForm />}
        </div>
      </div>
    </div>
  );
}


