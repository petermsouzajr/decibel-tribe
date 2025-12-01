"use client";

import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";
import MatchInsights from "./MatchInsights";
import DatingSafetyActions from "./DatingSafetyActions";
import useInitializeChatClient from "@/app/(main)/messages/useInitializeChatClient";
import { StreamChat } from "stream-chat-react";
import {
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Window,
  useChatContext,
} from "stream-chat-react";

interface DatingChatInterfaceProps {
  matchId: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    user_photos: Array<{ url: string }>;
  };
}

function DatingChatContent({
  matchId,
  otherUser,
}: DatingChatInterfaceProps) {
  const router = useRouter();
  const { channel } = useChatContext();
  const [showInsights, setShowInsights] = useState(false);

  const photoUrl =
    otherUser.user_photos[0]?.url ||
    otherUser.avatarUrl ||
    "/assets/avatar-placeholder.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dating/matches")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={photoUrl}
              alt={otherUser.displayName}
              fill
              className="object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">
              {otherUser.displayName}
            </h1>
            <p className="text-xs text-gray-500">@{otherUser.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <DatingSafetyActions userId={otherUser.id} userName={otherUser.displayName} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInsights(!showInsights)}
              className="flex-shrink-0"
              title="View match insights"
            >
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Insights Panel */}
      {showInsights && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <MatchInsights matchId={matchId} />
          </div>
        </div>
      )}

      {/* Stream Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <Window>
          <div className="flex items-center gap-3 px-4 py-2 border-b bg-white">
            <ChannelHeader />
          </div>
          <MessageList />
          <MessageInput />
        </Window>
      </div>
    </div>
  );
}

export default function DatingChatInterface({
  matchId,
  otherUser,
}: DatingChatInterfaceProps) {
  const chatClient = useInitializeChatClient();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!chatClient) return;

    // Create or get the channel for this match
    const channelId = `dating-${matchId}`;
    const newChannel = chatClient.channel("messaging", channelId);
    
    // Watch the channel to ensure it exists
    newChannel.watch().then(() => {
      setChannel(newChannel);
    }).catch((error) => {
      console.error("Error watching channel:", error);
      // Channel might not exist yet, try to create it
      newChannel.create().then(() => {
        setChannel(newChannel);
      }).catch((createError) => {
        console.error("Error creating channel:", createError);
      });
    });

    return () => {
      if (newChannel) {
        newChannel.stopWatching();
      }
    };
  }, [chatClient, matchId]);

  if (!chatClient || !channel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <StreamChat client={chatClient}>
      <Channel channel={channel}>
        <DatingChatContent matchId={matchId} otherUser={otherUser} />
      </Channel>
    </StreamChat>
  );
}
