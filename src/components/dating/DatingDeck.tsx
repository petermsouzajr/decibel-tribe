"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { Check, X, Heart, Loader2, MessageCircle, Filter, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import PotentialMatchCard from "./PotentialMatchCard";
import MatchCelebration from "./MatchCelebration";
import FilterPanel from "./FilterPanel";
import SafetyTips from "./SafetyTips";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import TravelModeDialogContent from "./TravelModeDialogContent";

interface MatchProfile {
  id: string;
  username: string;
  displayName: string;
  age: number | null;
  bio: string;
  photos: Array<{ url: string; isPrimary: boolean }>;
  primaryPhotoUrl: string | null;
  distance: number | null;
  location: string | null;
  musicInfo: {
    instruments: string[];
    skills: string[];
  };
}

interface DatingDeckProps {
  isVerified: boolean;
}

export default function DatingDeck({ isVerified }: DatingDeckProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [matchedUser, setMatchedUser] = useState<MatchProfile | null>(null);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [likeMessage, setLikeMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showTravelMode, setShowTravelMode] = useState(false);
  const [filters, setFilters] = useState<{
    preferredInstruments: string[];
    preferredSkills: string[];
  }>({
    preferredInstruments: [],
    preferredSkills: [],
  });

  const fetchMatches = async (cursor?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "10");
      if (filters.preferredInstruments.length > 0) {
        filters.preferredInstruments.forEach((inst) =>
          params.append("instruments", inst)
        );
      }
      if (filters.preferredSkills.length > 0) {
        filters.preferredSkills.forEach((skill) =>
          params.append("skills", skill)
        );
      }

      const url = `/api/dating/potential-matches?${params.toString()}`;
      const response = await kyInstance.get(url).json<{
        matches: MatchProfile[];
        nextCursor: string | null;
      }>();

      if (cursor) {
        setMatches((prev) => [...prev, ...response.matches]);
      } else {
        setMatches(response.matches);
        setCurrentIndex(0);
      }
      setNextCursor(response.nextCursor);
    } catch (error: any) {
      console.error("Error fetching matches:", error);
      if (error.response?.status === 403) {
        toast({
          variant: "destructive",
          description: error.response?.json?.error || "Access denied",
        });
        router.push("/dating");
      } else {
        toast({
          variant: "destructive",
          description: "Failed to load potential matches",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load filters from preferences
    kyInstance
      .get("/api/dating/preferences")
      .json<{
        preferredInstruments?: string[];
        preferredSkills?: string[];
      }>()
      .then((prefs) => {
        if (prefs.preferredInstruments || prefs.preferredSkills) {
          setFilters({
            preferredInstruments: prefs.preferredInstruments || [],
            preferredSkills: prefs.preferredSkills || [],
          });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [filters]);

  const handleLikeClick = () => {
    if (!isVerified) {
      toast({
        variant: "destructive",
        description: "Please verify your email address to like users.",
      });
      return;
    }
    // Show message input option
    setShowMessageInput(true);
  };

  const handleLikeConfirm = async () => {
    const currentMatch = matches[currentIndex];
    if (!currentMatch || processing) return;

    await handleDecision("LIKE", likeMessage.trim() || undefined);
    setShowMessageInput(false);
    setLikeMessage("");
  };

  const handleDecision = async (decision: "LIKE" | "DISLIKE", message?: string) => {
    const currentMatch = matches[currentIndex];
    if (!currentMatch || processing) return;

    try {
      setProcessing(true);
      const response = await kyInstance
        .post("/api/dating/decision", {
          json: {
            targetUserId: currentMatch.id,
            decision,
            message,
          },
        })
        .json<{ success: boolean; isMatch: boolean; matchId?: string }>();

      if (response.isMatch) {
        setMatchedUser(currentMatch);
        setShowMatchCelebration(true);
        toast({
          description: `It's a match with ${currentMatch.displayName}! 🎉`,
        });
      } else if (decision === "LIKE") {
        toast({
          description: `Liked ${currentMatch.displayName}${message ? " with a message" : ""}`,
        });
      }

      // Move to next match
      if (currentIndex < matches.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (nextCursor) {
        // Load more matches
        await fetchMatches(nextCursor);
      } else {
        // No more matches
        toast({
          description: "No more potential matches. Check back later!",
        });
      }
    } catch (error: any) {
      console.error("Error recording decision:", error);
      if (error.response?.status === 403) {
        const errorData = await error.response.json().catch(() => ({}));
        toast({
          variant: "destructive",
          description: errorData.error || "Verification required to like users",
        });
      } else if (error.response?.status === 429) {
        toast({
          variant: "destructive",
          description: "Rate limit exceeded. Maximum 100 likes per hour.",
        });
      } else {
        toast({
          variant: "destructive",
          description: "Failed to record decision",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loading) {
      fetchMatches(nextCursor);
    }
  };

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading potential matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-64 h-96 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <div className="text-center">
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No matches found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your preferences or check back later
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/dating/profile")}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              Update Preferences
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto w-full">
          {/* Verification Banner */}
          {!isVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                    Verify Your Photo to Like Users
                  </h3>
                  <p className="text-sm text-yellow-700">
                    You can browse and dislike profiles, but you need to verify your identity by uploading a photo to like users and appear in others&apos; decks.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Find Your Match
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Discover music lovers in your area
              </p>
            </div>
            <div className="flex gap-2 flex-wrap w-full sm:w-auto">
              <SafetyTips />
              <Button
                variant="outline"
                onClick={() => setShowTravelMode(true)}
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Travel Mode
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(true)}
                className={`flex items-center gap-2 ${
                  filters.preferredInstruments.length > 0 ||
                  filters.preferredSkills.length > 0
                    ? "border-purple-500 bg-purple-50"
                    : ""
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(filters.preferredInstruments.length > 0 ||
                  filters.preferredSkills.length > 0) && (
                  <span className="ml-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {filters.preferredInstruments.length +
                      filters.preferredSkills.length}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dating/likes-you")}
                className="flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Likes You
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dating/matches")}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Matches
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dating/history")}
                className="flex items-center gap-2"
              >
                History
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dating/profile")}
                className="flex items-center gap-2"
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {currentMatch && (
            <PotentialMatchCard
              match={currentMatch}
              onLike={() => handleDecision("LIKE")}
              onDislike={() => handleDecision("DISLIKE")}
              processing={processing}
            />
          )}

          {/* Message Input Modal */}
          {showMessageInput && currentMatch && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Like {currentMatch.displayName}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add a message (optional) to stand out!
                </p>
                <textarea
                  value={likeMessage}
                  onChange={(e) => setLikeMessage(e.target.value)}
                  placeholder="Say something nice..."
                  className="w-full p-3 border rounded-lg resize-none mb-4"
                  rows={3}
                  maxLength={200}
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMessageInput(false);
                      setLikeMessage("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleLikeConfirm}
                    disabled={processing}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    {processing ? "Sending..." : "Send Like"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Decision Buttons */}
          {currentMatch && !showMessageInput && (
            <div className="flex justify-center gap-4 sm:gap-6 mt-6 pb-4">
              <Button
                size="lg"
                variant="outline"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-red-500 hover:bg-red-50 transition-all active:scale-95"
                onClick={() => handleDecision("DISLIKE")}
                disabled={processing}
                aria-label="Dislike"
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              </Button>
              <Button
                size="lg"
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all active:scale-95 ${
                  isVerified
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                onClick={handleLikeClick}
                disabled={processing || !isVerified}
                title={!isVerified ? "Verify your email to like users" : ""}
                aria-label="Like"
              >
                <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </Button>
            </div>
          )}

          {/* Load More Button */}
          {nextCursor && currentIndex >= matches.length - 3 && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More Matches"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {showMatchCelebration && matchedUser && (
        <MatchCelebration
          user={matchedUser}
          onClose={() => {
            setShowMatchCelebration(false);
            setMatchedUser(null);
          }}
          onViewMatch={() => {
            router.push("/dating/matches");
            setShowMatchCelebration(false);
          }}
        />
      )}

      <FilterPanel
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          // Save filters to preferences
          kyInstance
            .post("/api/dating/preferences", {
              json: {
                preferredInstruments: newFilters.preferredInstruments,
                preferredSkills: newFilters.preferredSkills,
              },
            })
            .catch(console.error);
        }}
      />
      <Dialog open={showTravelMode} onOpenChange={setShowTravelMode}>
        <DialogContent className="max-w-md">
          <TravelModeDialogContent
            onClose={() => setShowTravelMode(false)}
            onUpdate={() => {
              // Refetch matches when travel mode changes
              fetchMatches();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

