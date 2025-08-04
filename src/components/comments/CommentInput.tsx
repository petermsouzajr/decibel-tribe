import { PostData } from "@/lib/types";
import { ImageIcon, Loader2, SendHorizonal, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useSubmitCommentMutation } from "./mutations";
import useCommentImageUpload, { CommentImage } from "./useCommentImageUpload";

interface CommentInputProps {
  post: PostData;
}

export default function CommentInput({ post }: CommentInputProps) {
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useSubmitCommentMutation(post.id);
  const {
    startUpload,
    images,
    isUploading,
    uploadProgress,
    removeImage,
    reset: resetImages,
  } = useCommentImageUpload();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim() && images.length === 0) return;

    const mediaIds = images.map((img) => img.mediaId).filter(Boolean) as string[];

    mutation.mutate(
      {
        post,
        content: input,
        mediaIds,
      },
      {
        onSuccess: () => {
          setInput("");
          resetImages();
        },
      },
    );
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      startUpload(files);
      e.target.value = "";
    }
  };

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="flex w-full items-center gap-2">
        <Input
          placeholder="Write a comment..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        
        {/* Image Upload Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleImageUpload}
          disabled={mutation.isPending || isUploading}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Add image to comment"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          className="sr-only hidden"
          onChange={handleFileSelect}
        />
        
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={(!input.trim() && images.length === 0) || mutation.isPending || isUploading}
        >
          {!mutation.isPending ? (
            <SendHorizonal />
          ) : (
            <Loader2 className="animate-spin" />
          )}
        </Button>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading... {uploadProgress ?? 0}%</span>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.file.name} className="relative">
              <Image
                src={URL.createObjectURL(image.file)}
                alt="Comment image preview"
                width={100}
                height={100}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => removeImage(image.file.name)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
