"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import datingInterests from "@/data/datingInterests.json";
import HeightSelector from "./HeightSelector";
import DropdownSelector from "./DropdownSelector";
import AgeSelector from "./AgeSelector";

interface GenderPreference {
  gender: string;
  sexualOrientation: string[]; // Changed to array to support multiple selections
}

interface OnboardingData {
  // User profile (clearly "mine" by context)
  bio: string;
  age: number;
  height: number;
  gender: string;
  zipCode: string;
  coronavirusVaccinated: string;
  religion: string;
  sexualOrientation: string;
  hasKids: boolean | null;
  smokes: string;
  drinks: string;
  activity: string;
  education: string;
  job: string;
  pets: string;
  interests: string[];
  
  // Preferences (clearly "theirs" by context and naming)
  // Support multiple gender preferences, each with their own orientation
  preferredGenders: GenderPreference[];
  // Legacy fields for backward compatibility (will be derived from preferredGenders)
  preferredGender: string;
  preferredSexualOrientation: string;
  preferredMinAge: number;
  preferredMaxAge: number;
  preferredMinHeight: number;
  preferredMaxHeight: number;
  preferredMaxDistance: number;
  preferredCoronavirusVaccinated: string;
  preferredReligions: string[];
  // Match strictness controls
  exactMatchAllFilters: boolean;
  minimumMatchPercentage: number;
  nonNegotiableFields: string[];
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
  
  // Parse existing preferences - support both old format (single gender) and new format (multiple)
  const parseExistingPreferences = (): GenderPreference[] => {
    // Try to parse as JSON first (new format)
    if (existingPreferences?.preferredGender) {
      try {
        const parsed = JSON.parse(existingPreferences.preferredGender);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Not JSON, continue with single value handling
      }
    }
    
    // Old format: single gender with single orientation
    if (existingPreferences?.preferredGender && existingPreferences?.preferredSexualOrientation) {
      return [{
        gender: existingPreferences.preferredGender,
        sexualOrientation: Array.isArray(existingPreferences.preferredSexualOrientation) 
          ? existingPreferences.preferredSexualOrientation 
          : [existingPreferences.preferredSexualOrientation]
      }];
    }
    
    return [];
  };

  const [formData, setFormData] = useState<OnboardingData>({
    // User profile data
    bio: (user as any).bio || "",
    age: existingProfile?.age || 0,
    height: existingProfile?.height || 0,
    gender: existingProfile?.gender || "",
    zipCode: existingProfile?.zipCode || "",
    coronavirusVaccinated: existingProfile?.coronavirusVaccinated || "",
    religion: existingProfile?.religion || "",
    sexualOrientation: existingProfile?.sexualOrientation || "",
    hasKids: existingProfile?.hasKids ?? null,
    smokes: existingProfile?.smokes || "",
    drinks: existingProfile?.drinks || "",
    activity: existingProfile?.activity || "",
    education: existingProfile?.education || "",
    job: existingProfile?.job || "",
    pets: existingProfile?.pets || "",
    interests: existingProfile?.interests || [],
    
    // Preference data - new format with multiple gender preferences
    preferredGenders: parseExistingPreferences(),
    // Legacy fields for backward compatibility
    preferredGender: existingPreferences?.preferredGender || "",
    preferredSexualOrientation: existingPreferences?.preferredSexualOrientation || "",
    preferredMinAge: existingPreferences?.preferredMinAge || 0,
    preferredMaxAge: existingPreferences?.preferredMaxAge || 0,
    preferredMinHeight: existingPreferences?.preferredMinHeight || 0,
    preferredMaxHeight: existingPreferences?.preferredMaxHeight || 0,
    preferredMaxDistance: existingPreferences?.preferredMaxDistanceKm || 0,
    preferredCoronavirusVaccinated: existingPreferences?.preferredCoronavirusVaccinated || "",
    preferredReligions: existingPreferences?.preferredReligions || [],
    exactMatchAllFilters: existingPreferences?.exactMatchAllFilters ?? false,
    minimumMatchPercentage: existingPreferences?.minimumMatchPercentage ?? 70,
    nonNegotiableFields: existingPreferences?.nonNegotiableFields || []
  });
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 5;

  // Validation functions for each step
  const isStep1Valid = () => {
    return formData.age >= 18 && 
           formData.height >= 12 && // Minimum 1 foot
           formData.gender !== "" && 
           formData.sexualOrientation !== "" && 
           formData.zipCode.trim() !== "";
  };

