"use client";
import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useState, useCallback, useEffect, useRef } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  VideoIcon,
  RefreshCw,
  Upload,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Chapter } from "@/lib/generated/prisma";

interface ChapterVideoFormProps {
  initialData: Chapter;
  courseId: string;
  chapterId: string;
}

const formSchema = z.object({
  VideoUrl: z.instanceof(File).optional(),
  videoBase64: z.string().optional(),
});

// Enhanced Video Player with Cloudinary fallback
const CloudinaryVideoPlayer = ({
  videoUrl,
  className = "",
}: {
  videoUrl: string;
  className?: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useNativePlayer, setUseNativePlayer] = useState(false);

  // Check if URL is a Cloudinary URL
  const isCloudinaryUrl = videoUrl.includes("cloudinary.com");
  const isBlobUrl = videoUrl.startsWith("blob:");
  const isBase64Url = videoUrl.startsWith("data:");

  // For native player controls
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => {
          console.error("Play failed:", err);
          setError("Failed to play video");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleReload = () => {
    setError(null);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  useEffect(() => {
    const initializeCloudinaryPlayer = async () => {
      if (!isCloudinaryUrl || useNativePlayer) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import Cloudinary Video Player
        const { cloudinary } = await import("cloudinary-video-player");

        if (!videoRef.current) return;

        // Get cloud name from environment or use a default
        const cloudName =
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";

        playerRef.current = cloudinary.videoPlayer(videoRef.current, {
          cloud_name: cloudName,
          controls: true,
          muted: false,
          fluid: true,
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        });

        // Set video source
        playerRef.current.source(videoUrl);

        playerRef.current.on("loadstart", () => {
          setIsLoading(true);
        });

        playerRef.current.on("loadeddata", () => {
          setIsLoading(false);
        });

        playerRef.current.on("play", () => {
          setIsPlaying(true);
        });

        playerRef.current.on("pause", () => {
          setIsPlaying(false);
        });

        playerRef.current.on("error", (event: any) => {
          console.error("Cloudinary player error:", event);
          setIsLoading(false);
          setError("Cloudinary player failed. Switching to native player...");
          // Fallback to native player
          setUseNativePlayer(true);
        });
      } catch (err) {
        console.error("Failed to initialize Cloudinary player:", err);
        setError(
          "Failed to load Cloudinary player. Using native player instead."
        );
        setUseNativePlayer(true);
        setIsLoading(false);
      }
    };

    if (videoUrl && isCloudinaryUrl && !useNativePlayer) {
      initializeCloudinaryPlayer();
    } else {
      setIsLoading(false);
    }

    return () => {
      // Cleanup Cloudinary player
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (err) {
          console.error("Error disposing Cloudinary player:", err);
        }
      }
    };
  }, [videoUrl, isCloudinaryUrl, useNativePlayer]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    if (useNativePlayer && videoRef.current) {
      videoRef.current.load();
    } else if (isCloudinaryUrl) {
      setUseNativePlayer(false);
    }
  };

  const handleNativeLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleNativeLoadedData = () => {
    setIsLoading(false);
  };

  const handleNativeError = () => {
    setIsLoading(false);
    setError("Failed to load video");
  };

  const handleNativeEnded = () => {
    setIsPlaying(false);
  };

  const handleNativeTimeUpdate = () => {
    if (videoRef.current && !isPlaying && videoRef.current.currentTime > 0) {
      setIsPlaying(true);
    }
  };

  // Determine if we should use Cloudinary player or native player
  const shouldUseCloudinary = isCloudinaryUrl && !useNativePlayer;
  const showNativeControls = !shouldUseCloudinary;

  return (
    <div
      className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full ${
          shouldUseCloudinary ? "cld-video-player" : ""
        }`}
        controls={showNativeControls}
        playsInline
        preload="metadata"
        onLoadStart={handleNativeLoadStart}
        onLoadedData={handleNativeLoadedData}
        onError={handleNativeError}
        onEnded={handleNativeEnded}
        onTimeUpdate={handleNativeTimeUpdate}
        muted={isMuted}
      >
        {!shouldUseCloudinary && <source src={videoUrl} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <RefreshCw className="h-8 w-8 text-white animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 text-white p-4">
          <VideoIcon className="h-8 w-8 text-red-400 mb-2" />
          <p className="text-sm mb-2 text-center">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Custom Controls for Native Player (when not using Cloudinary) */}
      {!isLoading && !error && !shouldUseCloudinary && !showNativeControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMuteToggle}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>
            <div className="text-xs text-white/70">
              {isCloudinaryUrl ? "Cloudinary (Native)" : "Video Preview"}
            </div>
          </div>
        </div>
      )}

      {/* Play Button Overlay for Native Player */}
      {!isPlaying &&
        !isLoading &&
        !error &&
        !shouldUseCloudinary &&
        !showNativeControls && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={handlePlayPause}
          >
            <div className="bg-black/50 rounded-full p-4 hover:bg-black/70 transition-colors">
              <Play className="h-12 w-12 text-white" />
            </div>
          </div>
        )}

      {/* Cloudinary Badge */}
      {!isLoading && !error && isCloudinaryUrl && shouldUseCloudinary && (
        <div className="absolute top-2 right-2">
          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
            Cloudinary
          </div>
        </div>
      )}

      {/* Fallback Badge */}
      {!isLoading && !error && isCloudinaryUrl && useNativePlayer && (
        <div className="absolute top-2 right-2">
          <div className="bg-orange-600 text-white text-xs px-2 py-1 rounded">
            Native Fallback
          </div>
        </div>
      )}
    </div>
  );
};

const ChapterVideoForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterVideoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
    if (isEditing) {
      setSelectedFile(null);
      setFilePreview(null);
      form.reset();
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video size should be less than 100MB");
      return;
    }

    setSelectedFile(file);
    form.setValue("VideoUrl", file);

    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);

    try {
      setIsConverting(true);
      const base64String = await fileToBase64(file);
      form.setValue("videoBase64", base64String);
      toast.success("Video converted and ready for upload");
    } catch (error) {
      toast.error("Failed to process video file");
      console.error("Base64 conversion error:", error);
    } finally {
      setIsConverting(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    form.setValue("VideoUrl", undefined);
    form.setValue("videoBase64", undefined);
    const fileInput = document.getElementById(
      "video-upload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];

        if (!file.type.startsWith("video/")) {
          toast.error("Please select a valid video file");
          return;
        }

        if (file.size > 100 * 1024 * 1024) {
          toast.error("Video size should be less than 100MB");
          return;
        }

        setSelectedFile(file);
        form.setValue("VideoUrl", file);

        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);

        try {
          setIsConverting(true);
          const base64String = await fileToBase64(file);
          form.setValue("videoBase64", base64String);
          toast.success("Video converted and ready for upload");
        } catch (error) {
          toast.error("Failed to process video file");
          console.error("Base64 conversion error:", error);
        } finally {
          setIsConverting(false);
        }
      }
    },
    [form]
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.VideoUrl || !values.videoBase64) {
      toast.error("Please select a video file");
      return;
    }

    try {
      setIsSubmitting(true);
      const submissionData = { videoUrl: values.videoBase64 };

      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}`,
        submissionData
      );

      toast.success("Video uploaded successfully!");
      toggleEdit();
      setSelectedFile(null);
      setFilePreview(null);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Video upload error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasVideoUrl =
    initialData.videoUrl && initialData.videoUrl.trim() !== "";

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Chapter Video
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={toggleEdit} type="button">
            {isEditing ? (
              <>Cancel</>
            ) : hasVideoUrl ? (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Change video
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add a video
              </>
            )}
          </Button>
        </div>
      </div>

      {!isEditing ? (
        <div className="mt-2 space-y-4">
          {hasVideoUrl ? (
            <>
              <CloudinaryVideoPlayer
                videoUrl={initialData.videoUrl}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Click the change button to replace this video
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
              <VideoIcon className="h-10 w-10 text-slate-500" />
            </div>
          )}
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="VideoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chapter Video</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div
                        className={`
                          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
                          ${
                            isDragOver
                              ? "border-blue-500 bg-blue-50 border-solid"
                              : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                          }
                          ${selectedFile ? "border-green-500 bg-green-50" : ""}
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() =>
                          document.getElementById("video-upload")?.click()
                        }
                      >
                        <input
                          id="video-upload"
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          disabled={isSubmitting}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center justify-center gap-2">
                          {selectedFile ? (
                            <>
                              <VideoIcon className="h-8 w-8 text-green-500" />
                              <div>
                                <p className="font-medium text-green-700">
                                  File selected
                                </p>
                                <p className="text-sm text-green-600">
                                  {selectedFile.name}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-gray-400" />
                              <div>
                                <span className="font-medium text-blue-600">
                                  Click to upload
                                </span>
                                <span className="text-gray-500">
                                  {" "}
                                  or drag and drop
                                </span>
                              </div>
                            </>
                          )}
                          <p className="text-xs text-gray-500">
                            MP4, WebM, MOV up to 100MB
                            {isConverting && " • Converting..."}
                          </p>
                        </div>
                      </div>

                      {selectedFile && (
                        <div className="bg-white rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <VideoIcon className="h-5 w-5 text-blue-500" />
                              <div>
                                <span className="font-medium text-sm">
                                  {selectedFile.name}
                                </span>
                                {isConverting && (
                                  <span className="text-xs text-orange-500 ml-2">
                                    (Converting...)
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeSelectedFile}
                              disabled={isSubmitting || isConverting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">
                            Size:{" "}
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            • Type: {selectedFile.type}
                            {form.watch("videoBase64") && (
                              <span className="text-green-500 ml-2">
                                ✓ Ready to upload
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {filePreview && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Preview:</p>
                          <CloudinaryVideoPlayer
                            videoUrl={filePreview}
                            className="w-full max-w-2xl"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedFile ||
                  !form.watch("videoBase64") ||
                  isConverting
                }
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : isConverting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  "Upload Video"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={toggleEdit}
                disabled={isSubmitting || isConverting}
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Upload a video file for this chapter. Supported formats: MP4,
              WebM, MOV. The video will be converted to base64 format for
              upload.
            </p>

            {hasVideoUrl && !isEditing && (
              <p className="text-xs text-muted-foreground mt-2">
                Videos can take a few minutes to process. Refresh the page if
                video does not appear.
              </p>
            )}
          </form>
        </Form>
      )}
    </div>
  );
};

export default ChapterVideoForm;
