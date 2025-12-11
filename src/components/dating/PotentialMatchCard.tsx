"use client";

import Image from "next/image";
import Link from "next/link";
import { Music, MapPin, User, ExternalLink, RotateCcw, Flag, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import ReportModal from "@/components/reports/ReportModal";
import BlockButton from "@/components/BlockButton";
import { useBlockStatus } from "@/hooks/useBlockStatus";

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
  compatibility?: {
    overall: number;
    music: number;
    profile: number;
    activity: number;
  };
}

interface PotentialMatchCardProps {
  match: MatchProfile;
  onLike: () => void;
  onDislike: () => void;
  processing: boolean;
}

export default function PotentialMatchCard({
  match,
  processing,
}: PotentialMatchCardProps) {
  const displayPhoto = match.primaryPhotoUrl || match.photos[0]?.url || "/assets/avatar-placeholder.png";
  const [showReportModal, setShowReportModal] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const { isBlocked } = useBlockStatus(match.id);
  const otherPhotos = match.photos.filter(p => !p.isPrimary && p.url !== displayPhoto);

  // Fetch user preferences to check matches
  useEffect(() => {
    fetch("/api/dating/preferences")
      .then(res => res.json())
      .then(data => setUserPreferences(data))
      .catch(console.error);
  }, []);

  // Calculate which preferences match
  const getMatchingPreferences = () => {
    if (!userPreferences) return [];
    const matches: string[] = [];
    
    if (match.age && userPreferences.preferredMinAge && userPreferences.preferredMaxAge) {
      if (match.age >= userPreferences.preferredMinAge && match.age <= userPreferences.preferredMaxAge) {
        matches.push("Age");
      }
    }
    
    if (match.height && userPreferences.preferredMinHeight && userPreferences.preferredMaxHeight) {
      const heightInCm = match.height;
      const minHeight = userPreferences.preferredMinHeight;
      const maxHeight = userPreferences.preferredMaxHeight;
      if (heightInCm >= minHeight && heightInCm <= maxHeight) {
        matches.push("Height");
      }
    }
    
    // Note: Parental status matching would require preferredHasKids field in preferences
    // For now, we'll just show age and height matches
    
    return matches;
  };

  const matchingPreferences = getMatchingPreferences();

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Primary Photo */}
      <div className="relative w-full aspect-[3/4] bg-gray-100">
        <Image
          src={displayPhoto}
          alt={match.displayName}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Info */}
      <div className="p-4 sm:p-6">
        {/* Name, Age and Profile Button */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {match.displayName}{match.age ? `, ${match.age}` : ""}
            </h2>
            <Link href={`/users/${match.username}`} target="_blank">
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
        {match.location && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-md font-semibold text-gray-900">
                Located in {match.location}
              </span>
            </div>
            {match.distance !== null && (
              <p className="text-xs text-gray-600 ml-6">
                About {Math.round(match.distance * 0.621371)} miles away
              </p>
            )}
          </div>
        )}

        {/* Height */}
        {match.height && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Height:</span>
            <span className="text-md text-gray-900">
              {Math.floor(match.height / 12)}&apos;{match.height % 12}&quot;
            </span>
          </div>
        )}

        {/* Has Kids */}
        {match.hasKids !== null && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Has Kids:</span>
            <span className="text-md text-gray-900">{match.hasKids ? "Yes" : "Doesn't have kids"}</span>
          </div>
        )}

        {/* Education */}
        {match.education && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Education:</span>
            <span className="text-md text-gray-900">{match.education}</span>
          </div>
        )}

        {/* Additional Profile Details */}
        {match.gender && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Gender:</span>
            <span className="text-md text-gray-900">{match.gender}</span>
          </div>
        )}
        {match.sexualOrientation && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Sexual Orientation:</span>
            <span className="text-md text-gray-900">{match.sexualOrientation}</span>
          </div>
        )}
        {match.coronavirusVaccinated && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Coronavirus Vaccinated:</span>
            <span className="text-md text-gray-900">{match.coronavirusVaccinated}</span>
          </div>
        )}
        {match.religion && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Religion:</span>
            <span className="text-md text-gray-900">{match.religion}</span>
          </div>
        )}
        {match.smokes && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Smokes:</span>
            <span className="text-md text-gray-900">{match.smokes}</span>
          </div>
        )}
        {match.drinks && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Drinks:</span>
            <span className="text-md text-gray-900">{match.drinks}</span>
          </div>
        )}
        {match.activity && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Activity:</span>
            <span className="text-md text-gray-900">{match.activity}</span>
          </div>
        )}
        {match.interests && match.interests.length > 0 && (
          <div className="flex items-start gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w  -[80px]">Interests:</span>
            <div className="flex flex-wrap gap-2">
              {match.interests.map((interest, idx) => (
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
        {match.job && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Job:</span>
            <span className="text-md text-gray-900">{match.job}</span>
          </div>
        )}
        {match.pets && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md font-semibold text-gray-700 min-w-[80px]">Pets:</span>
            <span className="text-md text-gray-900">{match.pets}</span>
          </div>
        )}

        {/* Bio */}
        {match.bio && (
          <div className="mb-4 pt-2 border-t">
            <span className="text-md font-semibold text-gray-700 block mb-1">About:</span>
            <span className="text-md text-gray-900">{match.bio}</span>
          </div>
        )}

        {/* Additional Photos - One Column */}
        {otherPhotos.length > 0 && (
          <div className="space-y-3 mb-4">
            {otherPhotos.map((photo, idx) => (
              <div key={idx} className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={photo.url}
                  alt={`${match.displayName} photo ${idx + 2}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Block and Report Buttons */}
        <div className="flex gap-3 pt-4 border-t justify-around items-center">
          <Button
            variant="outline"
            className="w-[140px] bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            onClick={() => setShowReportModal(true)}
          >
            {/* <Flag className="w-4 h-4 mr-2" /> */}
            Report
          </Button>
          <div className="w-[140px]">
            <BlockButton userId={match.id} initiallyBlocked={isBlocked} />
          </div>
        </div>

        {/* Music Info */}
        {(match.musicInfo.instruments.length > 0 ||
          match.musicInfo.skills.length > 0) && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-start gap-2 mb-3">
              <Music className="w-5 h-5 text-purple-500 mt-0.5" />
              <div className="flex-1">
                {match.musicInfo.instruments.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Instruments</p>
                    <div className="flex flex-wrap gap-2">
                      {match.musicInfo.instruments.slice(0, 3).map((instrument, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {instrument}
                        </span>
                      ))}
                      {match.musicInfo.instruments.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{match.musicInfo.instruments.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {match.musicInfo.skills.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {match.musicInfo.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {match.musicInfo.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{match.musicInfo.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {processing && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Processing...
          </div>
        )}
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="profile"
        targetId={match.id}
      />
    </div>
  );
}

