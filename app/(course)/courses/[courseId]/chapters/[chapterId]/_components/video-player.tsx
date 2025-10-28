"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  Minimize2,
  Maximize2,
  PictureInPicture2,
  Lock,
} from "lucide-react";
import next from "next";
import { Preview } from "@/components/preview";

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
  const playerRef = useRef<HTMLDivElement>(null);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check if chapter is locked (not free and not purchased)
  const isLocked = !chapter.isFree && !purchase;

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };
    checkTouchDevice();
    window.addEventListener("touchstart", checkTouchDevice);
    return () => window.removeEventListener("touchstart", checkTouchDevice);
  }, []);

  // Prevent context menu on video element to disable "Save video as"
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Fullscreen functionality
  const toggleFullscreen = useCallback(async () => {
    if (!playerRef.current || isLocked) return;

    try {
      if (!document.fullscreenElement) {
        await playerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      // Fallback for browsers that don't support fullscreen API
      if (videoRef.current) {
        if (!document.fullscreenElement) {
          videoRef.current.requestFullscreen?.();
          setIsFullscreen(true);
        } else {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        }
      }
    }
  }, [isLocked]);

  // Miniplayer functionality
  const toggleMiniPlayer = useCallback(async () => {
    if (!videoRef.current || isLocked) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsMiniPlayer(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsMiniPlayer(true);
      }
    } catch (error) {
      console.error("Miniplayer error:", error);
      toast.error("Miniplayer not supported in this browser");
    }
  }, [isLocked]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle picture-in-picture events
  useEffect(() => {
    const handleEnterPictureInPicture = () => {
      setIsMiniPlayer(true);
    };

    const handleLeavePictureInPicture = () => {
      setIsMiniPlayer(false);
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener(
        "enterpictureinpicture",
        handleEnterPictureInPicture
      );
      video.addEventListener(
        "leavepictureinpicture",
        handleLeavePictureInPicture
      );
    }

    return () => {
      if (video) {
        video.removeEventListener(
          "enterpictureinpicture",
          handleEnterPictureInPicture
        );
        video.removeEventListener(
          "leavepictureinpicture",
          handleLeavePictureInPicture
        );
      }
    };
  }, []);

  // Load saved progress from localStorage - CLIENT SIDE ONLY
  useEffect(() => {
    // Skip during SSR or if chapter is locked
    if (typeof window === "undefined" || isLocked) return;
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
  }, [userId, chapterId, isLocked]);

  // Save progress to localStorage - CLIENT SIDE ONLY
  const saveProgress = useCallback(() => {
    if (typeof window === "undefined" || isLocked) return;
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
  }, [userId, chapterId, isLocked]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    if (isLocked) return;
    const interval = setInterval(saveProgress, 5000);
    return () => clearInterval(interval);
  }, [saveProgress, isLocked]);

  // Handle video metadata load
  const handleLoadedMetadata = () => {
    if (videoRef.current && !isLocked) {
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
    if (videoRef.current && !isLocked) {
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
    if (isLocked) return;
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
    if (isCompleted || isLocked) return;

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
    if (videoRef.current && !isLocked) {
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
    if (videoRef.current && !isLocked) {
      setHasInteracted(true);
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Seek to specific time
  const handleSeek = (time: number) => {
    if (videoRef.current && !isLocked) {
      setHasInteracted(true);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      saveProgress();
    }
  };

  // Change volume
  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current && !isLocked) {
      setHasInteracted(true);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  // Change playback rate
  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current && !isLocked) {
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

  // Enhanced mouse/touch movement handling
  const handleMouseMove = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);

    const timeout = setTimeout(
      () => {
        // Don't hide controls on touch devices when video is playing
        if (!isTouchDevice || !isPlaying) {
          setShowControls(false);
        }
      },
      isTouchDevice ? 5000 : 3000
    ); // Longer timeout for touch devices

    setControlsTimeout(timeout);
  }, [isLocked, controlsTimeout, isTouchDevice, isPlaying]);

  // Touch-specific handlers
  const handleTouchStart = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
  }, [isLocked, controlsTimeout]);

  const handleTouchEnd = useCallback(() => {
    if (isLocked) return;
    const timeout = setTimeout(() => {
      if (!isPlaying) {
        setShowControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  }, [isLocked, isPlaying]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Remove HTML tags from description
  const stripHtmlTags = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Video Player */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            ref={playerRef}
            className="relative aspect-video bg-black"
            onMouseMove={handleMouseMove}
            onMouseLeave={() =>
              !isLocked && !isTouchDevice && setShowControls(false)
            }
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onPlay={() => !isLocked && setIsPlaying(true)}
              onPause={() => !isLocked && setIsPlaying(false)}
              onError={handleError}
              onClick={togglePlayPause}
              onContextMenu={handleContextMenu}
              preload="metadata"
              playsInline
              controls={false}
              style={{
                filter: isLocked ? "blur(8px)" : "none",
                opacity: isLocked ? 0.7 : 1,
              }}
            >
              <source src={chapter.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Top Progress Bar for Mobile */}
            {isTouchDevice && !isLocked && (
              <div
                className={`absolute top-0 left-0 right-0 transition-opacity duration-300 ${
                  showControls ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="bg-gradient-to-b from-black/60 to-transparent pt-4 px-4 pb-2">
                  <div
                    className="w-full h-2 bg-white/30 rounded-full cursor-pointer relative"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      handleSeek(percent * duration);
                    }}
                    onTouchStart={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const touch = e.touches[0];
                      const percent = (touch.clientX - rect.left) / rect.width;
                      handleSeek(percent * duration);
                    }}
                  >
                    <div
                      className="h-full bg-white rounded-full relative"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-white text-xs font-mono">
                      {formatTime(currentTime)}
                    </span>
                    <span className="text-white text-xs font-mono">
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Lock Overlay */}
            {isLocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-3 sm:p-4">
                <div className="text-center space-y-2 sm:space-y-4 max-w-xs mx-auto">
                  <Lock className="h-8 w-8 sm:h-16 sm:w-16 mx-auto text-yellow-400" />
                  <h3 className="text-lg sm:text-2xl font-bold">
                    Chapter is Locked
                  </h3>
                  <p className="text-xs sm:text-lg leading-relaxed px-2">
                    This chapter requires course purchase to access. Please
                    purchase the course to unlock all chapters.
                  </p>
                  <Button
                    onClick={() => router.push(`/courses/${courseId}/purchase`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 sm:py-3 sm:px-6 rounded text-xs sm:text-base w-full sm:w-auto"
                  >
                    Purchase Course
                  </Button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && !isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <RefreshCw className="h-8 w-8 text-white animate-spin" />
                <span className="ml-2 text-white">Loading video...</span>
              </div>
            )}

            {/* Completion Badge */}
            {isCompleted && !isLocked && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
            )}

            {/* Lock Icon Badge */}
            {isLocked && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Locked
              </div>
            )}

            {/* Custom Controls */}
            {!isLoading && !isLocked && (
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-4 transition-opacity duration-300 ${
                  showControls ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* Progress Bar for Desktop */}
                {!isTouchDevice && (
                  <div className="mb-2 sm:mb-4 px-1">
                    <div
                      className="w-full h-2 bg-white/30 rounded-full cursor-pointer relative"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = (e.clientX - rect.left) / rect.width;
                        handleSeek(percent * duration);
                      }}
                    >
                      <div
                        className="h-full bg-white rounded-full relative"
                        style={{ width: `${progressPercentage}%` }}
                      >
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {/* Left Controls Group */}
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    {/* Previous Chapter */}
                    {previousChapter && (
                      <Button
                        variant="ghost"
                        size={isTouchDevice ? "default" : "icon"}
                        onClick={goToPreviousChapter}
                        className="text-white hover:bg-white/20 p-1 sm:p-2"
                        title={`Previous: ${previousChapter.title}`}
                      >
                        <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
                        {isTouchDevice && (
                          <span className="sr-only">Previous Chapter</span>
                        )}
                      </Button>
                    )}

                    {/* Play/Pause */}
                    <Button
                      variant="ghost"
                      size={isTouchDevice ? "default" : "icon"}
                      onClick={togglePlayPause}
                      className="text-white hover:bg-white/20 p-2 sm:p-2"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <Play className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </Button>

                    {/* Next Chapter */}
                    {nextChapter && (
                      <Button
                        variant="ghost"
                        size={isTouchDevice ? "default" : "icon"}
                        onClick={goToNextChapter}
                        className="text-white hover:bg-white/20 p-1 sm:p-2"
                        title={`Next: ${nextChapter.title}`}
                      >
                        <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                        {isTouchDevice && (
                          <span className="sr-only">Next Chapter</span>
                        )}
                      </Button>
                    )}

                    {/* Volume Controls */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size={isTouchDevice ? "default" : "icon"}
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20 p-1 sm:p-2"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </Button>

                      {/* Volume Slider - Hidden on very small screens */}
                      <div
                        className={`${
                          isTouchDevice ? "hidden xs:block" : "block"
                        }`}
                      >
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={(e) =>
                            handleVolumeChange(parseFloat(e.target.value))
                          }
                          className="w-16 sm:w-20 accent-white"
                        />
                      </div>
                    </div>

                    {/* Time Display for Desktop */}
                    {!isTouchDevice && (
                      <span className="text-white text-xs sm:text-sm font-mono min-w-[80px] sm:min-w-[100px]">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    )}
                  </div>

                  {/* Right Controls Group */}
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    {/* Playback Speed */}
                    <select
                      value={playbackRate}
                      onChange={(e) =>
                        handlePlaybackRateChange(parseFloat(e.target.value))
                      }
                      className="bg-transparent text-white border hover:bg-white hover:text-black border-white/30 rounded px-1 sm:px-2 py-1 text-xs sm:text-sm max-w-[80px] sm:max-w-none"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>

                    {/* Miniplayer Button */}
                    <Button
                      variant="ghost"
                      size={isTouchDevice ? "default" : "icon"}
                      onClick={toggleMiniPlayer}
                      className="text-white hover:bg-white/20 p-1 sm:p-2"
                      title="Miniplayer"
                    >
                      <PictureInPicture2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>

                    {/* Fullscreen Button */}
                    <Button
                      variant="ghost"
                      size={isTouchDevice ? "default" : "icon"}
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20 p-1 sm:p-2"
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Play Button Overlay */}
            {!isPlaying && !showControls && !isLoading && !isLocked && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={togglePlayPause}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
              >
                <div className="bg-black/50 rounded-full p-4 sm:p-6 hover:bg-black/70 transition-colors">
                  <Play className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                </div>
              </div>
            )}

            {/* Quick Seek Buttons for Touch Devices */}
            {isTouchDevice && showControls && !isLocked && (
              <div className="absolute top-16 left-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                  className="bg-white/20 text-white hover:bg-white/30 text-xs"
                >
                  -10s
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleSeek(Math.min(duration, currentTime + 10))
                  }
                  className="bg-white/20 text-white hover:bg-white/30 text-xs"
                >
                  +10s
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chapter Information
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{chapter.title}</h2>
              {chapter.description && (
                <p className="text-gray-600 mt-2">
                  {<Preview value={chapter.description} />}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Completed</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-5 w-5" />
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {/* Navigation Buttons 
          <div className="flex  mt-6 overflow-auto text-right items-end">
            <Button
              onClick={goToNextChapter}
              disabled={!nextChapter}
              variant="outline"
            >
              Next Chapter - {nextChapter?.title}
              <SkipForward className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardFooter>
      </Card> */}
    </div>
  );
};

export default VideoPlayer;
