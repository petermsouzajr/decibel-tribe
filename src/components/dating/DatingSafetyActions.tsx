"use client";

import { useState } from "react";
import { MoreVertical, Flag, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReportModal from "@/components/reports/ReportModal";
import BlockButton from "@/components/BlockButton";
import { useBlockStatus } from "@/hooks/useBlockStatus";

interface DatingSafetyActionsProps {
  userId: string;
  userName: string;
}

export default function DatingSafetyActions({
  userId,
  userName,
}: DatingSafetyActionsProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const { isBlocked } = useBlockStatus(userId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowReportModal(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Flag className="w-4 h-4 mr-2" />
            Report {userName}
          </DropdownMenuItem>
          <div className="border-t my-1" />
          <div className="px-2 py-1.5">
            <BlockButton userId={userId} initiallyBlocked={isBlocked} />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="profile"
        targetId={userId}
      />
    </>
  );
}


