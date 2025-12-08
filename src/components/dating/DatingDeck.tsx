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
import FilterPanel from "./FilterPanel";
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
import TravelModeDialogContent from "./TravelModeDialogContent";

interface MatchProfile {
  id: string;
  username: string;
  displayName: string;
  age: number | null;
  height: number | null;
  gender: string | null;
  bio: string;
  hasKids: boolean | null;
  smokes: string | null;
  drinks: string | null;
  activity: string | null;
  college: string | null;
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showTravelMode, setShowTravelMode] = useState(false);
  const [filters, setFilters] = useState<{
    preferredInstruments: string[];
    preferredSkills: string[];
  }>({
    preferredInstruments: [],
    preferredSkills: [],
  });
  const [recentSwipes, setRecentSwipes] = useState<Array<{ id: string; toUserId: string; direction: string; createdAt: Date }>>([]);
  const [undoing, setUndoing] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);

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

  useEffect(() => {
    // Fetch recent swipes for undo functionality
    const fetchRecentSwipes = async () => {
      try {
        const response = await kyInstance
          .get("/api/dating/history?type=all")
          .json<{ swipes: Array<{ id: string; toUserId: string; direction: string; createdAt: string }> }>();
        
        // Take only the last 10 swipes (most recent)
        setRecentSwipes(
          response.swipes.slice(0, 10).map(s => ({
            id: s.id,
            toUserId: s.toUserId,
            direction: s.direction,
            createdAt: new Date(s.createdAt),
          }))
        );
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

      // Refresh recent swipes for undo
      const swipeResponse = await kyInstance
        .get("/api/dating/history?type=all")
        .json<{ swipes: Array<{ id: string; toUserId: string; direction: string; createdAt: string }> }>()
        .catch(() => ({ swipes: [] }));
      
      setRecentSwipes(
        swipeResponse.swipes.slice(0, 10).map(s => ({
          id: s.id,
          toUserId: s.toUserId,
          direction: s.direction,
          createdAt: new Date(s.createdAt),
        }))
      );

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

  const handleUndo = async () => {
    if (undoing || recentSwipes.length === 0) return;

    const lastSwipe = recentSwipes[0];
    if (!lastSwipe) return;

    try {
      setUndoing(true);
      await kyInstance.delete(`/api/dating/history?swipeId=${lastSwipe.id}`);

      // Remove the undone swipe from the list
      setRecentSwipes((prev) => prev.slice(1));

      // If we're not at the first match, go back one
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else {
        // Refresh matches to include the undone user
        await fetchMatches();
      }

      toast({
        description: "Undone successfully",
      });
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
          <p className="text-gray-600">Loading potential matches...</p>
        </div>
      </div>
    );
  }

  const currentMatch = matches.length > 0 ? matches[currentIndex] : null;

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

              {/* Location/Travel Mode Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTravelMode(true)}
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
                  <DropdownMenuItem onClick={() => setShowAdvancedFilters(true)}>
                    <Music className="mr-2 h-4 w-4" />
                    Advanced Filters
                    {(filters.preferredInstruments.length > 0 ||
                      filters.preferredSkills.length > 0) && (
                      <span className="ml-auto bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {filters.preferredInstruments.length +
                          filters.preferredSkills.length}
                      </span>
                    )}
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
          ) : matches.length === 0 && !loading && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
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
                onClick={() => router.push("/dating/profile")}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Update Preferences
              </Button>
            </div>
          )}

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

          {/* Floating Decision Buttons - Fixed at bottom - Only show when there's a match */}
          {currentMatch && (
            <div className="fixed bottom-0 left-0 right-0 mb-16 border-gray-200 shadow-lg z-50 pb-safe">
              <div className="w-full px-2 sm:px-4 lg:max-w-2xl lg:mx-auto">
                <div className="flex justify-around items-center gap-4 sm:gap-6 py-4">
                  {/* Dislike Button */}
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

                  {/* Undo Button */}
                  <Button
                    size="icon"
                    variant="outline"
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 transition-all active:scale-95 bg-white ${
                      recentSwipes.length > 0 && !undoing
                        ? "border-yellow-500 bg-yellow-50 hover:bg-yellow-100"
                        : "border-gray-300 bg-gray-50 cursor-not-allowed opacity-50"
                    }`}
                    onClick={handleUndo}
                    disabled={undoing || recentSwipes.length === 0}
                    aria-label="Undo last swipe"
                    title={recentSwipes.length > 0 ? "Undo last swipe" : "No swipes to undo"}
                  >
                    <RotateCcw className={`w-5 h-5 sm:w-6 sm:h-6 ${recentSwipes.length > 0 ? "text-yellow-600" : "text-gray-400"}`} />
                  </Button>
                  
                  {/* Like Button */}
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
      <FilterPanel
        open={showAdvancedFilters}
        onOpenChange={setShowAdvancedFilters}
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
          // Refetch matches when advanced filters change
          fetchMatches();
        }}
      />
      <Dialog open={showTravelMode} onOpenChange={setShowTravelMode}>
        <DialogContent className="max-w-md bg-gray-950 border-gray-800">
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

