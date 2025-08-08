"use client";

import kyInstance from "@/lib/ky";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ConfirmModal";
import { useState } from "react";

interface BlockedUsersListProps {
  userId: string;
}

export default function BlockedUsersList({ userId }: BlockedUsersListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["blocked-users", userId],
    queryFn: async () => kyInstance.get(`/api/users/${userId}/blocks`).json<{ items: Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }> }>(),
  });

  const queryClient = useQueryClient();
  const [confirmUser, setConfirmUser] = useState<null | { id: string; username: string; displayName: string }>(null);
  const [loading, setLoading] = useState(false);

  const unblock = useMutation({
    mutationFn: async (blockedId: string) => kyInstance.delete(`/api/users/${blockedId}/blocks`).json<any>(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocked-users", userId] }),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const items = data?.items ?? [];
  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">You haven’t blocked anyone yet.</div>;
  }

  return (
    <>
      <ul className="max-h-64 overflow-auto divide-y">
        {items.map((u) => (
          <li key={u.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-md">
            <Image src={u.avatarUrl ?? "/assets/avatar-placeholder.png"} alt={u.username} width={32} height={32} className="rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{u.displayName}</div>
              <div className="truncate text-sm text-muted-foreground">@{u.username}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setConfirmUser(u)}>
              Unblock
            </Button>
          </li>
        ))}
      </ul>
      <ConfirmModal
        open={!!confirmUser}
        title="Unblock user?"
        description={confirmUser ? `You will see @${confirmUser.username}'s content again. You can block them anytime from their profile or menus.` : ""}
        confirmLabel="Unblock"
        onClose={() => setConfirmUser(null)}
        loading={loading}
        onConfirm={async () => {
          if (!confirmUser) return;
          try {
            setLoading(true);
            await unblock.mutateAsync(confirmUser.id);
          } finally {
            setLoading(false);
            setConfirmUser(null);
          }
        }}
      />
    </>
  );
}


