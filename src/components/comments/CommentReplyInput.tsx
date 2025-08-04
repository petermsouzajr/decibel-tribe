import { CommentData } from "@/lib/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ImageIcon, Loader2, SendHorizonal, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import useCommentImageUpload from "./useCommentImageUpload";
import { useReplyToCommentMutation } from "./mutations";

interface CommentReplyInputProps {
  comment: CommentData;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CommentReplyInput({
  comment,
  onCancel,
  onSuccess,
}: CommentReplyInputProps) {
  const [content, setContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const {
    startUpload,
    images,
    isUploading,
    uploadProgress,
    removeImage,
    reset: resetImages,
  } = useCommentImageUpload();
  const replyMutation = useReplyToCommentMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) return;
    
    const mediaIds = images.map((img) => img.mediaId).filter(Boolean) as string[];
    
    replyMutation.mutate(
      {
        commentId: comment.id,
        content: content.trim(),
        mediaIds,
      },
      {
        onSuccess: () => {
          setContent("");
          resetImages();
          onSuccess();
        },
      },
    );
  };

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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder={`Reply to ${comment.user.displayName}...`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={replyMutation.isPending || isUploading}
          className="flex-1"
        />
        
        {/* Image Upload Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImageUpload}
          disabled={replyMutation.isPending || isUploading}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Add image to reply"
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
          size="sm"
          disabled={(!content.trim() && images.length === 0) || replyMutation.isPending || isUploading}
        >
          {replyMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={replyMutation.isPending || isUploading}
        >
          <X className="h-4 w-4" />
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
                alt="Reply image preview"
                width={80}
                height={80}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => removeImage(image.file.name)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
} 