"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";

interface DatingIntroButtonsProps {
  username: string;
}

const DatingIntroButtons = ({ username }: DatingIntroButtonsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    console.log("Continue button clicked");
    setIsLoading(true);
    try {
      // Just navigate to onboarding - don't enable dating yet
      console.log("Navigating to onboarding...");
      window.location.href = "/dating/onboarding";
    } catch (error) {
      console.error("Error navigating to onboarding:", error);
      window.location.href = "/dating/onboarding"; // Fallback
    } finally {
      setIsLoading(false);
      console.log("Loading finished");
    }
  };

  const handleCancel = () => {
    // Navigate back to user profile
    router.push(`/users/${username}`);
  };

  return (
    <div className="space-y-6">
      <Button
        onClick={handleContinue}
        disabled={isLoading}
        className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Loading...
          </div>
        ) : (
          <div className="flex items-center text-lg">
            <Heart className="mr-2 size-5" />
            Continue to Dating Setup
          </div>
        )}
      </Button>
      
      <Button
        onClick={handleCancel}
        variant="outline"
        className="w-full h-12 py-3"
      >
        <div className="flex items-center text-lg">
          <X className="mr-2 size-4" />
          Back to Profile
        </div>
      </Button>
    </div>
  );
};

export default DatingIntroButtons; 