  const isStep2Valid = () => {
    // At least one gender preference must be selected with at least one orientation
    return formData.preferredGenders.length > 0 && 
           formData.preferredGenders.every(pref => 
             Array.isArray(pref.sexualOrientation) && pref.sexualOrientation.length > 0
           );
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
      // Convert preferredGenders array to format API expects
      // Store as JSON string in preferredGender field for now (will need API update later)
      const submissionData = {
        ...formData,
        // Store preferredGenders as JSON string in preferredGender field
        preferredGender: JSON.stringify(formData.preferredGenders),
          // For backward compatibility, also set single values (use first preference's first orientation)
          preferredSexualOrientation: formData.preferredGenders.length > 0 && 
            Array.isArray(formData.preferredGenders[0].sexualOrientation) &&
            formData.preferredGenders[0].sexualOrientation.length > 0
            ? formData.preferredGenders[0].sexualOrientation[0]
            : "",
        // Include match strictness fields
        exactMatchAllFilters: formData.exactMatchAllFilters,
        minimumMatchPercentage: formData.minimumMatchPercentage,
        nonNegotiableFields: formData.nonNegotiableFields,
      };
      
      // Save dating preferences to database
      const response = await fetch("/api/dating/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
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
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Tell us about yourself and your music taste..."
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                />
              </div>
              <AgeSelector
                value={formData.age}
                onChange={(age) => setFormData({...formData, age})}
                label="Age"
                required={true}
                error={formData.age < 18}
                min={18}
                max={130}
                  />
                  {formData.age < 18 && (
                    <p className="text-red-500 text-xs mt-1">
                      {formData.age === 0 ? "Age is required" : "Age must be at least 18"}
                    </p>
                  )}
              <HeightSelector
                value={formData.height}
                onChange={(heightInInches) => setFormData({...formData, height: heightInInches})}
                label="Height"
                required={true}
                error={formData.height < 36}
              />
              {formData.height < 36 && (
                  <p className="text-red-500 text-xs mt-1">
                  Height must be at least 3 feet
                  </p>
                )}
              <div>
                <DropdownSelector
                  value={formData.gender}
                  onChange={(value) => setFormData({...formData, gender: value})}
                  options={[
                    { label: "Select gender", value: "" },
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                  ]}
                  label="Gender"
                  placeholder="Select gender"
                  required={true}
                  error={formData.gender === ""}
                />
                {formData.gender === "" && (
                  <p className="text-red-500 text-xs mt-1">Gender is required</p>
                )}
              </div>
              <div>
                <DropdownSelector
                  value={formData.sexualOrientation}
                  onChange={(value) => setFormData({...formData, sexualOrientation: value})}
                  options={[
                    { label: "Select sexual orientation", value: "" },
                    { label: "Straight", value: "straight" },
                    { label: "Gay", value: "gay" },
                    { label: "Bisexual", value: "bisexual" },
                    { label: "Other", value: "other" },
                  ]}
                  label="Sexual Orientation"
                  placeholder="Select sexual orientation"
                  required={true}
                  error={formData.sexualOrientation === ""}
                />
                {formData.sexualOrientation === "" && (
                  <p className="text-red-500 text-xs mt-1">Sexual orientation is required</p>
                )}
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Location (Zip Code) {formData.zipCode.trim() === "" && (
                  <span className="text-red-500 text-md mt-1">*</span>
                )}
                </label>
                <input
                  type="text"
                  required
                  className={`w-full p-3 border rounded-lg ${formData.zipCode.trim() === "" ? 'border-red-500' : ''}`}
                  placeholder="e.g., 90210"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                  maxLength={10}
                />
                {formData.zipCode.trim() === "" && (
                  <p className="text-red-500 text-xs mt-1">Location is required</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Enter your zip code for distance matching</p>
              </div>
              <div className="md:col-span-1">
                <DropdownSelector
                  value={formData.coronavirusVaccinated}
                  onChange={(value) => setFormData({...formData, coronavirusVaccinated: value})}
                  options={[
                    { label: "Select vaccination status (optional)", value: "" },
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ]}
                  label="Coronavirus Vaccinated"
                  placeholder="Select vaccination status (optional)"
                />
              </div>
              <div className="md:col-span-1">
                <DropdownSelector
                  value={formData.religion}
                  onChange={(value) => setFormData({...formData, religion: value})}
                  options={[
                    { label: "Select religion (optional)", value: "" },
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
                  placeholder="Select religion (optional)"
                />
              </div>

              {/* Additional Optional Fields */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Additional Information (Optional)</h3>
              </div>

              <div>
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
              </div>

              <div>
                <DropdownSelector
                  value={formData.smokes}
                  onChange={(value) => setFormData({...formData, smokes: value})}
                  options={[
                    { label: "Select option (optional)", value: "" },
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                    { label: "Social", value: "Social" },
                  ]}
                  label="Smokes"
                  placeholder="Select option (optional)"
                />
              </div>

              <div>
                <DropdownSelector
                  value={formData.drinks}
                  onChange={(value) => setFormData({...formData, drinks: value})}
                  options={[
                    { label: "Select option (optional)", value: "" },
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                    { label: "Social", value: "Social" },
                  ]}
                  label="Drinks"
                  placeholder="Select option (optional)"
                />
              </div>

              <div>
                <DropdownSelector
                  value={formData.activity}
                  onChange={(value) => setFormData({...formData, activity: value})}
                  options={[
                    { label: "Select activity level (optional)", value: "" },
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
                  placeholder="Select activity level (optional)"
                />
              </div>

              <div>
                <DropdownSelector
                  value={formData.education}
                  onChange={(value) => setFormData({...formData, education: value})}
                  options={[
                    { label: "Select education level (optional)", value: "" },
                    { label: "High School", value: "high_school" },
                    { label: "Some College", value: "some_college" },
                    { label: "Bachelor's", value: "bachelors" },
                    { label: "Master's", value: "masters" },
                    { label: "PhD", value: "phd" },
                    { label: "Professional", value: "professional" },
                  ]}
                  label="Education Level"
                  placeholder="Select education level (optional)"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Job
                </label>
                <input
                  type="text"
                  className="w-full h-11 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Software Engineer, Teacher (optional)"
                  maxLength={100}
                  value={formData.job}
                  onChange={(e) => setFormData({...formData, job: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-900 font-bold mb-2">
                  Pets
                </label>
                <input
                  type="text"
                  className="w-full h-11 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 2 dogs, 1 cat (optional)"
                  maxLength={150}
                  value={formData.pets}
                  onChange={(e) => setFormData({...formData, pets: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-900 font-bold mb-3">
                  Interests (Select all that apply - optional)
                </label>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-4">
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
            </div>
          </div>
        );

      case 2:
        const toggleGenderPreference = (gender: string) => {
          const existingIndex = formData.preferredGenders.findIndex(p => p.gender === gender);
          let newGenders: GenderPreference[];
          
          if (existingIndex >= 0) {
            // Remove if already selected
            newGenders = formData.preferredGenders.filter((_, i) => i !== existingIndex);
          } else {
            // Add new preference with empty array
            newGenders = [...formData.preferredGenders, { gender, sexualOrientation: [] }];
          }
          
          setFormData({ ...formData, preferredGenders: newGenders });
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

        return (
          <div className="space-y-6">
            <h2 className="text-2xl text-gray-900 font-bold text-center mb-6">What are you looking for?</h2>
            <div className="max-w-2xl mx-auto">
              <label className="block text-sm text-gray-900 font-bold mb-4">
                Select who you&apos;re interested in {formData.preferredGenders.length === 0 && (
                  <span className="text-red-500 text-md mt-1">*</span>
                )}
              </label>
              <p className="text-sm text-gray-600 mb-4">
                You can select both male and female partners, each with their own orientation preference.
              </p>
              
              <div className="space-y-4">
                {["male", "female"].map((gender) => {
                  const isSelected = formData.preferredGenders.some(p => p.gender === gender);
                  const preference = formData.preferredGenders.find(p => p.gender === gender);
                  
                  return (
                    <div key={gender} className={`border rounded-lg p-4 transition-colors ${
                      isSelected ? "border-purple-500 bg-purple-50" : "border-gray-300"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-3 w-5 h-5 border-2 border-gray-300 bg-white text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            checked={isSelected}
                            onChange={() => toggleGenderPreference(gender)}
                          />
                          <span className="text-gray-900 font-semibold">
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
                          </span>
                        </label>
                      </div>
                      
                      {isSelected && (
                        <div className="ml-8 mt-2">
                          <label className="block text-sm text-gray-900 font-medium mb-2">
                            Their orientation preference {(preference?.sexualOrientation?.length || 0) === 0 && (
                              <span className="text-red-500">*</span>
                            )}
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
                          {(preference?.sexualOrientation?.length || 0) === 0 && (
                            <p className="text-red-500 text-xs mt-1">Please select at least one orientation preference</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {formData.preferredGenders.length === 0 && (
                <p className="text-red-500 text-xs mt-2">Please select at least one gender preference</p>
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
                    max="130"
                    required
                    className={`w-full h-11 px-3 text-sm border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${formData.preferredMinAge < 18 ? 'border-red-500' : 'border-gray-300'}`}
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
                    max="130"
                    required
                    className={`w-full h-11 px-3 text-sm border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${formData.preferredMaxAge < 18 ? 'border-red-500' : 'border-gray-300'}`}
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
                          className={`w-full h-11 px-3 text-sm border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${formData.preferredMinHeight < 12 ? 'border-red-500' : 'border-gray-300'}`}
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
                          className={`w-full h-11 px-3 text-sm border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${formData.preferredMinHeight < 12 ? 'border-red-500' : 'border-gray-300'}`}
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
                          className={`w-full h-11 px-3 text-sm border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${formData.preferredMaxHeight < 12 ? 'border-red-500' : 'border-gray-300'}`}
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
                          className={`w-full h-11 px-3 text-sm border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${formData.preferredMaxHeight < 12 ? 'border-red-500' : 'border-gray-300'}`}
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
                    className={`w-full h-11 px-3 text-sm border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${formData.preferredMaxDistance <= 0 ? 'border-red-500' : 'border-gray-300'}`}
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
                  <DropdownSelector
                    value={formData.preferredCoronavirusVaccinated}
                    onChange={(value) => setFormData({...formData, preferredCoronavirusVaccinated: value})}
                    options={[
                      { label: "No preference", value: "" },
                      { label: "Vaccinated", value: "Yes" },
                      { label: "Not vaccinated", value: "No" },
                    ]}
                    label="Preferred Vaccination Status"
                    placeholder="No preference"
                  />
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

              {/* Match Strictness Controls */}
              <div className="pt-6 border-t border-gray-300 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Match Strictness</h3>
                
                {/* Exact Match All Filters */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.exactMatchAllFilters}
                      onChange={(e) =>
                        setFormData({ ...formData, exactMatchAllFilters: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-gray-300 bg-white text-purple-500 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">Exact Match All Filters</span>
                      <p className="text-xs text-gray-600 mt-1">
                        Require all preferences to match exactly. This is the strictest matching mode.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Percentage Match Slider */}
                {!formData.exactMatchAllFilters && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-900">
                        Minimum Match Percentage
                      </label>
                      <span className="text-lg font-bold text-purple-600">
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      style={{
                        background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${formData.minimumMatchPercentage}%, rgb(229, 231, 235) ${formData.minimumMatchPercentage}%, rgb(229, 231, 235) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0% (Any match)</span>
                      <span>50%</span>
                      <span>100% (Perfect match)</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Show only users with at least {formData.minimumMatchPercentage}% compatibility based on your preferences
                    </p>
                  </div>
                )}

                {/* Non-Negotiable Fields Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-xs text-gray-700">
                    <strong>Tip:</strong> You can mark specific preferences as &quot;Non-Negotiable&quot; (dealbreakers) in your filter settings after completing onboarding. 
                    These will always be required to match exactly, regardless of your match percentage setting.
                  </p>
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
                      <p className="font-medium text-gray-900">{formData.zipCode || "Not provided"}</p>
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
                      <p className="text-sm text-gray-900 font-bold">Looking for</p>
                      {formData.preferredGenders.length > 0 ? (
                        <div className="space-y-2">
                          {formData.preferredGenders.map((pref, idx) => (
                            <p key={idx} className="font-medium text-gray-900">
                              {pref.gender.charAt(0).toUpperCase() + pref.gender.slice(1)} - {
                                Array.isArray(pref.sexualOrientation) 
                                  ? pref.sexualOrientation.map(o => o.charAt(0).toUpperCase() + o.slice(1)).join(", ")
                                  : pref.sexualOrientation
                              }
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="font-medium text-gray-900">Not specified</p>
                      )}
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
                      ⚠️ Verify Your Photo to Like Users
                    </p>
                    <p className="text-sm text-yellow-700">
                      Upload a photo to verify your identity. Once verified, you&apos;ll be able to like users and appear in others&apos; decks!
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
                    className="w-full border-gray-300 text-gray-900 hover:bg-gray-100 font-bold py-6 text-lg bg-white"
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