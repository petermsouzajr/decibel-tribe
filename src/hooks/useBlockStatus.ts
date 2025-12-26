import { useSession } from "@/app/(main)/SessionProvider";
import kyInstance from "@/lib/ky";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type BlockedUser = { id: string; username: string; displayName: string; avatarUrl: string | null };

export function useBlockStatus(targetUserId: string) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const viewerId = user?.id;

  const normalize = (val: unknown): BlockedUser[] => {
    if (Array.isArray(val)) return val as BlockedUser[];
    if (val && typeof val === "object" && Array.isArray((val as any).items)) {
      return (val as any).items as BlockedUser[];
    }
    return [];
  };

  const { data } = useQuery({
    queryKey: ["blocked-users", viewerId],
    enabled: !!viewerId,
    queryFn: async () =>
      kyInstance
        .get(`/api/users/${viewerId}/blocks`)
        .json<{ items: BlockedUser[] }>()
        .then((res) => res.items),
  });

  const blockedUsers = normalize(data);
  const isBlocked = blockedUsers.some((u) => u.id === targetUserId);

  const addToCache = (u: BlockedUser) => {
    queryClient.setQueryData<BlockedUser[] | undefined>(
      ["blocked-users", viewerId],
      (prev) => {
        const list = normalize(prev);
        if (list.some((x) => x.id === u.id)) return list;
        return [...list, u];
      },
    );
  };

  const removeFromCache = (id: string) => {
    queryClient.setQueryData<BlockedUser[] | undefined>(
      ["blocked-users", viewerId],
      (prev) => {
        const list = normalize(prev);
        return list.filter((x) => x.id !== id);
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


