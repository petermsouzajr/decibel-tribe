"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { Loader2, MessageCircle, Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";
import DatingHeader from "./DatingHeader";

interface Match {
  matchId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    primaryPhotoUrl: string | null;
    age: number | null;
    location: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: Date;
    isFromMe: boolean;
    read: boolean;
  } | null;
  unreadCount: number;
  matchedAt: Date;
  isNew: boolean; // Flag to show "New!" badge
}

export default function MatchList() {
  const router = useRouter();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await kyInstance
        .get("/api/dating/matches")
        .json<{ matches: Match[] }>();

      // Convert date strings to Date objects
      const processedMatches = response.matches.map((match) => ({
        ...match,
        matchedAt: new Date(match.matchedAt),
        lastMessage: match.lastMessage
          ? {
              ...match.lastMessage,
              createdAt: new Date(match.lastMessage.createdAt),
            }
          : null,
        isNew: match.isNew ?? false, // Ensure isNew is included
      }));

      setMatches(processedMatches);
    } catch (error: any) {
      console.error("Error fetching matches:", error);
      if (error.response?.status === 403) {
        toast({
          variant: "destructive",
          description: "Access denied",
        });
        router.push("/dating");
      } else {
        toast({
          variant: "destructive",
          description: "Failed to load matches",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="w-full px-2 sm:px-4 lg:max-w-4xl lg:mx-auto">
          <DatingHeader title="Matches" />
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading your matches...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="w-full px-2 sm:px-4 lg:max-w-4xl lg:mx-auto">
          <DatingHeader title="Matches" />
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-64 h-96 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <div className="text-center">
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">No matches yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Keep swiping to find your match!
                </p>
              </div>
            </div>
            <Link
              href="/dating"
              className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600"
            >
              Start Swiping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="w-full px-2 sm:px-4 lg:max-w-4xl lg:mx-auto">
        <DatingHeader title="Matches" />
        <div className="mb-6">
          <p className="text-gray-600">
            {matches.length} {matches.length === 1 ? "match" : "matches"}
          </p>
        </div>

        <div className="space-y-3">
          {matches.map((match) => {
            const photoUrl =
              match.user.primaryPhotoUrl ||
              match.user.avatarUrl ||
              "/assets/avatar-placeholder.png";

            return (
              <Link
                key={match.matchId}
                href={`/dating/chat/${match.matchId}`}
                className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4"
                onClick={async () => {
                  // Mark match as read when user clicks on it
                  if (match.isNew) {
                    try {
                      await kyInstance.post(`/api/dating/matches/${match.matchId}/read`);
                      // Update local state to remove "New!" badge immediately
                      setMatches(prevMatches =>
                        prevMatches.map(m =>
                          m.matchId === match.matchId ? { ...m, isNew: false } : m
                        )
                      );
                    } catch (error) {
                      // Silently fail - non-critical
                      console.error("Error marking match as read:", error);
                    }
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={photoUrl}
                      alt={match.user.displayName}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                    {match.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {match.unreadCount > 9 ? "9+" : match.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {match.user.displayName}
                        </h3>
                        {match.isNew && (
                          <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                            New!
                          </span>
                        )}
                      </div>
                      {match.lastMessage && (
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatRelativeDate(match.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {match.user.age && (
                      <p className="text-sm text-gray-600 mb-1">
                        {match.user.age} {match.user.location && `• ${match.user.location}`}
                      </p>
                    )}
                    {match.lastMessage ? (
                      <p
                        className={`text-sm truncate ${
                          match.unreadCount > 0
                            ? "font-semibold text-gray-900"
                            : "text-gray-600"
                        }`}
                      >
                        {match.lastMessage.isFromMe && "You: "}
                        {match.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No messages yet. Send a message to start the conversation!
                      </p>
                    )}
                  </div>
                  <MessageCircle
                    className={`w-6 h-6 flex-shrink-0 ${
                      match.unreadCount > 0 ? "text-purple-500" : "text-gray-400"
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

