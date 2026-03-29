"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { Check, X, Heart, Loader2, MessageCircle, RotateCcw, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import PotentialMatchCard from "./PotentialMatchCard";
import MatchCelebration from "./MatchCelebration";
import DatingFiltersPanel from "./DatingFiltersPanel";
import DatingHeader from "./DatingHeader";

interface MatchProfile {
  id: string;
  username: string;
  displayName: string;
  age: number | null;
  height: number | null;
  gender: string | null;
  sexualOrientation: string | null;
  coronavirusVaccinated: string | null;
  religion: string | null;
  bio: string;
  hasKids: boolean | null;
  smokes: string | null;
  drinks: string | null;
  activity: string | null;
  education: string | null;
  job: string | null;
  pets: string[];
  interests: string[];
  photos: Array<{ url: string; isPrimary: boolean }>;
  primaryPhotoUrl: string | null;
  distance: number | null;
  location: string | null;
  isIDVerified: boolean;
  musicInfo: {
    instruments: string[];
    skills: string[];
  };
}

interface DatingDeckProps {}

export default function DatingDeck({}: DatingDeckProps) {
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
  const [showBasicFilters, setShowBasicFilters] = useState(false);
  const [filters, setFilters] = useState<{
    preferredInstruments: string[];
    preferredSkills: string[];
  }>({
    preferredInstruments: [],
    preferredSkills: [],
  });
  const [recentSwipes, setRecentSwipes] = useState<Array<{ id: string; toUserId: string; direction: string; createdAt: Date; canUnlike: boolean }>>([]);
  const [undoing, setUndoing] = useState(false);
  const [prefetching, setPrefetching] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchMatches = async (cursor?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");
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
      const response = await kyInstance.get(url, {
        timeout: 90000, // 90 seconds timeout for this slow endpoint
      }).json<{
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
        // Try to get error message from response
        let errorMessage = "Failed to load potential matches";
        try {
          if (error.response) {
            const errorData = await error.response.json().catch(() => ({}));
            errorMessage = errorData.error || errorMessage;
          }
        } catch {
          // Ignore JSON parse errors
        }
        toast({
          variant: "destructive",
          description: errorMessage,
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

  // Prefetch next batch when 5 cards remain (Tinder/Bumble pattern)
  useEffect(() => {
    const cardsRemaining = matches.length - currentIndex;
    if (cardsRemaining <= 5 && nextCursor && !prefetching && !loading) {
      setPrefetching(true);
      // Prefetch silently in background without affecting current state
      fetchMatches(nextCursor)
        .then(() => setPrefetching(false))
        .catch(() => setPrefetching(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, matches.length, nextCursor, prefetching, loading]);

  // Fetch preferences and profile when showing empty state
  useEffect(() => {
    const isEmptyState = (matches.length === 0 && !loading) || currentIndex >= matches.length;
    if (isEmptyState && !userPreferences) {
      Promise.all([
        kyInstance.get("/api/dating/preferences").json().catch(() => null),
        kyInstance.get("/api/dating/profile").json().catch(() => null),
      ]).then(([prefs, profileData]: [any, any]) => {
        if (prefs) setUserPreferences(prefs);
        if (profileData) setUserProfile(profileData.profile || profileData);
      });
    }
  }, [matches.length, currentIndex, loading, userPreferences]);

  useEffect(() => {
    // Fetch recent swipes for undo functionality
    // This runs on mount and when swiping, ensuring undo persists across sessions
    const fetchRecentSwipes = async () => {
      try {
        const response = await kyInstance
          .get("/api/dating/history?type=all&light=true")
          .json<{ swipes: Array<{ id: string; toUserId: string; direction: string; createdAt: string; canUnlike: boolean }> }>();
        
        // Filter to only include swipes that can be undone (LIKE swipes, not matched)
        // Take only the last 10 undoable swipes (most recent)
        const undoableSwipes = response.swipes
          .filter(s => s.canUnlike === true)
          .slice(0, 10)
          .map(s => ({
            id: s.id,
            toUserId: s.toUserId,
            direction: s.direction,
            createdAt: new Date(s.createdAt),
            canUnlike: s.canUnlike,
          }));
        
        setRecentSwipes(undoableSwipes);
      } catch (error) {
        console.error("Error fetching recent swipes:", error);
      }
    };
    
    fetchRecentSwipes();
  }, [currentIndex]); // Refresh when we swipe

  const handleLikeClick = () => {
    // All users who reach the deck are email-verified (page-level gate ensures this).
    // Proceed directly to like.
    handleDecision("LIKE");
  };

  // Preserved for future use when implementing photo-specific likes/comments
  // This function will be used when users can like and comment on specific photos
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

    // OPTIMISTIC UI: Move to next card immediately for instant feel
    const nextIndex = currentIndex + 1;
    const hasMoreInBatch = nextIndex < matches.length;
    const shouldPrefetchNextBatch = !hasMoreInBatch && nextCursor;

    // Immediately advance to next card if available
    if (hasMoreInBatch) {
      setCurrentIndex(nextIndex);
    } else if (shouldPrefetchNextBatch) {
      // Start prefetching next batch in background
      fetchMatches(nextCursor).catch(console.error);
      // Show loading state only if no more matches locally
      setCurrentIndex(nextIndex); // Will show empty state until prefetch completes
    } else {
      // No more matches at all - advance index to show empty state
      // No toast needed - the empty state UI provides clear feedback
      setCurrentIndex(nextIndex); // This will trigger empty state UI
    }

    // Brief processing state for animation (200ms)
    setProcessing(true);
    setTimeout(() => setProcessing(false), 200);

    // Fire decision API async (non-blocking)
    const decisionPromise = kyInstance
      .post("/api/dating/decision", {
        json: {
          targetUserId: currentMatch.id,
          decision,
          message,
        },
      })
      .json<{ success: boolean; isMatch: boolean; matchId?: string }>()
      .then((response) => {
        // Handle match celebration (no toast - full-screen modal provides better UX)
        if (response.isMatch) {
          setMatchedUser(currentMatch);
          setShowMatchCelebration(true);
        }
        // No toast for ordinary likes/dislikes - visual feedback (card animation) is sufficient
      })
      .catch((error: any) => {
        console.error("Error recording decision:", error);
        // Rollback optimistic update on error
        if (hasMoreInBatch || shouldPrefetchNextBatch) {
          setCurrentIndex(currentIndex);
        }
        
        if (error.response?.status === 403) {
          error.response.json().then((errorData: any) => {
            toast({
              variant: "destructive",
              description: errorData.error || "Action not allowed.",
            });
          }).catch(() => {});
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
      });

    // CONDITIONAL/ASYNC History Fetch: Only for likes, and only if undo might be needed
    // Skip for dislikes entirely (undo not supported)
    if (decision === "LIKE" && currentIndex < 5) {
      // Fire-and-forget: Update undo list in background without blocking UI
      kyInstance
        .get("/api/dating/history?type=all&light=true")
        .json<{ swipes: Array<{ id: string; toUserId: string; direction: string; createdAt: string; canUnlike: boolean }> }>()
        .then((swipeResponse) => {
          // Filter to only include swipes that can be undone (LIKE swipes, not matched)
          const undoableSwipes = swipeResponse.swipes
            .filter(s => s.canUnlike === true)
            .slice(0, 10)
            .map(s => ({
              id: s.id,
              toUserId: s.toUserId,
              direction: s.direction,
              createdAt: new Date(s.createdAt),
              canUnlike: s.canUnlike,
            }));
          setRecentSwipes(undoableSwipes);
        })
        .catch(() => {
          // Silently fail - undo list can be stale
        });
    }

    // Wait for decision to complete (but UI already moved to next card)
    // This ensures errors are handled even though UI updated optimistically
    try {
      await decisionPromise;
    } catch {
      // Error already handled in decisionPromise catch block
    }
  };

  const handleUndo = async () => {
    // Only allow undo if there are undoable swipes
    if (undoing || recentSwipes.length === 0) return;

    const lastSwipe = recentSwipes[0];
    // Double-check that this swipe can be undone (should always be true due to filtering, but safety check)
    if (!lastSwipe || !lastSwipe.canUnlike || lastSwipe.direction !== "LIKE") return;

    try {
      setUndoing(true);
      await kyInstance.delete(`/api/dating/history?swipeId=${lastSwipe.id}`);

      // Remove the undone swipe from the list
      setRecentSwipes((prev) => prev.slice(1));

      // If we're in the middle of the deck, go back one card
      // If we're at the start or deck is empty, refresh matches to include the undone user
      if (currentIndex > 0 && currentIndex < matches.length) {
        setCurrentIndex(currentIndex - 1);
      } else {
        // Refresh matches to include the undone user (handles empty deck case)
        await fetchMatches();
      }
      // No toast needed - visual feedback (card returning) is sufficient
    } catch (error: any) {
      console.error("Error undoing swipe:", error);
      const errorData = await error.response?.json().catch(() => ({}));
      toast({
        variant: "destructive",
        description: errorData.error || "Failed to undo swipe",
      });
    } finally {
      setUndoing(false);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loading) {
      fetchMatches(nextCursor);
    }
  };

  if (loading && matches.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Finding matches near{userProfile?.city ? `, ${userProfile.city}` : ', you'}...</p>
        </div>
      </div>
    );
  }

  const currentMatch = (matches.length > 0 && currentIndex < matches.length) ? matches[currentIndex] : null;

  // Helper function to format filters for display
  const formatFilters = () => {
    if (!userPreferences) return null;

    const prefs = userPreferences;
    const filters: string[] = [];

    // Age
    if (prefs.preferredMinAge && prefs.preferredMaxAge) {
      if (prefs.preferredMinAge === 18 && prefs.preferredMaxAge === 130) {
        filters.push("Age: Any");
      } else {
        filters.push(`Age: ${prefs.preferredMinAge}-${prefs.preferredMaxAge}`);
      }
    } else {
      filters.push("Age: Not specified");
    }

    // Gender
    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    let parsedGenders: any[] = [];
    if (prefs.preferredGender) {
      try {
        const parsed = JSON.parse(prefs.preferredGender);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedGenders = parsed;
          const genderNames = parsed.map((g: any) => capitalize(g.gender || g)).join(", ");
          filters.push(`Gender: ${genderNames}`);
        } else {
          filters.push(`Gender: ${capitalize(prefs.preferredGender)}`);
        }
      } catch {
        filters.push(`Gender: ${capitalize(prefs.preferredGender)}`);
      }
    } else {
      filters.push("Gender: Not specified");
    }

    // Sexual Orientation – prefer the legacy standalone field; fall back to
    // extracting orientations from the new JSON gender array format.
    if (prefs.preferredSexualOrientation) {
      filters.push(`Sexual Orientation: ${capitalize(prefs.preferredSexualOrientation)}`);
    } else if (parsedGenders.length > 0) {
      const orientations = parsedGenders
        .flatMap((g: any) => Array.isArray(g.sexualOrientation) ? g.sexualOrientation : [])
        .filter(Boolean);
      if (orientations.length > 0) {
        filters.push(`Sexual Orientation: ${orientations.map(capitalize).join(", ")}`);
      } else {
        filters.push("Sexual Orientation: Not specified");
      }
    } else {
      filters.push("Sexual Orientation: Not specified");
    }

    // Distance
    if (prefs.preferredMaxDistanceKm !== undefined && prefs.preferredMaxDistanceKm !== null) {
      const miles = Math.round(prefs.preferredMaxDistanceKm * 0.621371);
      if (miles >= 6200) { // 10,000 km = ~6200 miles
        filters.push("Distance: Any");
      } else {
        const zipCode = userProfile?.zipCode || "your location";
        const city = userProfile?.city || "";
        const location = city ? `${city}` : zipCode;
        filters.push(`Distance: ${miles} miles from your location at ${location}`);
      }
    } else {
      filters.push("Distance: Not specified");
    }

    // Height
    if (prefs.preferredMinHeight && prefs.preferredMaxHeight) {
      const minFeet = Math.floor(prefs.preferredMinHeight / 12);
      const minInches = prefs.preferredMinHeight % 12;
      const maxFeet = Math.floor(prefs.preferredMaxHeight / 12);
      const maxInches = prefs.preferredMaxHeight % 12;
      
      if (prefs.preferredMinHeight === 36 && prefs.preferredMaxHeight === 94) {
        filters.push("Height: Any");
      } else {
        filters.push(`Height: ${minFeet}'${minInches}" - ${maxFeet}'${maxInches}"`);
      }
    } else {
      filters.push("Height: Not specified");
    }

    // Vaccination status
    if (prefs.preferredCoronavirusVaccinated) {
      filters.push(`Vaccination: ${prefs.preferredCoronavirusVaccinated}`);
    } else {
      filters.push("Vaccination: Not specified");
    }

    // Religions
    if (prefs.preferredReligions && Array.isArray(prefs.preferredReligions) && prefs.preferredReligions.length > 0) {
      filters.push(`Religion: ${prefs.preferredReligions.join(", ")}`);
    } else {
      filters.push("Religion: Not specified");
    }

    // Additional preferences
    if (prefs.preferredHasKids) {
      filters.push(`Has Kids: ${prefs.preferredHasKids}`);
    } else {
      filters.push("Has Kids: Not specified");
    }
    
    if (prefs.preferredSmokes) {
      filters.push(`Smokes: ${prefs.preferredSmokes}`);
    } else {
      filters.push("Smokes: Not specified");
    }
    
    if (prefs.preferredDrinks) {
      filters.push(`Drinks: ${prefs.preferredDrinks}`);
    } else {
      filters.push("Drinks: Not specified");
    }
    
    if (Array.isArray(prefs.preferredActivity) && prefs.preferredActivity.length > 0) {
      filters.push(`Activity Level: ${prefs.preferredActivity.join(", ")}`);
    } else if (prefs.preferredActivity && !Array.isArray(prefs.preferredActivity)) {
      filters.push(`Activity Level: ${prefs.preferredActivity}`);
    } else {
      filters.push("Activity Level: Not specified");
    }


    return filters;
  };

  return (
    <>
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-32">
        <div className="w-full px-2 sm:px-4 lg:max-w-2xl lg:mx-auto">
          {/* No email-verification banner needed: page-level gate in dating/page.tsx
              ensures only email-verified users ever reach this component. */}

          <DatingHeader
            title="Dating Tribe"
            showFiltersButton
            onOpenFilters={() => setShowBasicFilters(true)}
            onLocationUpdated={() => {
              fetchMatches();
            }}
          />
          {/* Safety tips are available from the header menu */}

          {currentMatch ? (
            <PotentialMatchCard
              match={currentMatch}
              onLike={() => handleDecision("LIKE")}
              onDislike={() => handleDecision("DISLIKE")}
              processing={processing}
            />
          ) : ((matches.length === 0 && !loading) || currentIndex >= matches.length) ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-64 h-96 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <div className="text-center">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold">No matches found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try adjusting your filters or location settings
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowBasicFilters(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Update Preferences
              </Button>
              
              {/* Current Filters Display */}
              {userPreferences && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-md font-semibold text-gray-700 mb-3 text-center">Your Current Filters:</h3>
                  <div className="space-y-2 gap-2 flex flex-col items-center">
                    {formatFilters()?.map((filter, index) => {
                      const [key, ...valueParts] = filter.split(':');
                      const value = valueParts.join(':').trim();
                      return (
                        <div key={index} className="text-sm text-gray-600 flex justify-start">
                          <span className="text-gray-400 mr-2">•</span>
                          <span className="font-bold text-gray-700">{key}:</span>
                          <span className="ml-1">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Message Input Modal - PRESERVED FOR FUTURE USE */}
          {/* TODO: When implementing photo-specific likes/comments (like Hinge/Bumble),
              restore this modal to allow users to comment on specific photos they like.
              The functionality is preserved in handleLikeConfirm above. */}
          {/* {showMessageInput && currentMatch && (
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
          )} */}

          {/* Floating Decision Buttons - Fixed at bottom */}
          {/* Show full button bar when there's a match, or just undo button when deck is empty */}
          {(currentMatch || recentSwipes.length > 0) && (
            <div className="fixed bottom-0 left-0 right-0 mb-16 border-gray-200 z-50 pb-safe">
              <div className="w-full px-2 sm:px-4 lg:max-w-2xl lg:mx-auto">
                <div className="flex justify-around items-center gap-4 sm:gap-6 py-4">
                  {/* Dislike Button - Only show when there's a current match */}
                  {currentMatch && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-red-500 hover:bg-red-50 transition-all active:scale-95 bg-white"
                      onClick={() => handleDecision("DISLIKE")}
                      disabled={processing}
                      aria-label="Dislike"
                    >
                      <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                    </Button>
                  )}

                  {/* Undo Button - Always show if there are recent swipes, even when deck is empty */}
                  {recentSwipes.length > 0 && (
                    <Button
                      size="icon"
                      variant="outline"
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 transition-all active:scale-95 bg-white ${
                        !undoing
                          ? "border-yellow-500 bg-yellow-50 hover:bg-yellow-100"
                          : "border-gray-300 bg-gray-50 cursor-not-allowed opacity-50"
                      }`}
                      onClick={handleUndo}
                      disabled={undoing}
                      aria-label="Undo last swipe"
                      title="Undo last swipe"
                    >
                      <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                    </Button>
                  )}
                  
                  {/* Like Button - Only show when there's a current match */}
                  {currentMatch && (
                    <Button
                      size="icon"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all active:scale-95"
                      onClick={handleLikeClick}
                      disabled={processing}
                      aria-label="Like"
                    >
                      <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </Button>
                  )}
                </div>
              </div>
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

      <DatingFiltersPanel
        open={showBasicFilters}
        onOpenChange={setShowBasicFilters}
        onFiltersChange={() => {
          // Refetch matches when basic filters change
          fetchMatches();
        }}
        asModal={true}
          />
    </>
  );
}

