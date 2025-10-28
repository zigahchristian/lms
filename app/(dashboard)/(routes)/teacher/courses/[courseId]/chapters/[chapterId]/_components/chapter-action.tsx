"use client";

import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
interface ChapterActionsProps {
  disabled: boolean;
  courseId: string;
  chapterId: string;
  isPublished: boolean;
}

const ChapterActions = ({
  disabled,
  courseId,
  chapterId,
  isPublished,
}: ChapterActionsProps) => {
  const [isLoading, setIsloading] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    try {
      setIsloading(true);
      if (isPublished) {
        await axios.patch(
          `/api/courses/${courseId}/chapters/${chapterId}/unpublish`
        );
        toast.success("Chapter Unpublished");
      } else {
        await axios.patch(
          `/api/courses/${courseId}/chapters/${chapterId}/publish`
        );
        toast.success("Chapter Published Successfully");
      }
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsloading(false);
    }
  };

  const onDelete = async () => {
    try {
      setIsloading(true);
      await axios.delete(`/api/courses/${courseId}/chapters/${chapterId}`);
      router.refresh();
      router.push(`/teacher/courses/${courseId}`);
      toast.success("Chapter deleted.");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsloading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        variant="outline"
        size="sm"
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" disabled={isLoading} className="bg-red-700">
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};

export default ChapterActions;
