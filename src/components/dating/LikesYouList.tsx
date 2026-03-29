"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { Loader2, Heart, Check, X, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";
import PotentialMatchCard from "./PotentialMatchCard";
import MatchCelebration from "./MatchCelebration";
import DatingHeader from "./DatingHeader";

type IdVerificationFilter = "show_id_verified_only" | "show_all" | "show_unverified_only";

interface LikeUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  primaryPhotoUrl: string | null;
  age: number | null;
  height: number | null;
  gender: string | null;
  location: string | null;
  likedAt: Date;
  message: string | null;
  isIDVerified: boolean;
}

const FILTER_OPTIONS: {
  value: IdVerificationFilter;
  label: string;
  icon: React.ReactNode;
  emptyMessage: string;
}[] = [
  {
    value: "show_id_verified_only",
    label: "ID Verified",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    emptyMessage: "No ID-verified users have liked you yet.",
  },
  {
    value: "show_all",
    label: "Show All",
    icon: <Heart className="w-3.5 h-3.5" />,
    emptyMessage: "No one has liked you yet — keep swiping!",
  },
  {
    value: "show_unverified_only",
    label: "Unverified",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    emptyMessage: "No unverified users have liked you yet.",
  },
];

export default function LikesYouList() {
  const router = useRouter();
  const { toast } = useToast();
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [matchedUser, setMatchedUser] = useState<LikeUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<LikeUser | null>(null);
  const [activeFilter, setActiveFilter] = useState<IdVerificationFilter>("show_id_verified_only");

  const fetchLikes = useCallback(
    async (filter?: IdVerificationFilter, isFilterSwitch = false) => {
      try {
        if (isFilterSwitch) {
          setFilterLoading(true);
        } else {
          setLoading(true);
        }

        const params = filter ? `?filter=${filter}` : "";
        const response = await kyInstance
          .get(`/api/dating/likes-you${params}`)
          .json<{
            users: LikeUser[];
            activeFilter: IdVerificationFilter;
            savedFilter: IdVerificationFilter;
          }>();

        // Convert date strings to Date objects
        const processedLikes = response.users.map((user) => ({
          ...user,
          likedAt: new Date(user.likedAt),
        }));

        setLikes(processedLikes);
        // Sync UI to the filter the API actually used (handles first load from saved prefs)
        setActiveFilter(response.activeFilter);
      } catch (error: any) {
        console.error("Error fetching likes:", error);
        if (error.response?.status === 403) {
          toast({
            variant: "destructive",
            description: "Access denied",
          });
          router.push("/dating");
        } else {
          toast({
            variant: "destructive",
            description: "Failed to load likes",
          });
        }
      } finally {
        setLoading(false);
        setFilterLoading(false);
      }
    },
    [router, toast]
  );

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const handleFilterChange = (filter: IdVerificationFilter) => {
    if (filter === activeFilter) return;
    setActiveFilter(filter);
    fetchLikes(filter, true);
  };

  const handleDecision = async (userId: string, decision: "LIKE" | "DISLIKE") => {
    if (processing) return;

    try {
      setProcessing(userId);
      const response = await kyInstance
        .post("/api/dating/decision", {
          json: { targetUserId: userId, decision },
        })
        .json<{ success: boolean; isMatch: boolean; matchId?: string }>();

      if (response.isMatch) {
        const matched = likes.find((u) => u.id === userId);
        if (matched) {
          setMatchedUser(matched);
          setShowMatchCelebration(true);
        }
        toast({ description: `It's a match! 🎉` });
        setLikes((prev) => prev.filter((u) => u.id !== userId));
      } else if (decision === "LIKE") {
        toast({ description: "Liked back! They'll be notified if it's a match." });
        setLikes((prev) => prev.filter((u) => u.id !== userId));
      } else {
        setLikes((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (error: any) {
      console.error("Error recording decision:", error);
      if (error.response?.status === 403) {
        toast({
          variant: "destructive",
          description: "Email verification required to like users.",
        });
      } else {
        toast({
          variant: "destructive",
          description: "Failed to record decision",
        });
      }
    } finally {
      setProcessing(null);
    }
  };

  const activeFilterConfig = FILTER_OPTIONS.find((o) => o.value === activeFilter)!;

  // ─── Filter Toggle Bar ────────────────────────────────────────────────────
  const FilterBar = () => (
    <div className="flex items-center gap-2 mb-5 flex-wrap">
      <span className="text-sm font-medium text-gray-600 mr-1">Show:</span>
      {FILTER_OPTIONS.map((opt) => {
        const isActive = activeFilter === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => handleFilterChange(opt.value)}
            disabled={filterLoading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              isActive
                ? opt.value === "show_id_verified_only"
                  ? "bg-green-100 border-green-400 text-green-800 shadow-sm"
                  : opt.value === "show_unverified_only"
                  ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm"
                  : "bg-purple-100 border-purple-400 text-purple-800 shadow-sm"
                : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
      {filterLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-1" />}
    </div>
  );

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="w-full px-2 sm:px-4 lg:max-w-4xl lg:mx-auto">
          <DatingHeader title="Likes You" />
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading who likes you...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Empty State ──────────────────────────────────────────────────────────
  if (likes.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="w-full px-2 sm:px-4 lg:max-w-4xl lg:mx-auto">
          <DatingHeader title="Likes You" />
          <FilterBar />
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-64 h-64 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <div className="text-center">
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No likes yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  {activeFilterConfig.emptyMessage}
                </p>
              </div>
            </div>
            {activeFilter !== "show_all" && (
              <p className="text-sm text-gray-500 mb-4">
                Try switching to{" "}
                <button
                  className="text-purple-600 font-medium underline underline-offset-2"
                  onClick={() => handleFilterChange("show_all")}
                >
                  Show All
                </button>{" "}
                to see everyone who liked you.
              </p>
            )}
            <Button
              onClick={() => router.push("/dating")}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              Start Swiping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main List ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="w-full px-2 sm:px-4 lg:max-w-4xl lg:mx-auto">
          <DatingHeader title="Likes You" />

          {/* Filter bar + count */}
          <div className="mb-2">
            <FilterBar />
            <p className="text-sm text-gray-500">
              {likes.length} {likes.length === 1 ? "person likes" : "people like"} you
              {activeFilter !== "show_all" && (
                <span className="ml-1 text-gray-400">
                  ({activeFilterConfig.label} filter active)
                </span>
              )}
            </p>
          </div>

          {/* Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 mt-4">
            {likes.map((user) => {
              const photoUrl =
                user.primaryPhotoUrl || user.avatarUrl || "/assets/avatar-placeholder.png";
              const isProcessing = processing === user.id;

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="relative w-full aspect-[3/4] bg-gray-100">
                    <Image
                      src={photoUrl}
                      alt={user.displayName}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                    {/* Age badge */}
                    {user.age && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-gray-900">
                        {user.age}
                      </div>
                    )}
                    {/* ID verification badge overlay on photo */}
                    <div className="absolute bottom-2 left-2">
                      {user.isIDVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100/95 text-green-800 border border-green-300 backdrop-blur-sm">
                          <ShieldCheck className="w-3 h-3 text-green-600" />
                          ID Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100/95 text-amber-800 border border-amber-300 backdrop-blur-sm">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          ID Unverified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">
                      {user.displayName}
                    </h3>
                    {user.location && (
                      <p className="text-xs text-gray-600 mb-2">{user.location}</p>
                    )}
                    {user.message && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-3">
                        <p className="text-xs text-purple-800 italic">
                          &quot;{user.message}&quot;
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mb-3">
                      {formatRelativeDate(user.likedAt)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDecision(user.id, "DISLIKE");
                        }}
                        disabled={isProcessing}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDecision(user.id, "LIKE");
                        }}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <PotentialMatchCard
              match={{
                id: selectedUser.id,
                username: selectedUser.username,
                displayName: selectedUser.displayName,
                age: selectedUser.age,
                height: selectedUser.height || null,
                gender: selectedUser.gender || null,
                sexualOrientation: null,
                coronavirusVaccinated: null,
                religion: null,
                bio: "",
                hasKids: null,
                smokes: null,
                drinks: null,
                activity: null,
                education: null,
                job: null,
                pets: [],
                interests: [],
                photos: selectedUser.primaryPhotoUrl
                  ? [{ url: selectedUser.primaryPhotoUrl, isPrimary: true }]
                  : [],
                primaryPhotoUrl: selectedUser.primaryPhotoUrl,
                distance: null,
                location: selectedUser.location,
                isIDVerified: selectedUser.isIDVerified,
                musicInfo: { instruments: [], skills: [] },
              }}
              onLike={() => {
                handleDecision(selectedUser.id, "LIKE");
                setSelectedUser(null);
              }}
              onDislike={() => {
                handleDecision(selectedUser.id, "DISLIKE");
                setSelectedUser(null);
              }}
              processing={processing === selectedUser.id}
            />
            {selectedUser.message && (
              <div className="p-4 bg-purple-50 border-t">
                <p className="text-sm font-semibold text-purple-900 mb-1">
                  Their message:
                </p>
                <p className="text-sm text-purple-800 italic">
                  &quot;{selectedUser.message}&quot;
                </p>
              </div>
            )}
            <div className="p-4 flex gap-3 border-t">
              <Button
                variant="outline"
                className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                onClick={() => {
                  handleDecision(selectedUser.id, "DISLIKE");
                  setSelectedUser(null);
                }}
                disabled={processing === selectedUser.id}
              >
                <X className="w-4 h-4 mr-2" />
                Pass
              </Button>
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={() => {
                  handleDecision(selectedUser.id, "LIKE");
                  setSelectedUser(null);
                }}
                disabled={processing === selectedUser.id}
              >
                {processing === selectedUser.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Like Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {showMatchCelebration && matchedUser && (
        <MatchCelebration
          user={{
            id: matchedUser.id,
            username: matchedUser.username,
            displayName: matchedUser.displayName,
            primaryPhotoUrl: matchedUser.primaryPhotoUrl,
          }}
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
    </>
  );
}
