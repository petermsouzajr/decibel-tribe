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
import DislikeButton from "./DislikeButton";

interface PostProps {
  post: PostData;
}

export default function Post({ post }: PostProps) {
  const { user } = useSession();

  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const contentRef = useRef(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const checkContentSize = () => {
    if (contentRef.current) {
      // Maximum allowable height (90% of the viewport height)
      const maxHeight = window.innerHeight * 0.9;
      // Set whether the "Show More" link should be displayed
      setShowToggle(
        (contentRef.current as HTMLElement).scrollHeight > maxHeight,
      );
    }
  };

  useEffect(() => {
    // Check content size initially and on window resize
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
            </Link>
          </div>
          {post.user.id === user.id ? (
            <PostMoreButton
              post={post}
              className="transition-opacity group-hover/post:opacity-100"
            />
          ) : (
            <FollowButton
              userId={post.user.id}
              initialState={{
                followers: post.user._count.followers,
                isFollowedByUser: post.user.followers.some(
                  ({ followerId }) => followerId === user.id,
                ),
              }}
            />
          )}
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
        </div>
        <BookmarkButton
          postId={post.id}
          initialState={{
            isBookmarkedByUser: post.bookmarks.some(
              (bookmark) => bookmark.userId === user.id,
            ),
          }}
        />
      </div>

      {showComments && <Comments post={post} />}
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

  const handleImageClick = () => {
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
          className="mx-auto size-fit max-h-[30rem] cursor-pointer rounded-2xl"
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
      onClick={onClose} // Close modal when the background is clicked
    >
      <button
        className="absolute right-4 top-4 rounded-full bg-black bg-opacity-60 p-2 text-white hover:bg-opacity-80"
        onClick={onClose}
      >
        <X size={24} />
      </button>
      <Image
        src={mediaUrl}
        alt="Full View"
        className="max-h-full max-w-full"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
      />
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
