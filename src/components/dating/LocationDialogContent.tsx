"use client";

import { useState, useEffect } from "react";
import kyInstance from "@/lib/ky";
import { Loader2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface LocationDialogContentProps {
  onClose: () => void;
  onUpdate: () => void;
}

export default function LocationDialogContent({
  onClose,
  onUpdate,
}: LocationDialogContentProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentZipCode, setCurrentZipCode] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [zipCode, setZipCode] = useState("");

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      setLoading(true);
      const response = await kyInstance
        .get("/api/dating/profile")
        .json<{ profile: { zipCode: string | null; city: string | null } }>();

      if (response.profile?.zipCode) {
        setCurrentZipCode(response.profile.zipCode);
        setZipCode(response.profile.zipCode);
        setCurrentCity(response.profile.city || "");
      }
    } catch (error) {
      console.error("Error fetching current location:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!zipCode.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter a zip code",
      });
      return;
    }

    // Basic zip code validation (5 digits or 5+4 format)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zipCode.trim())) {
      toast({
        variant: "destructive",
        description: "Please enter a valid US zip code (e.g., 90001 or 90001-1234)",
      });
      return;
    }

    try {
      setSaving(true);
      
      await kyInstance.put("/api/dating/profile", {
        json: {
          zipCode: zipCode.trim(),
        },
      });

      toast({
        description: "Location updated successfully!",
      });

      // Refetch profile to get the newly geocoded city
      await fetchCurrentLocation();
      onUpdate();
    } catch (error: any) {
      console.error("Error updating location:", error);
      const errorData = await error.response?.json().catch(() => ({}));
      toast({
        variant: "destructive",
        description: errorData.error || "Failed to update location",
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Update Location</h3>
          <p className="text-sm text-gray-300 mt-1">
            Enter your zip code to update your location
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-300 hover:text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {currentZipCode && (
        <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-purple-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white">
                Current Location: {currentZipCode}{currentCity ? `, ${currentCity}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            New Zip Code
          </label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="e.g., 90001 or 90001-1234"
            className="w-full p-3 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleUpdateLocation();
              }
            }}
            maxLength={10}
          />
          
        </div>
      </div>

      <Button
        onClick={handleUpdateLocation}
        disabled={saving || !zipCode.trim() || zipCode.trim() === currentZipCode}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Update Location
          </>
        )}
      </Button>
    </div>
  );
}

