import { useSession } from "@/app/(main)/SessionProvider";
import kyInstance from "@/lib/ky";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type BlockedUser = { id: string; username: string; displayName: string; avatarUrl: string | null };

export function useBlockStatus(targetUserId: string) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const viewerId = user?.id;

  const { data } = useQuery({
    queryKey: ["blocked-users", viewerId],
    enabled: !!viewerId,
    queryFn: async () =>
      kyInstance
        .get(`/api/users/${viewerId}/blocks`)
        .json<{ items: BlockedUser[] }>()
        .then((res) => res.items),
  });

  const isBlocked = !!data?.some((u) => u.id === targetUserId);

  const addToCache = (u: BlockedUser) => {
    queryClient.setQueryData<BlockedUser[] | { items: BlockedUser[] } | undefined>(
      ["blocked-users", viewerId],
      (prev) => {
        if (!prev) return [u] as unknown as any;
        if (Array.isArray(prev)) {
          if (prev.some((x) => x.id === u.id)) return prev;
          return [...prev, u];
        }
        const items = prev.items ?? [];
        if (items.some((x) => x.id === u.id)) return prev;
        return { items: [...items, u] } as any;
      },
    );
  };

  const removeFromCache = (id: string) => {
    queryClient.setQueryData<BlockedUser[] | { items: BlockedUser[] } | undefined>(
      ["blocked-users", viewerId],
      (prev) => {
        if (!prev) return prev;
        if (Array.isArray(prev)) return prev.filter((x) => x.id !== id) as any;
        return { items: (prev.items ?? []).filter((x) => x.id !== id) } as any;
      },
    );
  };

  const block = useMutation({
    mutationFn: async () => kyInstance.post(`/api/users/${targetUserId}/blocks`).json<any>().catch(() => undefined),
    onSuccess: () => {
      // Opportunistically add target to cache with minimal fields
      addToCache({ id: targetUserId, username: "", displayName: "", avatarUrl: null });
    },
  });

  const unblock = useMutation({
    mutationFn: async () => kyInstance.delete(`/api/users/${targetUserId}/blocks`).json<any>().catch(() => undefined),
    onSuccess: () => removeFromCache(targetUserId),
  });

  return { isBlocked, block, unblock };
}


