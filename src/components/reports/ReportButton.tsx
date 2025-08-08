'use client';

import { useState } from 'react';
import ReportModal from './ReportModal';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportButtonProps {
  contentType: 'post' | 'comment' | 'message' | 'profile' | 'group' | 'event';
  targetId: string;
  variant?: 'icon' | 'text';
}

export default function ReportButton({ contentType, targetId, variant = 'icon' }: ReportButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === 'text') {
    return (
      <>
        <Button variant="ghost" onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Flag className="h-4 w-4" />
          Report
        </Button>
        <ReportModal isOpen={open} onClose={() => setOpen(false)} contentType={contentType} targetId={targetId} />
      </>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="p-2 rounded hover:bg-gray-100 text-gray-600" aria-label="Report">
        <Flag className="h-4 w-4" />
      </button>
      <ReportModal isOpen={open} onClose={() => setOpen(false)} contentType={contentType} targetId={targetId} />
    </>
  );
}
