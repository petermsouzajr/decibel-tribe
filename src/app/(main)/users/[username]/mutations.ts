import { useToast } from "@/components/ui/use-toast";
import {
  PostsPage,
  PostData,
  UserWithFollowerStatus,
  UserData,
} from "@/lib/types";
import { useUploadThing } from "@/lib/uploadthing";
import { UpdateUserProfileValues } from "@/lib/validation";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "./actions";

export function useUpdateProfileMutation() {
  const { toast } = useToast();

  const router = useRouter();

  const queryClient = useQueryClient();

  const { startUpload: startAvatarUpload } = useUploadThing("avatar");

  const mutation = useMutation({
    mutationFn: async ({
      values,
      avatar,
    }: {
      values: UpdateUserProfileValues;
      avatar?: File;
    }) => {
      return Promise.all([
        updateUserProfile(values),
        avatar && startAvatarUpload([avatar]),
      ]);
    },
    onSuccess: async ([updatedUser, uploadResult]) => {
      const newAvatarUrl = uploadResult?.[0].serverData.avatarUrl;

      const queryKey = ["user-profile", updatedUser.id];
      const queryFilter: QueryFilters = { queryKey };

      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueryData<UserData>(
        queryKey,
        (oldProfileData: UserData | undefined): UserData => {
          const finalUserData = {
            ...(oldProfileData || {}),
            ...updatedUser,
            avatarUrl: newAvatarUrl ?? updatedUser.avatarUrl,
          };
          return finalUserData as UserData;
        },
      );

      // Invalidate post feeds instead of trying to update optimistically with incomplete user data
      await queryClient.invalidateQueries({
        queryKey: ["post-feed", "for-you"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["post-feed", "user", updatedUser.id],
      });
      // Also invalidate the main user profile query to ensure freshness, though setQueryData is often sufficient
      await queryClient.invalidateQueries({ queryKey: queryKey });

      router.refresh();

      toast({
        description: "Profile updated",
      });
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Failed to update profile. Please try again.",
      });
    },
  });

  return mutation;
}

export function useUpdatePasswordMutation() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
      isSettingPassword,
    }: {
      currentPassword: string;
      newPassword: string;
      isSettingPassword: boolean;
    }) => {
      const payload = isSettingPassword
        ? { newPassword }
        : { currentPassword, newPassword };

      const response = await fetch("/api/users/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update password.");
      }

      return response.json();
    },
    onSuccess: () => {
      router.refresh();

      toast({
        description: "Password updated successfully",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        variant: "destructive",
        description: error.message || "Failed to update password.",
      });
    },
  });

  return mutation;
}

export function useUpdateEmailMutation() {
  const { toast } = useToast();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newEmail,
    }: {
      currentPassword: string;
      newEmail: string;
    }) => {
      const response = await fetch("/api/users/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update email.");
      }

      return response.json();
    },
    onSuccess: () => {
      router.refresh();

      toast({
        description: "Email updated successfully",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        variant: "destructive",
        description: error.message || "Failed to update email.",
      });
    },
  });

  return mutation;
}

function updateUserDataInPostPages(
  oldData: InfiniteData<PostsPage, string | null> | undefined,
  updatedUser: UserWithFollowerStatus,
): InfiniteData<PostsPage, string | null> | undefined {
  if (!oldData) return undefined;
  return {
    pageParams: oldData.pageParams,
    pages: oldData.pages.map((page: PostsPage): PostsPage => {
      return {
        nextCursor: page.nextCursor,
        posts: page.posts.map((post: PostData): PostData => {
          if (post.user.id === updatedUser.id) {
            const newUser: UserWithFollowerStatus = {
              ...(post.user as UserWithFollowerStatus),
              ...updatedUser,
              avatarUrl: updatedUser.avatarUrl,
            };
            return {
              ...post,
              user: newUser,
            } as PostData;
          }
          return post as PostData;
        }),
      };
    }),
  };
}
