"use client";

import Image from "next/image";
import Link from "next/link";
import { Music, MapPin, User, ExternalLink, RotateCcw, Flag, Shield, X as XIcon, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import ReportModal from "@/components/reports/ReportModal";
import BlockButton from "@/components/BlockButton";
import { useBlockStatus } from "@/hooks/useBlockStatus";
import kyInstance from "@/lib/ky";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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
  currentSwipe?: {
    id: string;
    direction: "LIKE" | "DISLIKE";
    canUnlike: boolean;
  } | null;
}

interface ProfileViewModalProps {
  userId: string;
  currentDirection: "LIKE" | "DISLIKE" | null;
  onClose: () => void;
  onLike: () => void;
  onDislike: () => void;
  onUnlike: (swipeId: string) => void;
}

export default function ProfileViewModal({
  userId,
  currentDirection,
  onClose,
  onLike,
  onDislike,
  onUnlike,
}: ProfileViewModalProps) {
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const { isBlocked } = useBlockStatus(userId);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await kyInstance
          .get(`/api/dating/user/${userId}`)
          .json<{ profile: MatchProfile }>();
        setProfile(response.profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Fetch user preferences to check matches
  useEffect(() => {
    fetch("/api/dating/preferences")
      .then(res => res.json())
      .then(data => setUserPreferences(data))
      .catch(console.error);
  }, []);

  const handleLike = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      await onLike();
      // Modal will be closed by parent component
    } finally {
      setProcessing(false);
    }
  };

  const handleDislike = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      await onDislike();
      // Modal will be closed by parent component
    } finally {
      setProcessing(false);
    }
  };

  const handleUnlike = async () => {
    if (!profile?.currentSwipe?.id || processing) return;
    setProcessing(true);
    try {
      await onUnlike(profile.currentSwipe.id);
      toast({
        description: "Decision updated to Unlike!",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Calculate which preferences match
  const getMatchingPreferences = () => {
    if (!userPreferences || !profile) return [];
    const matches: string[] = [];
    
    if (profile.age && userPreferences.preferredMinAge && userPreferences.preferredMaxAge) {
      if (profile.age >= userPreferences.preferredMinAge && profile.age <= userPreferences.preferredMaxAge) {
        matches.push("Age");
      }
    }
    
    if (profile.height && userPreferences.preferredMinHeight && userPreferences.preferredMaxHeight) {
      const heightInCm = profile.height;
      const minHeight = userPreferences.preferredMinHeight;
      const maxHeight = userPreferences.preferredMaxHeight;
      if (heightInCm >= minHeight && heightInCm <= maxHeight) {
        matches.push("Height");
      }
    }
    
    return matches;
  };

  const matchingPreferences = getMatchingPreferences();
  const displayPhoto = profile?.primaryPhotoUrl || profile?.photos[0]?.url || "/assets/avatar-placeholder.png";
  const otherPhotos = profile?.photos.filter(p => !p.isPrimary && p.url !== displayPhoto) || [];

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white p-0 flex flex-col [&>button]:hidden">
        <div className="bg-white rounded-2xl shadow-xl overflow-y-auto flex-1 pb-24">
          {/* Primary Photo */}
          <div className="relative w-full aspect-[3/4] bg-gray-100">
            <Image
              src={displayPhoto}
              alt={profile.displayName}
              fill
              className="object-cover"
              priority
            />
            {/* Close Button - Top Right */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full z-10"
              onClick={onClose}
              aria-label="Close"
            >
              <XIcon className="w-6 h-6 text-gray-900" />
            </Button>
            {/* Context Text - Centered below close button */}
            {profile.currentSwipe?.direction && (
              <div className="absolute top-12 right-2 left-2 text-center">
                <p className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full inline-block">
  You previously{" "}
  {profile.currentSwipe.direction === "LIKE" ? (
    <span className="font-bold bg-green-500 text-white px-2 py-0.5 rounded">
      liked
    </span>
  ) : (
    <span className="font-bold bg-red-500 text-white px-2 py-0.5 rounded">
      disliked
    </span>
  )}{" "}
  this person – change your mind?
</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 sm:p-6">
            {/* Name, Age and Profile Button */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {profile.displayName}{profile.age ? `, ${profile.age}` : ""}
              </h2>
              <Link href={`/users/${profile.username}`} target="_blank">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-md sm:text-md bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">View Profile</span>
                  <span className="sm:hidden">Profile</span>
                </Button>
              </Link>
            </div>

            {/* Matches Preferences Section */}
            {matchingPreferences.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  <span className="text-md font-semibold text-purple-900">
                    Matches {matchingPreferences.length} preference{matchingPreferences.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-sm text-purple-700">
                  {matchingPreferences.join(", ")}
                </p>
              </div>
            )}

            {/* Location with Distance */}
            {profile.location && (
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-md font-semibold text-gray-900">
                    Located in {profile.location}
                  </span>
                </div>
                {profile.distance !== null && (
                  <p className="text-xs text-gray-600 ml-6">
                    About {Math.round(profile.distance * 0.621371)} miles away
                  </p>
                )}
              </div>
            )}

            {/* Height */}
            {profile.height && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Height:</span>
                <span className="text-md text-gray-900">
                  {Math.floor(profile.height / 12)}&apos;{profile.height % 12}&quot;
                </span>
              </div>
            )}

            {/* Has Kids */}
            {profile.hasKids !== null && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Has Kids:</span>
                <span className="text-md text-gray-900">{profile.hasKids ? "Yes" : "Doesn't have kids"}</span>
              </div>
            )}

            {/* Education */}
            {profile.education && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Education:</span>
                <span className="text-md text-gray-900">{profile.education}</span>
              </div>
            )}

            {/* Additional Profile Details */}
            {profile.gender && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Gender:</span>
                <span className="text-md text-gray-900">{profile.gender}</span>
              </div>
            )}
            {profile.sexualOrientation && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Sexual Orientation:</span>
                <span className="text-md text-gray-900">{profile.sexualOrientation}</span>
              </div>
            )}
            {profile.coronavirusVaccinated && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Vaccinated:</span>
                <span className="text-md text-gray-900">{profile.coronavirusVaccinated}</span>
              </div>
            )}
            {profile.religion && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Religion:</span>
                <span className="text-md text-gray-900">{profile.religion}</span>
              </div>
            )}
            {profile.smokes && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Smokes:</span>
                <span className="text-md text-gray-900">{profile.smokes}</span>
              </div>
            )}
            {profile.drinks && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Drinks:</span>
                <span className="text-md text-gray-900">{profile.drinks}</span>
              </div>
            )}
            {profile.activity && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Activity:</span>
                <span className="text-md text-gray-900">{profile.activity}</span>
              </div>
            )}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex items-start gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Interests:</span>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-md rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.job && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Job:</span>
                <span className="text-md text-gray-900">{profile.job}</span>
              </div>
            )}
            {profile.pets && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-md font-semibold text-gray-700 min-w-[80px]">Pets:</span>
                <span className="text-md text-gray-900">{profile.pets}</span>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="mb-4 pt-2 border-t">
                <span className="text-md font-semibold text-gray-700 block mb-1">About:</span>
                <span className="text-md text-gray-900">{profile.bio}</span>
              </div>
            )}

            {/* Additional Photos - One Column */}
            {otherPhotos.length > 0 && (
              <div className="space-y-3 mb-4">
                {otherPhotos.map((photo, idx) => (
                  <div key={idx} className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={photo.url}
                      alt={`${profile.displayName} photo ${idx + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Block and Report Buttons */}
            <div className="flex gap-3 pt-4 border-t justify-around items-center mb-4">
              <Button
                variant="outline"
                className="w-[140px] bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                onClick={() => setShowReportModal(true)}
              >
                Report
              </Button>
              <div className="w-[140px]">
                <BlockButton userId={profile.id} initiallyBlocked={isBlocked} />
              </div>
            </div>

            {/* Music Info */}
            {(profile.musicInfo.instruments.length > 0 ||
              profile.musicInfo.skills.length > 0) && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-start gap-2 mb-3">
                  <Music className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div className="flex-1">
                    {profile.musicInfo.instruments.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Instruments</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.musicInfo.instruments.slice(0, 3).map((instrument, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                            >
                              {instrument}
                            </span>
                          ))}
                          {profile.musicInfo.instruments.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{profile.musicInfo.instruments.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {profile.musicInfo.skills.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.musicInfo.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {profile.musicInfo.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{profile.musicInfo.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Buttons - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0  border-gray-200 shadow-lg z-50 pb-safe">
          <div className="w-full px-2 sm:px-4 max-w-2xl mx-auto">
            <div className="flex justify-center items-center gap-4 sm:gap-6 py-4">
              {/* Dislike Button */}
              <Button
                size="icon"
                variant="outline"
                className={`rounded-full border-2 transition-all active:scale-95 bg-white ${
                  profile.currentSwipe?.direction === "DISLIKE"
                    ? "w-14 h-14 sm:w-16 sm:h-16 border-red-300 hover:bg-red-50 opacity-60 cursor-not-allowed"
                    : profile.currentSwipe?.direction === "LIKE" && profile.currentSwipe?.canUnlike
                    ? "w-20 h-20 sm:w-24 sm:h-24 border-red-500 hover:bg-red-50 shadow-lg"
                    : "w-16 h-16 sm:w-20 sm:h-20 border-red-500 hover:bg-red-50"
                }`}
                onClick={handleDislike}
                disabled={processing || profile.currentSwipe?.direction === "DISLIKE"}
                aria-label="Dislike"
                title={profile.currentSwipe?.direction === "DISLIKE" ? "Already disliked" : "Dislike"}
              >
                {processing ? (
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-red-500" />
                ) : (
                  <XIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${
                    profile.currentSwipe?.direction === "DISLIKE" ? "text-red-300" : "text-red-500"
                  }`} />
                )}
              </Button>

              {/* Like/Unlike Button */}
              <Button
                size="icon"
                variant="outline"
                className={`rounded-full border-2 transition-all active:scale-95 bg-white ${
                  profile.currentSwipe?.direction === "LIKE"
                    ? profile.currentSwipe?.canUnlike
                      ? "w-20 h-20 sm:w-24 sm:h-24 border-yellow-500 hover:bg-yellow-50 shadow-lg"
                      : "w-14 h-14 sm:w-16 sm:h-16 border-green-300 hover:bg-green-50 opacity-60 cursor-not-allowed"
                    : profile.currentSwipe?.direction === "DISLIKE"
                    ? "w-20 h-20 sm:w-24 sm:h-24 border-green-500 hover:bg-green-50 shadow-lg"
                    : "w-16 h-16 sm:w-20 sm:h-20 border-green-500 hover:bg-green-50"
                }`}
                onClick={profile.currentSwipe?.direction === "LIKE" && profile.currentSwipe?.canUnlike ? handleUnlike : handleLike}
                disabled={processing || (profile.currentSwipe?.direction === "LIKE" && !profile.currentSwipe?.canUnlike)}
                aria-label={profile.currentSwipe?.direction === "LIKE" && profile.currentSwipe?.canUnlike ? "Unlike" : "Like"}
                title={profile.currentSwipe?.direction === "LIKE" && !profile.currentSwipe?.canUnlike ? "Already liked" : profile.currentSwipe?.direction === "LIKE" && profile.currentSwipe?.canUnlike ? "Unlike" : "Like"}
              >
                {processing ? (
                  <Loader2 className={`w-6 h-6 sm:w-8 sm:h-8 animate-spin ${
                    profile.currentSwipe?.direction === "LIKE" && profile.currentSwipe?.canUnlike ? "text-yellow-600" : "text-green-500"
                  }`} />
                ) : profile.currentSwipe?.direction === "LIKE" && profile.currentSwipe?.canUnlike ? (
                  <RotateCcw className="w-7 h-7 sm:w-9 sm:h-9 text-yellow-600" />
                ) : (
                  <Heart className={`w-6 h-6 sm:w-8 sm:h-8 fill-green-500 ${
                    profile.currentSwipe?.direction === "LIKE" ? "text-green-300" : "text-green-500"
                  }`} />
                )}
              </Button>
            </div>
          </div>
        </div>

        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          contentType="profile"
          targetId={profile.id}
        />
      </DialogContent>
    </Dialog>
  );
}

