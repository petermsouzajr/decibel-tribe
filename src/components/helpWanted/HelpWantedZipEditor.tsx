"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HelpWantedZipEditor({ zipCode }: { zipCode: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(zipCode ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ zipCode: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update zip code");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update zip code");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setValue(zipCode ?? "");
          setError(null);
          setOpen(true);
        }}
        className="flex items-center gap-2 hover:underline"
        aria-label="Edit your zip code"
      >
        <span>Help wanted near: {zipCode}</span>
        <PencilIcon className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold">Update your zip code</div>
              <div className="text-sm text-muted-foreground">
                Used to show nearby events that match your skills. Not shown publicly.
              </div>
            </div>

            <div className="space-y-2">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Zip code"
              />
              {error ? (
                <div className="text-sm text-destructive">{error}</div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


