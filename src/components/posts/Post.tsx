"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { PostData } from "@/lib/types";
import { cn, formatRelativeDate } from "@/lib/utils";
import { Media } from "@prisma/client";
import { MessageSquare, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Comments from "../comments/Comments";
import Linkify from "../Linkify";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import BookmarkButton from "./BookmarkButton";
import LikeButton from "./LikeButton";
import PostMoreButton from "./PostMoreButton";
import FollowButton from "../FollowButton";
import ReportButton from "@/components/reports/ReportButton";
import BlockButton from "../BlockButton";
import DislikeButton from "./DislikeButton";
import { Repeat } from "lucide-react";
import PostDialog from "@/app/(main)/PostDialogue";

interface PostProps {
  post: PostData;
}

export default function Post({ post }: PostProps) {
  const { user } = useSession();
  const [repostTarget, setRepostTarget] = useState<PostData | null>(null);

  const [showComments, setShowComments] = useState(false);
  const [showEmbeddedComments, setShowEmbeddedComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const contentRef = useRef(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const checkContentSize = () => {
    if (contentRef.current) {
      const maxHeight = window.innerHeight * 0.9;
      setShowToggle(
        (contentRef.current as HTMLElement).scrollHeight > maxHeight,
      );
    }
  };

  useEffect(() => {
    checkContentSize();
    window.addEventListener("resize", checkContentSize);
    return () => {
      window.removeEventListener("resize", checkContentSize);
    };
  }, []);

  return (
    <article className="group/post space-y-3 rounded-2xl border-2 bg-card p-3 shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="flex w-full flex-wrap gap-3">
          <UserTooltip user={post.user}>
            <Link href={`/users/${post.user.username}`}>
              <UserAvatar avatarUrl={post.user.avatarUrl} />
            </Link>
          </UserTooltip>
          <div className="min-w-0 flex-1">
            <UserTooltip user={post.user}>
              <Link
                href={`/users/${post.user.username}`}
                className="block font-medium hover:underline"
              >
                <div className="flex w-full flex-wrap items-center">
                  <span className="max-w-[75%] flex-shrink truncate">
                    {post.user.displayName}
                  </span>
                  <span className="max-w-[25%] flex-shrink truncate pl-2 text-muted-foreground">
                    @{post.user.username}
                  </span>
                  <span className="truncate pl-2 text-sm hover:underline">
                    {post.user.bio}
                  </span>
                </div>
              </Link>
            </UserTooltip>
            <Link
              href={`/posts/${post.id}`}
              className="block text-sm text-muted-foreground hover:underline"
              suppressHydrationWarning
            >
              {formatRelativeDate(post.createdAt)}
              {post.updatedAt &&
                post.updatedAt.getTime() >
                  post.createdAt.getTime() + 1000 * 60 && (
                  <span className="pl-1 text-xs">(Edited)</span>
                )}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {post.user.id !== user.id && (
              <FollowButton
                userId={post.user.id}
                initialState={{
                  followers: post.user._count.followers,
                  isFollowedByUser:
                    post.user.followers?.some(
                      (follower) => follower.followerId === user.id,
                    ) ?? false,
                }}
              />
            )}
            <PostMoreButton
              post={post}
              className="transition-opacity group-hover/post:opacity-100"
            />
          </div>
        </div>
      </div>

      {post.content && (
        <div
          className="cursor-pointer"
          onClick={() => (window.location.href = `/posts/${post.id}`)}
        >
          <Linkify>
            <div
              ref={contentRef}
              className={`whitespace-pre-line break-words transition-all duration-300 ${
                isExpanded ? "" : "overflow-hidden"
              }`}
            >
              {isExpanded
                ? post.content
                : `${post.content.substring(0, 300)}${post.content.length > 300 ? "..." : ""}`}
            </div>
          </Linkify>
        </div>
      )}

      {post.content.length > 300 && (
        <div
          className="cursor-pointer text-center text-sm text-primary"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand();
          }}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </div>
      )}

      {!!post.attachments.length && (
        <div className="pb-3 pt-3">
          <MediaPreviews attachments={post.attachments} />
        </div>
      )}

     

      {post.sharedFrom && (
        <div className="rounded-lg border-2 border-muted-foreground bg-card p-3">
          <div className="flex gap-2 mb-2">
            <UserTooltip user={post.sharedFrom.user}>
              <Link href={`/users/${post.sharedFrom.user.username}`}>
                <UserAvatar avatarUrl={post.sharedFrom.user.avatarUrl} />
              </Link>
            </UserTooltip>
            <div className="min-w-0 flex-1">
              <UserTooltip user={post.sharedFrom.user}>
                <Link href={`/users/${post.sharedFrom.user.username}`} className="block font-medium hover:underline">
                  <div className="flex w-full flex-wrap items-center">
                    <span className="max-w-[75%] flex-shrink truncate">
                      {post.sharedFrom.user.displayName}
                    </span>
                    <span className="max-w-[25%] flex-shrink truncate pl-2 text-muted-foreground">
                      @{post.sharedFrom.user.username}
                    </span>
                  </div>
                </Link>
              </UserTooltip>
              <Link
                href={`/posts/${post.sharedFrom.id}`}
                className="block text-sm text-muted-foreground hover:underline"
                suppressHydrationWarning
              >
                {formatRelativeDate(post.sharedFrom.createdAt)}
              </Link>
            </div>
          </div>
          <Linkify>
            <div className="whitespace-pre-wrap break-words">{post.sharedFrom.content}</div>
          </Linkify>
          {!!post.sharedFrom.attachments.length && (
            <div className="pt-3">
              <MediaPreviews attachments={post.sharedFrom.attachments as unknown as Media[]} />
            </div>
          )}
          {/* If the embedded post is itself a share, render a compact nested share */}
          {post.sharedFrom.sharedFrom && (
            <div className="mt-3 rounded-lg border border-muted-foreground bg-muted/5 p-3">
              <div className="flex gap-2 mb-2">
                <UserTooltip user={post.sharedFrom.sharedFrom.user}>
                  <Link href={`/users/${post.sharedFrom.sharedFrom.user.username}`}>
                    <UserAvatar avatarUrl={post.sharedFrom.sharedFrom.user.avatarUrl} />
                  </Link>
                </UserTooltip>
                <div className="min-w-0 flex-1">
                  <UserTooltip user={post.sharedFrom.sharedFrom.user}>
                    <Link href={`/users/${post.sharedFrom.sharedFrom.user.username}`} className="block font-medium hover:underline">
                      <div className="flex w-full flex-wrap items-center">
                        <span className="max-w-[75%] flex-shrink truncate">
                          {post.sharedFrom.sharedFrom.user.displayName}
                        </span>
                        <span className="max-w-[25%] flex-shrink truncate pl-2 text-muted-foreground">
                          @{post.sharedFrom.sharedFrom.user.username}
                        </span>
                      </div>
                    </Link>
                  </UserTooltip>
                  <Link href={`/posts/${post.sharedFrom.sharedFrom.id}`} className="block text-sm text-muted-foreground hover:underline" suppressHydrationWarning>
                    {formatRelativeDate(post.sharedFrom.sharedFrom.createdAt)}
                  </Link>
                </div>
              </div>
              <Linkify>
                <div className="whitespace-pre-wrap break-words">{post.sharedFrom.sharedFrom.content}</div>
              </Linkify>
              {!!post.sharedFrom.sharedFrom.attachments.length && (
                <div className="pt-3">
                  <MediaPreviews attachments={post.sharedFrom.sharedFrom.attachments as unknown as Media[]} />
                </div>
              )}
              <div className="flex justify-between">
                <div className="mt-3 flex items-center gap-5">
                  <LikeButton
                    postId={post.sharedFrom.sharedFrom.id}
                    initialState={{
                      likes: post.sharedFrom.sharedFrom._count.likes,
                      isLikedByUser: (post.sharedFrom.sharedFrom.likes ?? []).some((l) => l.userId === user.id),
                    }}
                  />
                  <CommentButton
                    post={post.sharedFrom.sharedFrom as PostData}
                    onClick={() => setShowEmbeddedComments((v) => !v)}
                  />
                  <DislikeButton
                    postId={post.sharedFrom.sharedFrom.id}
                    initialState={{
                      dislikes: post.sharedFrom.sharedFrom._count.dislikes,
                      isDislikedByUser: (post.sharedFrom.sharedFrom.dislikes ?? []).some((d) => d.userId === user.id),
                    }}
                  />
                  <button
                    className="flex items-center gap-2 text-foreground"
                    onClick={() => setRepostTarget(post.sharedFrom!.sharedFrom as PostData)}
                    aria-label="Repost"
                  >
                    <Repeat className="h-5 w-5" />
                    <span className="text-xs font-medium tabular-nums">{post.sharedFrom.sharedFrom.sharedCount ?? 0}</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <BookmarkButton
                    postId={post.sharedFrom.sharedFrom.id}
                    initialState={{ isBookmarkedByUser: false }}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-between">
          <div className="mt-3 flex items-center gap-5">
            <LikeButton
              postId={post.sharedFrom.id}
                initialState={{
                  likes: post.sharedFrom._count.likes,
                  isLikedByUser: (post.sharedFrom.likes ?? []).some((l) => l.userId === user.id),
                }}
            />
            <CommentButton
              post={post.sharedFrom as PostData}
                onClick={() => setShowEmbeddedComments((v) => !v)}
            />
            <DislikeButton
              postId={post.sharedFrom.id}
                initialState={{
                  dislikes: post.sharedFrom._count.dislikes,
                  isDislikedByUser: (post.sharedFrom.dislikes ?? []).some((d) => d.userId === user.id),
                }}
            />
            {/* Repost for the embedded post (post.sharedFrom). This remains enabled. */}
            <button
              className="flex items-center gap-2 text-foreground"
              onClick={() => setRepostTarget(post.sharedFrom as PostData)}
              aria-label="Repost"
            >
              <Repeat className="h-5 w-5" />
              <span className="text-xs font-medium tabular-nums">{post.sharedFrom.sharedCount ?? 0}</span>
            </button>
            </div>
            <div className="flex items-center gap-3">
            <BookmarkButton
              postId={post.sharedFrom.id}
                initialState={{ isBookmarkedByUser: false }}
            />
            </div>
          </div>
          {showEmbeddedComments && (
            <div className="mt-2">
              <Comments post={post.sharedFrom as PostData} />
            </div>
          )}
        </div>
      )}

<hr className="text-muted-foreground" />
      <div className="flex justify-between">
        <div className="size -2 flex items-center gap-5">
          <LikeButton
            postId={post.id}
            initialState={{
              likes: post._count.likes,
              isLikedByUser: post.likes.some((like) => like.userId === user.id),
            }}
          />
          <CommentButton
            post={post}
            onClick={() => setShowComments(!showComments)}
          />
            <DislikeButton
            postId={post.id}
            initialState={{
              dislikes: post._count.dislikes,
              isDislikedByUser: post.dislikes.some(
                (dislike) => dislike.userId === user.id,
              ),
            }}
          />
            {/* Disable resharing if this post is itself a share of a share (level C). */}
            <button
              className="flex items-center gap-2 text-foreground disabled:opacity-50"
              onClick={() => setRepostTarget(post)}
              aria-label="Repost"
              disabled={!!(post.sharedFrom && post.sharedFrom.sharedFrom)}
            >
              <Repeat className="h-5 w-5" />
              <span className="text-xs font-medium tabular-nums">{post.sharedCount ?? 0}</span>
            </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Kept report action in dots menu; optional inline flag here if desired */}
          <BookmarkButton
            postId={post.id}
            initialState={{
              isBookmarkedByUser: post.bookmarks.some(
                (bookmark) => bookmark.userId === user.id,
              ),
            }}
          />
        </div>
      </div>

      {showComments && <Comments post={post} />}
      <PostDialog
        open={!!repostTarget}
        onOpenChange={(o) => {
          if (!o) setRepostTarget(null);
        }}
        quote={`@${(repostTarget ?? post).user.username} • ${formatRelativeDate((repostTarget ?? post).createdAt)}\n\n${(repostTarget ?? post).content}`}
        sharedFromId={(repostTarget ?? post).id}
      />
    </article>
  );
}

interface MediaPreviewsProps {
  attachments: Media[];
}

function MediaPreviews({ attachments }: MediaPreviewsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        attachments.length > 1 && "sm:grid sm:grid-cols-2",
      )}
    >
      {attachments.map((m) => (
        <MediaPreview key={m.id} media={m} />
      ))}
    </div>
  );
}

