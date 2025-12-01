"use client";

import { useState, useEffect } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import kyInstance from "@/lib/ky";
import { Loader2, X, Star, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface DatingPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  createdAt: Date;
}

const MAX_PHOTOS = 5;
const MIN_PHOTOS = 1;

export default function PhotoManager() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<DatingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("datingPhoto", {
    onClientUploadComplete: async (res) => {
      if (res && res[0]?.serverData) {
        await fetchPhotos();
        toast({
          description: "Photo uploaded successfully",
        });
      }
    },
    onUploadError: (error) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to upload photo",
      });
    },
  });

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await kyInstance
        .get("/api/dating/photos")
        .json<{ photos: DatingPhoto[] }>();

      const processedPhotos = response.photos.map((photo) => ({
        ...photo,
        createdAt: new Date(photo.createdAt),
      }));

      setPhotos(processedPhotos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast({
        variant: "destructive",
        description: "Failed to load photos",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    if (photos.length >= MAX_PHOTOS) {
      toast({
        variant: "destructive",
        description: `Maximum ${MAX_PHOTOS} photos allowed`,
      });
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        startUpload([file]);
      }
    };
    input.click();
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      setSettingPrimary(photoId);
      await kyInstance.put("/api/dating/photos", {
        json: { photoId, isPrimary: true },
      });

      await fetchPhotos();
      toast({
        description: "Primary photo updated",
      });
    } catch (error: any) {
      console.error("Error setting primary photo:", error);
      toast({
        variant: "destructive",
        description: "Failed to set primary photo",
      });
    } finally {
      setSettingPrimary(null);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (photos.length <= MIN_PHOTOS) {
      toast({
        variant: "destructive",
        description: `Minimum ${MIN_PHOTOS} photo required for dating`,
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    try {
      setDeleting(photoId);
      await kyInstance.delete(`/api/dating/photos?photoId=${photoId}`);

      await fetchPhotos();
      toast({
        description: "Photo deleted",
      });
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      const errorData = await error.response?.json().catch(() => ({}));
      toast({
        variant: "destructive",
        description: errorData.error || "Failed to delete photo",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dating Photos</h3>
          <p className="text-sm text-gray-600">
            {photos.length}/{MAX_PHOTOS} photos
            {photos.length < MIN_PHOTOS && (
              <span className="text-red-500 ml-2">
                (Minimum {MIN_PHOTOS} required)
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={handleUpload}
          disabled={isUploading || photos.length >= MAX_PHOTOS}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Photo
            </>
          )}
        </Button>
      </div>

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-600 mb-4">No photos yet</p>
          <Button onClick={handleUpload} disabled={isUploading}>
            Upload Your First Photo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group"
            >
              <Image
                src={photo.url}
                alt="Dating photo"
                fill
                className="object-cover"
                loading="lazy"
              />
              {photo.isPrimary && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" />
                  Primary
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!photo.isPrimary && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(photo.id)}
                    disabled={settingPrimary === photo.id}
                  >
                    {settingPrimary === photo.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-1" />
                        Set Primary
                      </>
                    )}
                  </Button>
                )}
                {photos.length > MIN_PHOTOS && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(photo.id)}
                    disabled={deleting === photo.id}
                  >
                    {deleting === photo.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-purple-500 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              ) : (
                <Plus className="w-8 h-8 text-gray-400" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

