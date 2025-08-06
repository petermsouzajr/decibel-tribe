"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff, PlusIcon } from "lucide-react";
import { UserData } from "@/lib/types";

interface DatingToggleButtonProps {
  user: UserData;
}

export default function DatingToggleButton({ user }: DatingToggleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDatingActive, setIsDatingActive] = useState(
    user.isDatingActive ?? false
  );

  const handleToggleDating = async () => {
    if (!isDatingActive) {
      // If activating dating for the first time, redirect to dating intro page
      window.location.href = "/dating";
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement the actual API call to toggle dating feature
      // This will be implemented when we create the dating API routes
      const response = await fetch("/api/dating/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !isDatingActive,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsDatingActive(data.isDatingActive);
      } else {
        console.error("Failed to toggle dating feature");
      }
    } catch (error) {
      console.error("Error toggling dating feature:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggleDating}
      disabled={isLoading}
      variant="outline"
      className="w-full py-6 text-lg"
    >
      {isDatingActive ? (
        <>
          <HeartOff className="mr-2 size-4" />
          Deactivate Dating
        </>
      ) : (
        <>
          <Heart className="mr-2 size-5" />
          <PlusIcon className="mr-2 size-4" />
          Activate Dating
        </>
      )}
    </Button>
  );
} 