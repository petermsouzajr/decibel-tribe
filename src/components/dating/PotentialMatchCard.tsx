"use client";

import Image from "next/image";
import Link from "next/link";
import { Music, MapPin, User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import DatingSafetyActions from "./DatingSafetyActions";

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

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Photo */}
      <div className="relative w-full aspect-[3/4] bg-gray-100">
        <Image
          src={displayPhoto}
          alt={match.displayName}
          fill
          className="object-cover"
          priority
        />
        {/* Age Badge */}
        {match.age && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
            {match.age}
          </div>
        )}
        {/* Compatibility Score */}
        {match.compatibility && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {match.compatibility.overall}% Match
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {match.displayName}
            </h2>
            {match.distance !== null && (
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {match.distance.toFixed(1)} km
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={`/users/${match.username}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">View Profile</span>
                <span className="sm:hidden">Profile</span>
              </Button>
            </Link>
            <DatingSafetyActions userId={match.id} userName={match.displayName} />
          </div>
        </div>

        {/* Location */}
        {match.location && (
          <p className="text-gray-600 text-sm mb-4">{match.location}</p>
        )}

        {/* Bio */}
        {match.bio && (
          <p className="text-gray-700 mb-4 line-clamp-3">{match.bio}</p>
        )}

        {/* Music Info */}
        {(match.musicInfo.instruments.length > 0 ||
          match.musicInfo.skills.length > 0) && (
          <div className="border-t pt-4">
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
    </div>
  );
}

