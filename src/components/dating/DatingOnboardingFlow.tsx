"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingData {
  // User profile (clearly "mine" by context)
  bio: string;
  age: number;
  height: number;
  gender: string;
  location: string;
  coronavirusVaccinated: string;
  religion: string;
  sexualOrientation: string;
  
  // Preferences (clearly "theirs" by context and naming)
  preferredGender: string;
  preferredSexualOrientation: string;
  preferredMinAge: number;
  preferredMaxAge: number;
  preferredMinHeight: number;
  preferredMaxHeight: number;
  preferredMaxDistance: number;
  preferredCoronavirusVaccinated: string;
  preferredReligions: string[];
}

interface DatingOnboardingFlowProps {
  user: any;
}

const DatingOnboardingFlow = ({ user }: DatingOnboardingFlowProps) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Load existing data from the new table structure
  const existingProfile = (user as any).user_dating_profile;
  const existingPreferences = (user as any).user_dating_preferences;
  const isVerified = (user as any).isVerified ?? false;
  
  const [formData, setFormData] = useState<OnboardingData>({
    // User profile data
    bio: (user as any).bio || "",
    age: existingProfile?.age || 0,
    height: existingProfile?.height || 0,
    gender: existingProfile?.gender || "",
    location: existingProfile?.location || "",
    coronavirusVaccinated: existingProfile?.coronavirusVaccinated || "",
    religion: existingProfile?.religion || "",
    sexualOrientation: existingProfile?.sexualOrientation || "",
    
    // Preference data
    preferredGender: existingPreferences?.preferredGender || "",
    preferredSexualOrientation: existingPreferences?.preferredSexualOrientation || "",
    preferredMinAge: existingPreferences?.preferredMinAge || 0,
    preferredMaxAge: existingPreferences?.preferredMaxAge || 0,
    preferredMinHeight: existingPreferences?.preferredMinHeight || 0,
    preferredMaxHeight: existingPreferences?.preferredMaxHeight || 0,
    preferredMaxDistance: existingPreferences?.preferredMaxDistanceKm || 0,
    preferredCoronavirusVaccinated: existingPreferences?.preferredCoronavirusVaccinated || "",
    preferredReligions: existingPreferences?.preferredReligions || []
  });
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 5;

  // Validation functions for each step
  const isStep1Valid = () => {
    return formData.age >= 18 && 
           formData.height >= 12 && // Minimum 1 foot
           formData.gender !== "" && 
           formData.sexualOrientation !== "" && 
           formData.location.trim() !== "";
  };

  const isStep2Valid = () => {
    return formData.preferredGender !== "" && 
           formData.preferredSexualOrientation !== "";
  };

  const isStep3Valid = () => {
    return formData.preferredMinAge >= 18 && 
           formData.preferredMaxAge >= 18 && 
           formData.preferredMaxAge > formData.preferredMinAge && 
           formData.preferredMinHeight >= 12 && // Minimum 1 foot
           formData.preferredMaxHeight >= 12 && // Minimum 1 foot
           formData.preferredMaxHeight > formData.preferredMinHeight &&
           formData.preferredMaxDistance > 0;
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1: return isStep1Valid();
      case 2: return isStep2Valid();
      case 3: return isStep3Valid();
      case 4: return true; // Review step is always valid
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && isCurrentStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? Your progress will be lost.")) {
      router.push(`/users/${user.username}`);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // Save dating preferences to database
      const response = await fetch("/api/dating/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Enable dating feature
        const toggleResponse = await fetch("/api/dating/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: true }),
        });

        if (toggleResponse.ok) {
          // Go to success step
          setCurrentStep(5);
        } else {
          console.error("Failed to enable dating");
          alert("Failed to enable dating feature. Please try again.");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to save preferences:", errorData);
        alert(errorData.error || "Failed to save preferences. Please try again.");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl text-gray-900 font-bold text-center mb-6">Tell us about yourself</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-900 font-bold mb-2">About you</label>
                <textarea
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="Tell us about yourself and your music taste..."
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                />
              </div>
                              <div>
                  <label className="block text-sm text-gray-900 font-bold mb-2">
                    Age {formData.age <= 0 && (
                    <span className="text-red-500 text-md mt-1">*</span>
                  )}
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    className={`w-full p-3 border rounded-lg ${formData.age < 18 ? 'border-red-500' : ''}`}
                    value={formData.age === 0 ? '' : formData.age}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow typing any number, but store as 0 if invalid
                      const numValue = parseInt(value) || 0;
                      setFormData({...formData, age: numValue});
                    }}
                    onFocus={(e) => {
                      if (formData.age === 0) {
                        e.target.value = '';
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      // Clear field if user enters value below 18
                      if (value < 18) {
                        setFormData({...formData, age: 0});
                      }
                    }}
                  />
                  {formData.age < 18 && (
                    <p className="text-red-500 text-xs mt-1">
                      {formData.age === 0 ? "Age is required" : "Age must be at least 18"}
                    </p>
                  )}
                </div>
              <div>
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Height {formData.height < 12 && (
                  <span className="text-red-500 text-md mt-1">*</span>
                )}
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="9"
                      className={`w-full p-3 border rounded-lg ${formData.height < 12 ? 'border-red-500' : ''}`}
                      value={Math.floor(formData.height / 12) === 0 ? '' : Math.floor(formData.height / 12)}
                      onChange={(e) => {
                        const value = e.target.value;
                        const feet = parseInt(value) || 0;
                        const inches = formData.height % 12;
                        setFormData({...formData, height: feet * 12 + inches});
                      }}
                      onFocus={(e) => {
                        if (Math.floor(formData.height / 12) === 0) {
                          e.target.value = '';
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (value < 0) {
                          const inches = formData.height % 12;
                          setFormData({...formData, height: inches});
                        }
                      }}
                      placeholder="0"
                    />
                    <label className="text-xs text-gray-500 mt-1 block">Feet</label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="11"
                      className={`w-full p-3 border rounded-lg ${formData.height < 12 ? 'border-red-500' : ''}`}
                      value={formData.height % 12 === 0 ? '' : formData.height % 12}
                      onChange={(e) => {
                        const value = e.target.value;
                        const inches = parseInt(value) || 0;
                        const feet = Math.floor(formData.height / 12);
                        setFormData({...formData, height: feet * 12 + inches});
                      }}
                      onFocus={(e) => {
                        if (formData.height % 12 === 0) {
                          e.target.value = '';
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (value < 0) {
                          const feet = Math.floor(formData.height / 12);
                          setFormData({...formData, height: feet * 12});
                        }
                      }}
                      placeholder="0"
                    />
                    <label className="text-xs text-gray-500 mt-1 block">Inches</label>
                  </div>
                </div>
                {formData.height < 12 && (
                  <p className="text-red-500 text-xs mt-1">
                    Height must be at least 1 foot
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Gender {formData.gender === "" && (
                  <span className="text-red-500 text-md mt-1">*</span>
                )}
                </label>
                <select
                  required
                  className={`w-full p-3 border rounded-lg ${formData.gender === "" ? 'border-red-500' : ''}`}
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {formData.gender === "" && (
                  <p className="text-red-500 text-xs mt-1">Gender is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Sexual Orientation {formData.sexualOrientation === "" && (
                  <span className="text-red-500 text-md mt-1">*</span>
                )}
                </label>
                <select
                  required
                  className={`w-full p-3 border rounded-lg ${formData.sexualOrientation === "" ? 'border-red-500' : ''}`}
                  value={formData.sexualOrientation}
                  onChange={(e) => setFormData({...formData, sexualOrientation: e.target.value})}
                >
                  <option value="">Select sexual orientation</option>
                  <option value="straight">Straight</option>
                  <option value="gay">Gay</option>
                  <option value="bisexual">Bisexual</option>
                  <option value="other">Other</option>
                </select>
                {formData.sexualOrientation === "" && (
                  <p className="text-red-500 text-xs mt-1">Sexual orientation is required</p>
                )}
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Location {formData.location.trim() === "" && (
                  <span className="text-red-500 text-md mt-1">*</span>
                )}
                </label>
                <input
                  type="text"
                  required
                  className={`w-full p-3 border rounded-lg ${formData.location.trim() === "" ? 'border-red-500' : ''}`}
                  placeholder="Zip code"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
                {formData.location.trim() === "" && (
                  <p className="text-red-500 text-xs mt-1">Location is required</p>
                )}
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Coronavirus Vaccinated
                </label>
                <select
                  className="w-full p-3 border rounded-lg"
                  value={formData.coronavirusVaccinated}
                  onChange={(e) => setFormData({...formData, coronavirusVaccinated: e.target.value})}
                >
                  <option value="">Select vaccination status (optional)</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Religion
                </label>
                <select
                  className="w-full p-3 border rounded-lg"
                  value={formData.religion}
                  onChange={(e) => setFormData({...formData, religion: e.target.value})}
                >
                  <option value="">Select religion (optional)</option>
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl text-gray-900 font-bold text-center mb-6">What are you looking for?</h2>
            <div className="max-w-2xl mx-auto">
              <label className="block text-sm text-gray-900 font-bold mb-4">
                Gender {formData.preferredGender === "" && (
                  <span className="text-red-500 text-md mt-1">*</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-4">
                {["male", "female"].map((gender) => (
                  <label key={gender} className={`flex items-center p-3 border rounded-lg cursor-pointer text-gray-900 transition-colors ${
                    formData.preferredGender === gender 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-gray-300 hover:bg-gray-50"
                  }`}>
                    <input
                      type="radio"
                      name="preferredGender"
                      className="mr-3 w-5 h-5 border-2 border-gray-300 bg-white text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      checked={formData.preferredGender === gender}
                      onChange={() => setFormData({
                        ...formData,
                        preferredGender: gender
                      })}
                    />
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </label>
                ))}
              </div>
              {formData.preferredGender === "" && (
                <p className="text-red-500 text-xs mt-2">Please select a gender preference</p>
              )}
            </div>
            <div className="max-w-2xl mx-auto">
              <label className="block text-sm text-gray-900 font-bold mb-4">
                Sexual Orientation {formData.preferredSexualOrientation === "" && (
                  <span className="text-red-500 text-md mt-1">*</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-4">
                {["straight", "gay", "bisexual", "other"].map((orientation) => (
                  <label key={orientation} className={`flex items-center p-3 border rounded-lg cursor-pointer text-gray-900 transition-colors ${
                    formData.preferredSexualOrientation === orientation 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-gray-300 hover:bg-gray-50"
                  }`}>
                    <input
                      type="radio"
                      name="preferredSexualOrientation"
                      className="mr-3 w-5 h-5 border-2 border-gray-300 bg-white text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      checked={formData.preferredSexualOrientation === orientation}
                      onChange={() => setFormData({
                        ...formData,
                        preferredSexualOrientation: orientation
                      })}
                    />
                    {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                  </label>
                ))}
              </div>
              {formData.preferredSexualOrientation === "" && (
                <p className="text-red-500 text-xs mt-2">Please select a sexual orientation preference</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl text-gray-900 font-bold text-center mb-6">What are you looking for?</h2>
            <div className="max-w-2xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-900 font-bold mb-2">
                    Minimum Age {formData.preferredMinAge < 18 && (
                    <span className="text-red-500 text-md mt-1">*</span>
                  )}
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    className={`w-full p-3 border rounded-lg ${formData.preferredMinAge < 18 ? 'border-red-500' : ''}`}
                    value={formData.preferredMinAge === 0 ? '' : formData.preferredMinAge}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow typing any number, but store as 0 if invalid
                      const numValue = parseInt(value) || 0;
                      setFormData({...formData, preferredMinAge: numValue});
                    }}
                    onFocus={(e) => {
                      if (formData.preferredMinAge === 0) {
                        e.target.value = '';
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      // Clear field if user enters value below 18
                      if (value < 18) {
                        setFormData({...formData, preferredMinAge: 0});
                      }
                    }}
                  />
                  {formData.preferredMinAge < 18 && (
                    <p className="text-red-500 text-xs mt-1">
                      {formData.preferredMinAge === 0 ? "Minimum age is required" : "Minimum age must be at least 18"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-900 font-bold mb-2">
                    Maximum Age {formData.preferredMaxAge < 18 && (
                    <span className="text-red-500 text-md mt-1">*</span>
                  )}
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    className={`w-full p-3 border rounded-lg ${formData.preferredMaxAge < 18 ? 'border-red-500' : ''}`}
                    value={formData.preferredMaxAge === 0 ? '' : formData.preferredMaxAge}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow typing any number, but store as 0 if invalid
                      const numValue = parseInt(value) || 0;
                      setFormData({...formData, preferredMaxAge: numValue});
                    }}
                    onFocus={(e) => {
                      if (formData.preferredMaxAge === 0) {
                        e.target.value = '';
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      // Clear field if user enters value below 18
                      if (value < 18) {
                        setFormData({...formData, preferredMaxAge: 0});
                      }
                    }}
                  />
                  {formData.preferredMaxAge < 18 && (
                    <p className="text-red-500 text-xs mt-1">
                      {formData.preferredMaxAge === 0 ? "Maximum age is required" : "Maximum age must be at least 18"}
                    </p>
                  )}
                  {(formData.preferredMinAge > 0 && formData.preferredMaxAge > 0 && formData.preferredMaxAge <= formData.preferredMinAge) && (
                 <p className="text-red-500 text-md mt-2">Maximum age must be greater than minimum age</p>
               )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Preferred Height Range {(formData.preferredMinHeight < 12 || formData.preferredMaxHeight < 12) && (
                  <span className="text-red-500 text-md mt-1">*</span>
                )}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Minimum Height */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600">Minimum Height</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          max="9"
                          className={`w-full p-3 border rounded-lg ${formData.preferredMinHeight < 12 ? 'border-red-500' : ''}`}
                          value={Math.floor(formData.preferredMinHeight / 12) === 0 ? '' : Math.floor(formData.preferredMinHeight / 12)}
                          onChange={(e) => {
                            const value = e.target.value;
                            const feet = parseInt(value) || 0;
                            const inches = formData.preferredMinHeight % 12;
                            setFormData({...formData, preferredMinHeight: feet * 12 + inches});
                          }}
                          onFocus={(e) => {
                            if (Math.floor(formData.preferredMinHeight / 12) === 0) {
                              e.target.value = '';
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value < 0) {
                              const inches = formData.preferredMinHeight % 12;
                              setFormData({...formData, preferredMinHeight: inches});
                            }
                          }}
                          placeholder="0"
                        />
                        <label className="text-xs text-gray-500 mt-1 block">Feet</label>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          max="11"
                          className={`w-full p-3 border rounded-lg ${formData.preferredMinHeight < 12 ? 'border-red-500' : ''}`}
                          value={formData.preferredMinHeight % 12 === 0 ? '' : formData.preferredMinHeight % 12}
                          onChange={(e) => {
                            const value = e.target.value;
                            const inches = parseInt(value) || 0;
                            const feet = Math.floor(formData.preferredMinHeight / 12);
                            setFormData({...formData, preferredMinHeight: feet * 12 + inches});
                          }}
                          onFocus={(e) => {
                            if (formData.preferredMinHeight % 12 === 0) {
                              e.target.value = '';
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value < 0) {
                              const feet = Math.floor(formData.preferredMinHeight / 12);
                              setFormData({...formData, preferredMinHeight: feet * 12});
                            }
                          }}
                          placeholder="0"
                        />
                        <label className="text-xs text-gray-500 mt-1 block">Inches</label>
                      </div>
                    </div>
                  </div>

                  {/* Maximum Height */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600">Maximum Height</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          max="8"
                          className={`w-full p-3 border rounded-lg ${formData.preferredMaxHeight < 12 ? 'border-red-500' : ''}`}
                          value={Math.floor(formData.preferredMaxHeight / 12) === 0 ? '' : Math.floor(formData.preferredMaxHeight / 12)}
                          onChange={(e) => {
                            const value = e.target.value;
                            const feet = parseInt(value) || 0;
                            const inches = formData.preferredMaxHeight % 12;
                            setFormData({...formData, preferredMaxHeight: feet * 12 + inches});
                          }}
                          onFocus={(e) => {
                            if (Math.floor(formData.preferredMaxHeight / 12) === 0) {
                              e.target.value = '';
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value < 0) {
                              const inches = formData.preferredMaxHeight % 12;
                              setFormData({...formData, preferredMaxHeight: inches});
                            }
                          }}
                          placeholder="0"
                        />
                        <label className="text-xs text-gray-500 mt-1 block">Feet</label>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          max="11"
                          className={`w-full p-3 border rounded-lg ${formData.preferredMaxHeight < 12 ? 'border-red-500' : ''}`}
                          value={formData.preferredMaxHeight % 12 === 0 ? '' : formData.preferredMaxHeight % 12}
                          onChange={(e) => {
                            const value = e.target.value;
                            const inches = parseInt(value) || 0;
                            const feet = Math.floor(formData.preferredMaxHeight / 12);
                            setFormData({...formData, preferredMaxHeight: feet * 12 + inches});
                          }}
                          onFocus={(e) => {
                            if (formData.preferredMaxHeight % 12 === 0) {
                              e.target.value = '';
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value < 0) {
                              const feet = Math.floor(formData.preferredMaxHeight / 12);
                              setFormData({...formData, preferredMaxHeight: feet * 12});
                            }
                          }}
                          placeholder="0"
                        />
                        <label className="text-xs text-gray-500 mt-1 block">Inches</label>
                      </div>
                    </div>
                  </div>
                </div>
                {(formData.preferredMinHeight < 12 || formData.preferredMaxHeight < 12) && (
                  <p className="text-red-500 text-xs mt-1">
                    Height range must be at least 1 foot
                  </p>
                )}
                {(formData.preferredMinHeight >= 12 && formData.preferredMaxHeight >= 12 && formData.preferredMaxHeight <= formData.preferredMinHeight) && (
                  <p className="text-red-500 text-md mt-2">Maximum height must be greater than minimum height</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-900 font-bold mb-2">
                    Maximum Distance (miles) {formData.preferredMaxDistance <= 0 && (
                    <span className="text-red-500 text-md mt-1">*</span>
                  )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    required
                    className={`w-full p-3 border rounded-lg ${formData.preferredMaxDistance <= 0 ? 'border-red-500' : ''}`}
                    value={formData.preferredMaxDistance === 0 ? '' : formData.preferredMaxDistance}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseInt(value) || 0;
                      setFormData({...formData, preferredMaxDistance: numValue});
                    }}
                    onFocus={(e) => {
                      if (formData.preferredMaxDistance === 0) {
                        e.target.value = '';
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (value < 1) {
                        setFormData({...formData, preferredMaxDistance: 0});
                      }
                    }}
                  />
                  {formData.preferredMaxDistance <= 0 && (
                    <p className="text-red-500 text-xs mt-1">Maximum distance is required</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm text-gray-900 font-bold mb-2">
                    Preferred Vaccination Status
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={formData.preferredCoronavirusVaccinated}
                    onChange={(e) => setFormData({...formData, preferredCoronavirusVaccinated: e.target.value})}
                  >
                    <option value="">No preference</option>
                    <option value="Yes">Vaccinated</option>
                    <option value="No">Not vaccinated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Preferred Religions (Optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "Christianity", "Catholicism", "Islam", "Judaism", 
                    "Buddhism", "Hinduism", "Sikhism", "Atheist", 
                    "Agnostic", "Undecided"
                  ].map((religion) => (
                    <label key={religion} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-2 border-gray-300 bg-white checked:bg-purple-500 checked:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        checked={formData.preferredReligions.includes(religion)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              preferredReligions: [...formData.preferredReligions, religion]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              preferredReligions: formData.preferredReligions.filter(r => r !== religion)
                            });
                          }
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900">{religion}</span>
                    </label>
                  ))}
                </div>
              </div>
                   
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl text-gray-900 font-bold text-center mb-6">Review Your Profile</h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Info Column */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Info</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-900 font-bold">About you</p>
                      <p className="font-medium text-gray-900">{formData.bio || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Age</p>
                      <p className="font-medium text-gray-900">{formData.age}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Gender</p>
                      <p className="font-medium text-gray-900">{formData.gender || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Height</p>
                      <p className="font-medium text-gray-900">
                        {Math.floor(formData.height / 12)}&apos; {formData.height % 12}&quot;
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Location</p>
                      <p className="font-medium text-gray-900">{formData.location || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Coronavirus Vaccinated</p>
                      <p className="font-medium text-gray-900">{formData.coronavirusVaccinated || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Religion</p>
                      <p className="font-medium text-gray-900">{formData.religion || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Sexual Orientation</p>
                      <p className="font-medium text-gray-900">{formData.sexualOrientation || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                {/* Dating Preferences Column */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Dating Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Looking for (Gender)</p>
                      <p className="font-medium text-gray-900">{formData.preferredGender || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Looking for (Orientation)</p>
                      <p className="font-medium text-gray-900">{formData.preferredSexualOrientation || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Age range</p>
                      <p className="font-medium text-gray-900">{formData.preferredMinAge} - {formData.preferredMaxAge}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Height range</p>
                      <p className="font-medium text-gray-900">
                        {Math.floor(formData.preferredMinHeight / 12)}&apos; {formData.preferredMinHeight % 12}&quot; - {Math.floor(formData.preferredMaxHeight / 12)}&apos; {formData.preferredMaxHeight % 12}&quot;
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Max distance</p>
                      <p className="font-medium text-gray-900">{formData.preferredMaxDistance} miles</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Vaccination preference</p>
                      <p className="font-medium text-gray-900">{formData.preferredCoronavirusVaccinated || "No preference"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-bold">Religion preferences</p>
                      <p className="font-medium text-gray-900">{formData.preferredReligions.length > 0 ? formData.preferredReligions.join(", ") : "No preference"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-600 mt-6">Click Finish to complete your dating profile setup!</p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl text-gray-900 font-bold mb-4">Setup Complete!</h2>
              {isVerified ? (
                <p className="text-gray-600 font-bold mb-8">
                  Your dating profile is ready and you can start finding matches!
                </p>
              ) : (
                <div className="mb-8">
                  <p className="text-gray-600 font-bold mb-4">
                    Your dating profile is ready! You can browse profiles and dislike users.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-yellow-800 font-semibold mb-1">
                      ⚠️ Verify Your Email to Like Users
                    </p>
                    <p className="text-sm text-yellow-700">
                      Check your email for a verification link. Once verified, you'll be able to like users and appear in others' decks!
                    </p>
                  </div>
                </div>
              )}
              
                              <div className="space-y-4 w-full max-w-2xl mx-auto">
                  <Button
                    onClick={() => router.push("/dating")}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-6 text-lg"
                  >
                    {isVerified ? "Start Finding Matches" : "Browse Profiles"}
                  </Button>
                  <Button
                    onClick={() => router.push(`/users/${user.username}`)}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-900 hover:bg-gray-100 font-bold py-6 text-lg"
                  >
                    Back to Profile
                  </Button>
                </div>
            </div>
          </div>
        );

      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Close Button */}
        <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-gray-500 mb-4 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2"
        >
          <X className="w-5 h-5" />
        </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={currentStep > 1 ? handleBack : handleCancel}
              className="flex items-center text-gray-900 font-bold"
            >
              {currentStep > 1 ? (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              )}
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!isCurrentStepValid()}
                className={`flex items-center ${
                  isCurrentStepValid() 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={isLoading}
                className="flex items-center bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Finishing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Finish
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatingOnboardingFlow; 