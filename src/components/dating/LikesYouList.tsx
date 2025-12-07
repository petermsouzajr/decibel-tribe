"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { Loader2, Heart, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";
import PotentialMatchCard from "./PotentialMatchCard";
import MatchCelebration from "./MatchCelebration";
import BackToDatingButton from "./BackToDatingButton";

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
}

export default function LikesYouList() {
  const router = useRouter();
  const { toast } = useToast();
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [matchedUser, setMatchedUser] = useState<LikeUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<LikeUser | null>(null);

  useEffect(() => {
    fetchLikes();
  }, []);

  const fetchLikes = async () => {
    try {
      setLoading(true);
      const response = await kyInstance
        .get("/api/dating/likes-you")
        .json<{ users: LikeUser[] }>();

      // Convert date strings to Date objects
      const processedLikes = response.users.map((user) => ({
        ...user,
        likedAt: new Date(user.likedAt),
      }));

      setLikes(processedLikes);
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
    }
  };

  const handleDecision = async (userId: string, decision: "LIKE" | "DISLIKE") => {
    if (processing) return;

    try {
      setProcessing(userId);
      const response = await kyInstance
        .post("/api/dating/decision", {
          json: {
            targetUserId: userId,
            decision,
          },
        })
        .json<{ success: boolean; isMatch: boolean; matchId?: string }>();

      if (response.isMatch) {
        const matched = likes.find((u) => u.id === userId);
        if (matched) {
          setMatchedUser(matched);
          setShowMatchCelebration(true);
        }
        toast({
          description: `It's a match! 🎉`,
        });
        // Remove from likes list
        setLikes((prev) => prev.filter((u) => u.id !== userId));
      } else if (decision === "LIKE") {
        toast({
          description: "Liked back! They'll be notified if it's a match.",
        });
        // Remove from likes list
        setLikes((prev) => prev.filter((u) => u.id !== userId));
      } else {
        // Disliked - remove from list
        setLikes((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (error: any) {
      console.error("Error recording decision:", error);
      if (error.response?.status === 403) {
        toast({
          variant: "destructive",
          description: "Verification required to like users",
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

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading who likes you...</p>
        </div>
      </div>
    );
  }

  if (likes.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="w-full px-2 sm:px-4 lg:max-w-4xl lg:mx-auto">
          <BackToDatingButton />
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-64 h-96 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <div className="text-center">
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No likes yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Keep swiping to get more likes!
                </p>
              </div>
            </div>
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

  return (
    <>
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="w-full px-2 sm:px-4 lg:max-w-4xl lg:mx-auto">
          <BackToDatingButton />
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Likes You
            </h1>
            <p className="text-gray-600">
              {likes.length} {likes.length === 1 ? "person likes" : "people like"} you
            </p>
          </div>

          {/* Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
                    {user.age && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-gray-900">
                        {user.age}
                      </div>
                    )}
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
                bio: "",
                hasKids: null,
                smokes: null,
                drinks: null,
                activity: null,
                college: null,
                job: null,
                pets: null,
                interests: [],
                photos: selectedUser.primaryPhotoUrl
                  ? [{ url: selectedUser.primaryPhotoUrl, isPrimary: true }]
                  : [],
                primaryPhotoUrl: selectedUser.primaryPhotoUrl,
                distance: null,
                location: selectedUser.location,
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

