import { useToast } from "@/components/ui/use-toast";
import { PostsPage } from "@/lib/types";
import { useUploadThing } from "@/lib/uploadthing";
import { UpdateUserProfileValues } from "@/lib/validation";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  updateUserPassword,
  updateUserEmail,
  updateUserProfile,
} from "./actions";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

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

      const queryFilter: QueryFilters = {
        queryKey: ["post-feed"],
      };

      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          if (!oldData) return;

          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              posts: page.posts.map((post) => {
                if (post.user.id === updatedUser.id) {
                  return {
                    ...post,
                    user: {
                      ...updatedUser,
                      avatarUrl: newAvatarUrl || updatedUser.avatarUrl,
                    },
                  };
                }
                return post;
              }),
            })),
          };
        },
      );

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
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await fetch("/api/users/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
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
