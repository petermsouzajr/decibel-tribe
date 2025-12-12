"use client";

import { useState, useEffect } from "react";
import kyInstance from "@/lib/ky";
import { Loader2, Music, TrendingUp, MessageSquare, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MatchInsightsProps {
  matchId: string;
}

interface InsightsData {
  compatibility: {
    overall: number;
    music: number;
    profile: number;
    activity: number;
  };
  commonInterests: {
    instruments: string[];
    skills: string[];
    total: number;
  };
  musicOverlap: {
    yourInstruments: string[];
    theirInstruments: string[];
    yourSkills: string[];
    theirSkills: string[];
    commonInstruments: string[];
    commonSkills: string[];
  };
  conversationStarters: string[];
}

export default function MatchInsights({ matchId }: MatchInsightsProps) {
  const { toast } = useToast();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, [matchId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await kyInstance
        .get(`/api/dating/matches/${matchId}/insights`)
        .json<InsightsData>();

      setInsights(response);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast({
        variant: "destructive",
        description: "Failed to load match insights",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overall Compatibility */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Compatibility Score</h3>
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="text-4xl font-bold mb-1">{insights.compatibility.overall}%</div>
        <p className="text-sm opacity-90">Overall match compatibility</p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-semibold text-gray-900">Music</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {insights.compatibility.music}%
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Profile</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {insights.compatibility.profile}%
          </div>
        </div>
      </div>

      {/* Common Interests */}
      {insights.commonInterests.total > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Common Interests ({insights.commonInterests.total})
          </h4>
          <div className="space-y-3">
            {insights.commonInterests.instruments.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Instruments</p>
                <div className="flex flex-wrap gap-2">
                  {insights.commonInterests.instruments.map((instrument, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium"
                    >
                      {instrument}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {insights.commonInterests.skills.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {insights.commonInterests.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Music Overlap Details */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Music Profile Comparison
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-600 mb-2">Your Instruments</p>
            <div className="flex flex-wrap gap-2">
              {insights.musicOverlap.yourInstruments.length > 0 ? (
                insights.musicOverlap.yourInstruments.map((inst, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-1 text-xs rounded-full ${
                      insights.musicOverlap.commonInstruments.includes(inst)
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {inst}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">None listed</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-2">Their Instruments</p>
            <div className="flex flex-wrap gap-2">
              {insights.musicOverlap.theirInstruments.length > 0 ? (
                insights.musicOverlap.theirInstruments.map((inst, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-1 text-xs rounded-full ${
                      insights.musicOverlap.commonInstruments.includes(inst)
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {inst}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">None listed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Starters */}
      {insights.conversationStarters.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            <h4 className="text-sm font-semibold text-gray-900">
              Conversation Starters
            </h4>
          </div>
          <div className="space-y-2">
            {insights.conversationStarters.map((starter, idx) => (
              <div
                key={idx}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700"
              >
                {starter}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


















