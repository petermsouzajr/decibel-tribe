import { useToast } from "@/components/ui/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";

export interface CommentImage {
  file: File;
  mediaId?: string;
  isUploading: boolean;
}

export default function useCommentImageUpload() {
  const { toast } = useToast();
  const [images, setImages] = useState<CommentImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>();

  const { startUpload, isUploading } = useUploadThing("attachment", {
    onBeforeUploadBegin(files) {
      const renamedFiles = files.map((file) => {
        const extension = file.name.split(".").pop();
        return new File(
          [file],
          `comment_image_${crypto.randomUUID()}.${extension}`,
          {
            type: file.type,
          },
        );
      });

      setImages((prev) => [
        ...prev,
        ...renamedFiles.map((file) => ({ file, isUploading: true })),
      ]);

      return renamedFiles;
    },
    onUploadProgress: setUploadProgress,
    onClientUploadComplete(res) {
      setImages((prev) =>
        prev.map((img) => {
          const uploadResult = res.find((r) => r.name === img.file.name);

          if (!uploadResult) return img;

          return {
            ...img,
            mediaId: uploadResult.serverData.mediaId,
            isUploading: false,
          };
        }),
      );
    },
    onUploadError(e) {
      setImages((prev) => prev.filter((img) => !img.isUploading));
      toast({
        variant: "destructive",
        description: e.message,
      });
    },
  });

  function handleStartUpload(files: File[]) {
    if (isUploading) {
      toast({
        variant: "destructive",
        description: "Please wait for the current upload to finish.",
      });
      return;
    }

    startUpload(files);
  }

  function removeImage(fileName: string) {
    setImages((prev) => prev.filter((img) => img.file.name !== fileName));
  }

  function reset() {
    setImages([]);
    setUploadProgress(undefined);
  }

  return {
    startUpload: handleStartUpload,
    images,
    isUploading,
    uploadProgress,
    removeImage,
    reset,
  };
} 