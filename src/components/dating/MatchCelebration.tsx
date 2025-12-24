"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";

interface MatchProfile {
  id: string;
  username: string;
  displayName: string;
  primaryPhotoUrl: string | null;
  age?: number | null;
  height?: number | null;
  gender?: string | null;
  sexualOrientation?: string | null;
  coronavirusVaccinated?: string | null;
  religion?: string | null;
  bio?: string;
  hasKids?: boolean | null;
  smokes?: string | null;
  drinks?: string | null;
  activity?: string | null;
  education?: string | null;
  job?: string | null;
  pets?: string[];
  interests?: string[];
}

interface MatchCelebrationProps {
  user: MatchProfile;
  onClose: () => void;
  onViewMatch: () => void;
}

export default function MatchCelebration({
  user,
  onClose,
  onViewMatch,
}: MatchCelebrationProps) {
  const photoUrl = user.primaryPhotoUrl || "/assets/avatar-placeholder.png";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            It&apos;s a Match! 🎉
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-6">
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500">
              <Image
                src={photoUrl}
                alt={user.displayName}
                fill
                className="object-cover"
              />
            </div>
            <Heart className="w-12 h-12 text-pink-500 fill-pink-500" />
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500">
              <Image
                src={photoUrl}
                alt="You"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">
            You and {user.displayName} liked each other!
          </p>
          <p className="text-gray-600 mb-6">
            Start a conversation and see where it goes.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={onViewMatch}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send a Message
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Keep Browsing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


