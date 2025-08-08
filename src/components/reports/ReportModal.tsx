'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'post' | 'comment' | 'message' | 'profile' | 'group' | 'event';
  targetId: string;
}

const REASONS = [
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'VIOLENCE', label: 'Violence' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'FAKE_PROFILE', label: 'Fake profile' },
  { value: 'OTHER', label: 'Other' },
];

export default function ReportModal({ isOpen, onClose, contentType, targetId }: ReportModalProps) {
  const [reason, setReason] = useState<string>('HARASSMENT');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: contentType, targetId, reason, description }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit report');
      }
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        {submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Report received</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Your report has been received. Our team will review it and get back with a resolution as soon as possible.
              </p>
              <p className="text-sm text-foreground">
                Tip: If you don’t like the content, you can temporarily block the user from their profile or via the content menu until we address the report.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={onClose}>OK</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report {contentType}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={submitting}
                >
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Details (optional)</label>
                <textarea
                  className="w-full border rounded px-3 py-2 min-h-[100px]"
                  placeholder="Provide any additional context"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
