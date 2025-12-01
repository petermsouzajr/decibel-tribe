"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { formatRelativeDate } from "@/lib/utils";
import MatchInsights from "./MatchInsights";
import { Info } from "lucide-react";

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  read: boolean;
  createdAt: Date;
  isFromMe: boolean;
}

interface OtherUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  user_photos: Array<{ url: string }>;
}

interface ChatInterfaceProps {
  matchId: string;
  otherUser: OtherUser;
}

export default function ChatInterface({ matchId, otherUser }: ChatInterfaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const photoUrl =
    otherUser.user_photos[0]?.url ||
    otherUser.avatarUrl ||
    "/assets/avatar-placeholder.png";

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async (cursor?: string) => {
    try {
      setLoading(cursor === undefined);
      const url = cursor
        ? `/api/dating/matches/${matchId}/messages?cursor=${cursor}&limit=50`
        : `/api/dating/matches/${matchId}/messages?limit=50`;
      const response = await kyInstance.get(url).json<{
        messages: Message[];
        nextCursor: string | null;
      }>();

      // Convert date strings to Date objects
      const processedMessages = response.messages.map((msg) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      }));

      if (cursor) {
        setMessages((prev) => [...processedMessages, ...prev]);
      } else {
        setMessages(processedMessages);
      }
      setNextCursor(response.nextCursor);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      if (error.response?.status !== 401) {
        // Don't show toast for initial load errors
        if (messages.length > 0) {
          toast({
            variant: "destructive",
            description: "Failed to load messages",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || sending) return;

    const content = messageInput.trim();
    setMessageInput("");
    setSending(true);

    try {
      const newMessage = await kyInstance
        .post(`/api/dating/matches/${matchId}/messages`, {
          json: { content },
        })
        .json<Message>();

      // Convert date string to Date object
      const processedMessage = {
        ...newMessage,
        createdAt: new Date(newMessage.createdAt),
      };

      setMessages((prev) => [...prev, processedMessage]);
      scrollToBottom();
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        description: "Failed to send message",
      });
      setMessageInput(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadMoreMessages = () => {
    if (nextCursor && !loading) {
      fetchMessages(nextCursor);
    }
  };

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
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">
              {otherUser.displayName}
            </h1>
            <p className="text-xs text-gray-500">@{otherUser.username}</p>
          </div>
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

      {/* Insights Panel */}
      {showInsights && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <MatchInsights matchId={matchId} />
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {loading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <>
              {nextCursor && (
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMoreMessages}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load older messages"}
                  </Button>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.isFromMe ? "justify-end" : "justify-start"
                  }`}
                >
                  {!message.isFromMe && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={
                          message.sender.avatarUrl ||
                          "/assets/avatar-placeholder.png"
                        }
                        alt={message.sender.displayName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.isFromMe
                        ? "bg-purple-500 text-white"
                        : "bg-white text-gray-900 shadow-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isFromMe
                          ? "text-purple-100"
                          : "text-gray-500"
                      }`}
                    >
                      {formatRelativeDate(message.createdAt)}
                      {message.isFromMe && message.read && (
                        <span className="ml-1">✓✓</span>
                      )}
                    </p>
                  </div>
                  {message.isFromMe && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={
                          message.sender.avatarUrl ||
                          "/assets/avatar-placeholder.png"
                        }
                        alt="You"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={1}
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!messageInput.trim() || sending}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

