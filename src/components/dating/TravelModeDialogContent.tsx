"use client";

import { useState, useEffect } from "react";
import kyInstance from "@/lib/ky";
import { Loader2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

interface TravelModeDialogContentProps {
  onClose: () => void;
  onUpdate: () => void;
}

interface LocationOverride {
  active: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  expiresAt?: string;
}

export default function TravelModeDialogContent({
  onClose,
  onUpdate,
}: TravelModeDialogContentProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentOverride, setCurrentOverride] = useState<LocationOverride | null>(null);
  const [city, setCity] = useState("");
  const [durationDays, setDurationDays] = useState(7);

  useEffect(() => {
    fetchCurrentOverride();
  }, []);

  const fetchCurrentOverride = async () => {
    try {
      setLoading(true);
      const response = await kyInstance
        .get("/api/dating/location-override")
        .json<LocationOverride>();

      setCurrentOverride(response);
      if (response.active && response.city) {
        setCity(response.city);
      }
    } catch (error) {
      console.error("Error fetching location override:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetLocation = async () => {
    if (!city.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter a city name",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Use a geocoding service to get lat/lon
      // For now, we'll use a placeholder - in production, use Google Maps API, Mapbox, etc.
      // For MVP, we'll store the city name and let the backend handle geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
      );
      const data = await response.json();
      
      if (!data || data.length === 0) {
        toast({
          variant: "destructive",
          description: "City not found. Please try a different city name.",
        });
        return;
      }

      const { lat, lon, display_name } = data[0];
      const cityName = display_name.split(",")[0]; // Extract city name

      await kyInstance.post("/api/dating/location-override", {
        json: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          city: cityName,
          durationDays,
        },
      });

      toast({
        description: `Travel mode activated for ${cityName}!`,
      });

      await fetchCurrentOverride();
      onUpdate();
    } catch (error: any) {
      console.error("Error setting location:", error);
      toast({
        variant: "destructive",
        description: error.response?.json?.error || "Failed to set location",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    try {
      setSaving(true);
      await kyInstance.delete("/api/dating/location-override");
      
      toast({
        description: "Travel mode disabled",
      });

      setCurrentOverride({ active: false });
      onUpdate();
    } catch (error) {
      console.error("Error disabling location override:", error);
      toast({
        variant: "destructive",
        description: "Failed to disable travel mode",
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
          <h3 className="text-lg font-semibold text-gray-900">Travel Mode</h3>
          <p className="text-sm text-gray-600 mt-1">
            Browse matches in different cities
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {currentOverride?.active && currentOverride.expiresAt ? (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                Currently browsing: {currentOverride.city}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Expires {formatDistanceToNow(new Date(currentOverride.expiresAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisable}
            disabled={saving}
            className="mt-3 w-full"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Disabling...
              </>
            ) : (
              "Disable Travel Mode"
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                City Name
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., New York, Los Angeles, London"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSetLocation();
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Duration
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleSetLocation}
            disabled={saving || !city.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activating...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Activate Travel Mode
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}

