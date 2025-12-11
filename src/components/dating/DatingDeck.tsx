"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { Check, X, Heart, Loader2, MessageCircle, Filter, MapPin, Settings, History, RotateCcw, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import PotentialMatchCard from "./PotentialMatchCard";
import MatchCelebration from "./MatchCelebration";
import BasicFiltersPanel from "./BasicFiltersPanel";
import SafetyTips from "./SafetyTips";
import { Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LocationDialogContent from "./LocationDialogContent";

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
  pets: string | null;
  interests: string[];
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
  const [showBasicFilters, setShowBasicFilters] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [filters, setFilters] = useState<{
    preferredInstruments: string[];
    preferredSkills: string[];
  }>({
    preferredInstruments: [],
    preferredSkills: [],
  });
  const [recentSwipes, setRecentSwipes] = useState<Array<{ id: string; toUserId: string; direction: string; createdAt: Date; canUnlike: boolean }>>([]);
  const [undoing, setUndoing] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
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
    if (!isVerified) {
      toast({
        variant: "destructive",
        description: "Please verify your email address to like users.",
      });
      return;
    }
    // Directly like without showing modal
    // TODO: When implementing photo-specific likes/comments (like Hinge/Bumble),
    // restore the modal functionality here to allow users to comment on specific photos
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
              description: errorData.error || "Verification required to like users",
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
    if (prefs.preferredGender) {
      try {
        const genders = JSON.parse(prefs.preferredGender);
        if (Array.isArray(genders) && genders.length > 0) {
          const genderNames = genders.map((g: any) => g.gender).join(", ");
          filters.push(`Gender: ${genderNames}`);
        } else {
          filters.push(`Gender: ${prefs.preferredGender}`);
        }
      } catch {
        filters.push(`Gender: ${prefs.preferredGender}`);
      }
    } else {
      filters.push("Gender: Not specified");
    }

    // Sexual Orientation
    if (prefs.preferredSexualOrientation) {
      filters.push(`Sexual Orientation: ${prefs.preferredSexualOrientation}`);
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

    // Music filters
    if (prefs.preferredInstruments && Array.isArray(prefs.preferredInstruments) && prefs.preferredInstruments.length > 0) {
      filters.push(`Instruments: ${prefs.preferredInstruments.join(", ")}`);
    }
    if (prefs.preferredSkills && Array.isArray(prefs.preferredSkills) && prefs.preferredSkills.length > 0) {
      filters.push(`Skills: ${prefs.preferredSkills.join(", ")}`);
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
    
    if (prefs.preferredActivity) {
      filters.push(`Activity Level: ${prefs.preferredActivity}`);
    } else {
      filters.push("Activity Level: Not specified");
    }

    // Music filters - show "Not specified" if empty
    if (prefs.preferredInstruments && Array.isArray(prefs.preferredInstruments) && prefs.preferredInstruments.length > 0) {
      filters.push(`Instruments: ${prefs.preferredInstruments.join(", ")}`);
    } else {
      filters.push("Instruments: Not specified");
    }
    
    if (prefs.preferredSkills && Array.isArray(prefs.preferredSkills) && prefs.preferredSkills.length > 0) {
      filters.push(`Skills: ${prefs.preferredSkills.join(", ")}`);
    } else {
      filters.push("Skills: Not specified");
    }

    // Match Music Tastes
    if (prefs.matchMusicTastes !== undefined && prefs.matchMusicTastes !== null) {
      filters.push(`Prioritize instrument and skill match: ${prefs.matchMusicTastes ? "Yes" : "No"}`);
    } else {
      filters.push("Prioritize instrument and skill match: Not specified");
    }

    return filters;
  };

  return (
    <>
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-32">
        <div className="w-full px-2 sm:px-4 lg:max-w-2xl lg:mx-auto">
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

          <div className="flex items-center justify-between mb-4 mt-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dating Tribe
            </h1>
            
            <div className="flex items-center gap-2">
              {/* Basic Filters Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBasicFilters(true)}
                className="flex items-center gap-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>

              {/* Location Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLocationDialog(true)}
                className="flex items-center gap-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                <MapPin className="w-4 h-4" />
                Location
              </Button>
            
              {/* Settings Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full flex-shrink-0 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => router.push("/dating/likes-you")}>
                    <Heart className="mr-2 h-4 w-4" />
                    Likes You
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dating/matches")}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Matches
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dating/profile")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dating/history")}>
                    <History className="mr-2 h-4 w-4" />
                    History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSafetyTips(true)}>
                    <Shield className="mr-2 h-4 w-4" />
                    Safety Tips
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Safety Tips Dialog */}
          <Dialog open={showSafetyTips} onOpenChange={setShowSafetyTips}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-950 border-gray-800">
              <div className="space-y-6 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Dating Safety Tips</h2>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  Your safety is our priority. Follow these guidelines to stay safe while dating.
                </p>
                
                {/* Meeting in Person */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-400" />
                    Meeting in Person
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-200">
                    <li>• Meet in a public place for your first few dates</li>
                    <li>• Tell a friend or family member where you&apos;re going and who you&apos;re meeting</li>
                    <li>• Keep your phone charged and with you</li>
                    <li>• Trust your instincts - if something feels off, leave</li>
                    <li>• Don&apos;t share your home address until you&apos;re comfortable</li>
                  </ul>
                </div>

                {/* Online Safety */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    Online Safety
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-200">
                    <li>• Never share financial information or send money</li>
                    <li>• Be cautious of users who ask for personal information too quickly</li>
                    <li>• Report suspicious behavior or fake profiles immediately</li>
                    <li>• Use the block feature if someone makes you uncomfortable</li>
                    <li>• Keep conversations on the platform until you&apos;re comfortable</li>
                  </ul>
                </div>

                {/* Red Flags */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <X className="w-5 h-5 text-red-400" />
                    Red Flags to Watch For
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-200">
                    <li>• Asking for money or financial help</li>
                    <li>• Pressuring you to meet in private or isolated locations</li>
                    <li>• Refusing to video chat or meet in person</li>
                    <li>• Inconsistent stories or information</li>
                    <li>• Aggressive or threatening language</li>
                    <li>• Asking for explicit photos or content</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
            <div className="fixed bottom-0 left-0 right-0 mb-16 border-gray-200 shadow-lg z-50 pb-safe">
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
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all active:scale-95 ${
                        isVerified
                          ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      onClick={handleLikeClick}
                      disabled={processing || !isVerified}
                      title={!isVerified ? "Verify your email to like users" : ""}
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

      <BasicFiltersPanel
        open={showBasicFilters}
        onOpenChange={setShowBasicFilters}
        onFiltersChange={() => {
          // Refetch matches when basic filters change
          fetchMatches();
        }}
      />
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-md bg-gray-950 border-gray-800">
          <LocationDialogContent
            onClose={() => setShowLocationDialog(false)}
            onUpdate={() => {
              // Refetch matches when location changes
              fetchMatches();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

