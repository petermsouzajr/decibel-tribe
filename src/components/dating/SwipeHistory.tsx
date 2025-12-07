"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { Loader2, Heart, X, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";
import BackToDatingButton from "./BackToDatingButton";

interface SwipeHistoryItem {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  primaryPhotoUrl: string | null;
  age: number | null;
  location: string | null;
  direction: "LIKE" | "DISLIKE";
  message: string | null;
  createdAt: Date;
  canUnlike: boolean;
}

export default function SwipeHistory() {
  const router = useRouter();
  const { toast } = useToast();
  const [swipes, setSwipes] = useState<SwipeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "liked" | "disliked">("all");
  const [unliking, setUnliking] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const url = `/api/dating/history?type=${filter}`;
      const response = await kyInstance.get(url).json<{
        swipes: SwipeHistoryItem[];
      }>();

      // Convert date strings to Date objects
      const processedSwipes = response.swipes.map((swipe) => ({
        ...swipe,
        createdAt: new Date(swipe.createdAt),
      }));

      setSwipes(processedSwipes);
    } catch (error: any) {
      console.error("Error fetching history:", error);
      toast({
        variant: "destructive",
        description: "Failed to load swipe history",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (swipeId: string) => {
    if (unliking) return;

    try {
      setUnliking(swipeId);
      await kyInstance.delete(`/api/dating/history?swipeId=${swipeId}`);

      toast({
        description: "Unliked successfully",
      });

      // Remove from list
      setSwipes((prev) => prev.filter((s) => s.id !== swipeId));
    } catch (error: any) {
      console.error("Error unliking:", error);
      const errorData = await error.response?.json().catch(() => ({}));
      toast({
        variant: "destructive",
        description: errorData.error || "Failed to unlike",
      });
    } finally {
      setUnliking(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading swipe history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="w-full px-2 sm:px-4 lg:max-w-4xl lg:mx-auto">
        <BackToDatingButton />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Swipe History</h1>
          <p className="text-gray-600 mb-4">
            View your past likes and dislikes
          </p>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-purple-500 hover:bg-purple-600" : ""}
            >
              All ({swipes.length})
            </Button>
            <Button
              variant={filter === "liked" ? "default" : "outline"}
              onClick={() => setFilter("liked")}
              className={filter === "liked" ? "bg-green-500 hover:bg-green-600" : ""}
            >
              <Heart className="w-4 h-4 mr-2" />
              Liked ({swipes.filter((s) => s.direction === "LIKE").length})
            </Button>
            <Button
              variant={filter === "disliked" ? "default" : "outline"}
              onClick={() => setFilter("disliked")}
              className={filter === "disliked" ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <X className="w-4 h-4 mr-2" />
              Disliked ({swipes.filter((s) => s.direction === "DISLIKE").length})
            </Button>
          </div>
        </div>

        {swipes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-64 h-96 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <div className="text-center">
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No history yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start swiping to see your history here!
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {swipes.map((swipe) => {
              const photoUrl =
                swipe.primaryPhotoUrl ||
                swipe.avatarUrl ||
                "/assets/avatar-placeholder.png";

              return (
                <div
                  key={swipe.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative w-full aspect-[3/4] bg-gray-100">
                    <Image
                      src={photoUrl}
                      alt={swipe.displayName}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                    {swipe.age && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-gray-900">
                        {swipe.age}
                      </div>
                    )}
                    <div
                      className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        swipe.direction === "LIKE"
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {swipe.direction === "LIKE" ? (
                        <Heart className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">
                      {swipe.displayName}
                    </h3>
                    {swipe.location && (
                      <p className="text-xs text-gray-600 mb-2">{swipe.location}</p>
                    )}
                    {swipe.message && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-2">
                        <p className="text-xs text-purple-800 italic truncate">
                          &quot;{swipe.message}&quot;
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mb-3">
                      {formatRelativeDate(swipe.createdAt)}
                    </p>
                    {swipe.canUnlike && (
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-red-500 text-red-500 hover:bg-red-50"
                          onClick={() => handleUnlike(swipe.id)}
                          disabled={unliking === swipe.id}
                        >
                          {unliking === swipe.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Unlike
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          Undo available for 3 hours
                        </p>
                      </div>
                    )}
                    {swipe.direction === "LIKE" && !swipe.canUnlike && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        {(() => {
                          const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
                          if (swipe.createdAt < threeHoursAgo) {
                            return "Undo window expired (3 hours)";
                          }
                          return "Cannot undo matched likes";
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

