"use client";
import { validateRequest } from "@/auth";
import Post from "@/components/posts/Post";
import kyInstance from "@/lib/ky";
import { GroupMembershipData, PostData } from "@/lib/types";
import { notFound, redirect, useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Link from "next/link";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import {
  Loader2,
  LucideExternalLink,
  MoreHorizontal,
  Trash2,
  UserPlus,
} from "lucide-react";
import GroupList from "../GroupList";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddUserModal from "./AddUserModal";
import DeleteGroupModal from "./DeleteGroupModal";
import LeaveGroupModal from "./LeaveGroupModal";

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface PageProps {
  params: { groupId: string };
}

export default function GroupPage({ params: { groupId } }: PageProps) {
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const { data: groupData, status: groupStatus } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () =>
      kyInstance.get(`/api/groups/${groupId}`).json<{
        [x: string]: string | undefined;
        id: string;
        name: string;
        description?: string;
        ownerId: string;
      }>(),
    enabled: !!groupId,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: postsStatus,
  } = useInfiniteQuery({
    queryKey: ["group-posts", groupId],
    queryFn: ({ pageParam }: { pageParam?: string | null }) =>
      kyInstance
        .get(`/api/groups/${groupId}/posts`, {
          searchParams: pageParam ? { cursor: pageParam } : {},
        })
        .json<{ posts: PostData[]; nextCursor: string | null }>(),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!groupId,
    initialPageParam: null,
  });

  const { data: userMembershipData } = useQuery({
    queryKey: ["group-member", groupId],
    queryFn: () =>
      kyInstance
        .get(`/api/groups/${groupId}/member`)
        .json<GroupMembershipData | null>(),
    enabled: !!groupId, // Ensure this runs only when `groupId` is available
  });

  useEffect(() => {
    if (groupStatus === "error") {
      redirect("/groups");
    }
  }, [groupStatus]);

  if (groupStatus === "pending") {
    return <p>Loading group...</p>;
  }

  if (groupStatus === "error") {
    return <p>Group not found.</p>;
  }

  const posts = data?.pages.flatMap((page) => page.posts) || [];
  const isMember = userMembershipData?.acceptedInvite;
  const isAdmin = userMembershipData?.role === "ADMIN";
  const isOwner = userMembershipData?.userId === groupData.ownerId;

  const handleAcceptInvite = async () => {
    try {
      await kyInstance.post(`/api/groups/${groupId}/accept-invite`);
      router.push(`/groups/${groupId}`);
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  };

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="flex items-center space-x-2">
          <Link href="/groups">← Back to Groups</Link>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{groupData.name}</h1>
            {isMember ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreHorizontal className="size-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {(isAdmin || isOwner) && (
                    <DropdownMenuItem onClick={() => setShowAddUserModal(true)}>
                      <span className="flex items-center gap-3">
                        <UserPlus className="size-4" />
                        Add User
                      </span>
                    </DropdownMenuItem>
                  )}
                  {isOwner && (
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                      <span className="flex items-center gap-3 text-destructive">
                        <Trash2 className="size-4" />
                        Delete
                      </span>
                    </DropdownMenuItem>
                  )}
                  {!isOwner && (
                    <DropdownMenuItem onClick={() => setShowLeaveDialog(true)}>
                      <span className="flex items-center gap-3 text-muted-foreground">
                        <LucideExternalLink className="size-4" />
                        Unjoin Group
                      </span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                onClick={handleAcceptInvite}
                className="ml-4"
              >
                Accept Invite
              </Button>
            )}
          </div>

          {groupData.description && (
            <p className="text-center text-muted-foreground">
              {groupData.description}
            </p>
          )}
        </div>
        {isMember && (
          <InfiniteScrollContainer
            className="space-y-5"
            onBottomReached={() => hasNextPage && fetchNextPage()}
          >
            {posts.map((post) => (
              <Post key={post.id} post={post} />
            ))}
            {isFetchingNextPage && (
              <Loader2 className="mx-auto my-3 animate-spin" />
            )}
          </InfiniteScrollContainer>
        )}
        {!isMember && (
          <p className="text-center text-muted-foreground">
            You have been invited to join this group. Please accept the invite
            to view posts.
          </p>
        )}
      </div>
      <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
        <GroupList />
      </div>
      {/* AddUserModal */}
      <AddUserModal
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
        groupId={groupId}
      />

      {/* DeleteGroupModal */}
      <DeleteGroupModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        groupId={groupId}
        groupName={groupData.name}
      />

      {/* LeaveGroupModal */}
      <LeaveGroupModal
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        groupId={groupId}
        groupName={groupData.name}
      />
    </main>
  );
}
