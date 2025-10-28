"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Clock,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface VideoPlayerProps {
  chapter: {
    id: string;
    title: string;
    videoUrl: string;
    description?: string;
    position: number;
    isFree: boolean;
  };
  courseId: string;
  chapterId: string;
  nextChapter: {
    id: string;
    title: string;
    position: number;
  } | null;
  previousChapter: {
    id: string;
    title: string;
    position: number;
  } | null;
  userProgress: {
    isCompleted: boolean;
  } | null;
  purchase: any;
  userId: string;
}

const VideoPlayer = ({
  chapter,
  courseId,
  chapterId,
  nextChapter,
  previousChapter,
  userProgress,
  purchase,
  userId,
}: VideoPlayerProps) => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isCompleted, setIsCompleted] = useState(
    userProgress?.isCompleted || false
  );
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Load saved progress from localStorage - CLIENT SIDE ONLY
  useEffect(() => {
    // Skip during SSR
    if (typeof window === "undefined") return;
    if (!userId || !chapterId || !videoRef.current) return;

    const savedProgress = localStorage.getItem(
      `video-progress-${userId}-${chapterId}`
    );
    if (savedProgress) {
      try {
        const {
          currentTime: savedTime,
          volume: savedVolume,
          playbackRate: savedRate,
        } = JSON.parse(savedProgress);

        // Set state but don't modify video element until it's loaded
        setVolume(savedVolume);
        setPlaybackRate(savedRate);
        setIsMuted(savedVolume === 0);

        // Current time will be set when video metadata loads
        if (videoRef.current.readyState > 0) {
          const safeTime = Math.min(savedTime, videoRef.current.duration - 1);
          videoRef.current.currentTime = safeTime;
          setCurrentTime(safeTime);
        }
      } catch (error) {
        console.error("Error loading saved progress:", error);
      }
    }
  }, [userId, chapterId]);

  // Save progress to localStorage - CLIENT SIDE ONLY
  const saveProgress = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!userId || !chapterId || !videoRef.current) return;

    const progress = {
      currentTime: videoRef.current.currentTime,
      volume: videoRef.current.volume,
      playbackRate: videoRef.current.playbackRate,
    };

    try {
      localStorage.setItem(
        `video-progress-${userId}-${chapterId}`,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [userId, chapterId]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    const interval = setInterval(saveProgress, 5000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  // Handle video metadata load
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);

      // Load saved time after metadata is available
      if (typeof window !== "undefined") {
        const savedProgress = localStorage.getItem(
          `video-progress-${userId}-${chapterId}`
        );
        if (savedProgress) {
          try {
            const { currentTime: savedTime } = JSON.parse(savedProgress);
            const safeTime = Math.min(savedTime, videoRef.current.duration - 1);
            videoRef.current.currentTime = safeTime;
            setCurrentTime(safeTime);
          } catch (error) {
            console.error("Error setting saved time:", error);
          }
        }
      }
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      // Only save progress after user interaction
      if (hasInteracted) {
        saveProgress();
      }

      // Mark as completed if watched 95% of the video
      if (
        videoRef.current.duration > 0 &&
        videoRef.current.currentTime / videoRef.current.duration > 0.95 &&
        !isCompleted
      ) {
        handleComplete();
      }
    }
  };

  // Handle video end
  const handleEnded = () => {
    setIsPlaying(false);
    handleComplete();
  };

  // Handle video error
  const handleError = () => {
    setIsLoading(false);
    toast.error("Failed to load video. Please check the video URL.");
  };

  // Mark chapter as completed
  const handleComplete = async () => {
    if (isCompleted) return;

    try {
      setIsCompleted(true);

      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/progress`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isCompleted: true,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update progress");

      toast.success("Chapter completed!");

      // Use router.refresh() instead of page reload
      router.refresh();

      // Auto-navigate to next chapter after 3 seconds
      if (nextChapter) {
        setTimeout(() => {
          router.push(`/courses/${courseId}/chapters/${nextChapter.id}`);
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
      setIsCompleted(false);
    }
  };

  // Play/Pause toggle
  const togglePlayPause = () => {
    if (videoRef.current) {
      setHasInteracted(true);
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => {
          console.error("Play failed:", err);
          toast.error("Failed to play video");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      setHasInteracted(true);
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Seek to specific time
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      setHasInteracted(true);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      saveProgress();
    }
  };

  // Change volume
  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      setHasInteracted(true);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  // Change playback rate
  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      setHasInteracted(true);
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      saveProgress();
    }
  };

  // Go to previous chapter
  const goToPreviousChapter = () => {
    if (previousChapter) {
      router.push(`/courses/${courseId}/chapters/${previousChapter.id}`);
    }
  };

  // Go to next chapter
  const goToNextChapter = () => {
    if (nextChapter) {
      router.push(`/courses/${courseId}/chapters/${nextChapter.id}`);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle mouse movement for controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);

    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    setControlsTimeout(timeout);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Video Player */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            className="relative aspect-video bg-black"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setShowControls(false)}
          >
            {/* Video Element - Consistent attributes */}
            <video
              ref={videoRef}
              className="w-full h-full"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={handleError}
              onClick={togglePlayPause}
              preload="metadata"
              playsInline
              controls={false}
            >
              <source src={chapter.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <RefreshCw className="h-8 w-8 text-white animate-spin" />
                <span className="ml-2 text-white">Loading video...</span>
              </div>
            )}

            {/* Completion Badge */}
            {isCompleted && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
            )}

            {/* Custom Controls */}
            {!isLoading && (
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
                  showControls ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* Progress Bar */}
                <div className="mb-4">
                  <Progress
                    value={progressPercentage}
                    className="w-full h-2 cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      handleSeek(percent * duration);
                    }}
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Previous Chapter */}
                    {previousChapter && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPreviousChapter}
                        className="text-white hover:bg-white/20"
                        title={`Previous: ${previousChapter.title}`}
                      >
                        <SkipBack className="h-5 w-5" />
                      </Button>
                    )}

                    {/* Play/Pause */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>

                    {/* Next Chapter */}
                    {nextChapter && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNextChapter}
                        className="text-white hover:bg-white/20"
                        title={`Next: ${nextChapter.title}`}
                      >
                        <SkipForward className="h-5 w-5" />
                      </Button>
                    )}

                    {/* Volume */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>

                    {/* Volume Slider */}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) =>
                        handleVolumeChange(parseFloat(e.target.value))
                      }
                      className="w-20 accent-white"
                    />

                    {/* Time Display */}
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Playback Speed */}
                    <select
                      value={playbackRate}
                      onChange={(e) =>
                        handlePlaybackRateChange(parseFloat(e.target.value))
                      }
                      className="bg-transparent text-white border border-white/30 rounded px-2 py-1 text-sm"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Play Button Overlay */}
            {!isPlaying && !showControls && !isLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={togglePlayPause}
              >
                <div className="bg-black/50 rounded-full p-6 hover:bg-black/70 transition-colors">
                  <Play className="h-16 w-16 text-white" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rest of your component remains the same... */}
    </div>
  );
};

export default VideoPlayer;