interface MediaPreviewProps {
  media: Media;
}

function MediaPreview({ media }: MediaPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = (event: any) => {
    event.preventDefault();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (media.type === "IMAGE") {
    return (
      <div>
        <Image
          src={media.url}
          alt="Attachment"
          width={500}
          height={500}
          className="mx-auto size-fit max-h-[30rem] cursor-pointer rounded-2xl"
          onClick={handleImageClick}
        />
        {isModalOpen && (
          <ImageModal mediaUrl={media.url} onClose={closeModal} />
        )}
      </div>
    );
  }

  if (media.type === "VIDEO") {
    return (
      <div>
        <video
          src={media.url}
          controls
          width={500}
          height={500}
          className="mx-auto size-fit max-h-[30rem] cursor-pointer rounded-2xl"
          onClick={handleImageClick}
        />
        {isModalOpen && (
          <ImageModal mediaUrl={media.url} onClose={closeModal} />
        )}
      </div>
    );
  }

  return <p className="text-destructive">Unsupported media type</p>;
}

interface ImageModalProps {
  mediaUrl: string;
  onClose: () => void;
}

function ImageModal({ mediaUrl, onClose }: ImageModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 rounded-full bg-black bg-opacity-60 p-2 text-white hover:bg-opacity-80"
        onClick={onClose}
      >
        <X size={24} />
      </button>
      {!mediaUrl.includes("img") ? (
        <video
          src={mediaUrl}
          controls
          width={500}
          height={500}
          className="max-h-full max-w-full"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <Image
          src={mediaUrl}
          alt="Full View"
          className="max-h-full max-w-full"
          onClick={(e) => e.stopPropagation()}
          width={500}
          height={500}
        />
      )}
    </div>
  );
}

interface CommentButtonProps {
  post: PostData;
  onClick: () => void;
}

function CommentButton({ post, onClick }: CommentButtonProps) {
  return (
    <button onClick={onClick} className="flex items-center gap-2">
      <MessageSquare className="size-4" />
      <span className="text-xs font-medium tabular-nums">
        {post._count.comments}{" "}
      </span>
    </button>
  );
}
