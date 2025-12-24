"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LocationDialogContent from "./LocationDialogContent";
import { ArrowLeft, Filter, Heart, History, MapPin, MessageCircle, Settings, Shield } from "lucide-react";

type DatingHeaderProps = {
  title?: string;
  /** Show a "Back" button that returns to /dating (deck) */
  showBack?: boolean;
  /** Override back behavior (defaults to router.push("/dating")) */
  onBack?: () => void;
  /** Show a Filters button (used on deck) */
  showFiltersButton?: boolean;
  onOpenFilters?: () => void;
  /** Called after location is updated (e.g. to refetch deck) */
  onLocationUpdated?: () => void;
};

export default function DatingHeader({
  title = "Dating Tribe",
  showBack,
  onBack,
  showFiltersButton = true,
  onOpenFilters,
  onLocationUpdated,
}: DatingHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);

  const isDarkHeader = pathname?.startsWith("/dating/filters");

  const shouldShowBack = useMemo(() => {
    if (typeof showBack === "boolean") return showBack;
    return pathname !== "/dating";
  }, [pathname, showBack]);

  const isOnMatches = pathname?.startsWith("/dating/matches");
  const isOnFilters = pathname?.startsWith("/dating/filters");

  const openFilters = () => {
    if (onOpenFilters) {
      onOpenFilters();
      return;
    }
    router.push("/dating/filters");
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4 mt-2">
        <div className="flex items-center gap-2 min-w-0">
          {shouldShowBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => (onBack ? onBack() : router.push("/dating"))}
              className={`flex items-center gap-2 mr-4 ${
                isDarkHeader
                  ? "bg-gray-900 border-gray-700 text-gray-100 hover:bg-gray-800"
                  : ""
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dating
            </Button>
          )}
          <h1 className={`text-2xl sm:text-3xl font-bold truncate ${isDarkHeader ? "text-white" : "text-gray-900"}`}>
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!!isOnMatches}
            onClick={() => router.push("/dating/matches")}
            className="flex items-center gap-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-60"
          >
            <MessageCircle className="w-4 h-4" />
            Matches
          </Button>
          
          {showFiltersButton && (
            <Button
              variant="outline"
              size="sm"
              disabled={!!isOnFilters}
              onClick={openFilters}
              className="flex items-center gap-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-60"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          )}
          
          

          {/* Settings Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full flex-shrink-0 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                aria-label="Dating menu"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push("/dating/likes-you")}>
                <Heart className="mr-2 h-4 w-4" />
                Likes You
              </DropdownMenuItem>

              {/* Location moved into the dropdown */}
              <DropdownMenuItem onClick={() => setShowLocationDialog(true)}>
                <MapPin className="mr-2 h-4 w-4" />
                Location
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dating/profile")}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dating/history")}>
                <History className="mr-2 h-4 w-4" />
                History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSafetyTips(true)}>
                <Shield className="mr-2 h-4 w-4" />
                Safety Tips
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-md bg-gray-950 border-gray-800">
          <LocationDialogContent
            onClose={() => setShowLocationDialog(false)}
            onUpdate={() => {
              onLocationUpdated?.();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Safety Tips Dialog (dark, consistent with dating modals) */}
      <Dialog open={showSafetyTips} onOpenChange={setShowSafetyTips}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-950 border-gray-800">
          <div className="space-y-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Dating Safety Tips</h2>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Your safety is our priority. Follow these guidelines to stay safe while dating.
            </p>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-white mb-2">Meeting in Person</h3>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>• Meet in a public place for your first few dates</li>
                <li>• Tell a friend or family member where you&apos;re going and who you&apos;re meeting</li>
                <li>• Keep your phone charged and with you</li>
                <li>• Trust your instincts — if something feels off, leave</li>
                <li>• Don&apos;t share your home address until you&apos;re comfortable</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-white mb-2">Online Safety</h3>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>• Never share financial information or send money</li>
                <li>• Be cautious of users who ask for personal information too quickly</li>
                <li>• Report suspicious behavior or fake profiles</li>
                <li>• Keep conversations on the platform until you&apos;re comfortable</li>
              </ul>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-white mb-2">Red Flags</h3>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>• Asking for money or financial help</li>
                <li>• Pressuring you to meet in private or isolated locations</li>
                <li>• Aggressive or threatening language</li>
                <li>• Asking for explicit photos or content</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

