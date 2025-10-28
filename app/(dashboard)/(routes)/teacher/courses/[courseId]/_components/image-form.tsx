"use client";
import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ImageIcon, PlusCircle, Code, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Course } from "@/lib/generated/prisma";
import Image from "next/image";

interface ImageFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  image: z.string().min(1, { message: "Image is required" }),
});

const ImageForm = ({ initialData, courseId }: ImageFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSelectedImage, setHasSelectedImage] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: initialData?.image || "",
    },
  });

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
    // Reset preview when canceling
    if (isEditing) {
      setImagePreview(null);
      setHasSelectedImage(false);
      form.reset({
        image: initialData?.image || "",
      });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target.files?.[0];
    if (!fileInput) {
      setHasSelectedImage(false);
      return;
    }

    // Validate file type
    if (!fileInput.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      setHasSelectedImage(false);
      return;
    }

    // Validate file size (e.g., 5MB limit)
    if (fileInput.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      setHasSelectedImage(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      form.setValue("image", imageData, { shouldValidate: true });
      setImagePreview(imageData);
      setHasSelectedImage(true);
    };
    reader.readAsDataURL(fileInput);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Image updated successfully!");
      toggleEdit();
      setImagePreview(null);
      setHasSelectedImage(false);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Image upload error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if save should be enabled
  const isSaveEnabled = hasSelectedImage && !isSubmitting;

  // Analyze image data
  const currentImage = imagePreview || initialData.image;
  const isBase64 = currentImage?.startsWith("data:image/");
  const isUrl =
    currentImage?.startsWith("http") || currentImage?.startsWith("/");
  const imageType = isBase64
    ? "Base64 Data URL"
    : isUrl
    ? "Regular URL"
    : "Unknown";

  // Truncate base64 for display
  const displayData = currentImage
    ? isBase64
      ? currentImage.substring(0, 100) + "..."
      : currentImage
    : "No image data";

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course image
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={toggleEdit} type="button">
            {isEditing ? (
              <>Cancel</>
            ) : initialData.image ? (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Edit image
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add an image
              </>
            )}
          </Button>
        </div>
      </div>

      {!isEditing ? (
        <div className="mt-2 space-y-4">
          {initialData.image ? (
            <>
              <div className="relative aspect-video mt-2">
                <Image
                  src={initialData.image}
                  alt="Course image"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
              <ImageIcon className="h-10 w-10 text-slate-500" />
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
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={isSubmitting}
                        />
                      </div>
                      {(imagePreview || initialData.image) && (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Image Preview:
                            </p>
                            <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                              <Image
                                src={
                                  imagePreview ||
                                  initialData.image ||
                                  "/placeholder.svg"
                                }
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>

                          {/* Debug info for new image */}
                          {imagePreview && showDebugInfo && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <h4 className="text-xs font-medium text-blue-700 mb-2">
                                New Image Data (Base64)
                              </h4>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <strong>Length:</strong> {imagePreview.length}{" "}
                                  characters
                                </div>
                                <div>
                                  <strong>MIME Type:</strong>{" "}
                                  {imagePreview
                                    .split(";")[0]
                                    .replace("data:", "")}
                                </div>
                                <div>
                                  <strong>Preview:</strong>
                                  <div className="mt-1 p-2 bg-white border rounded font-mono break-all max-h-20 overflow-y-auto">
                                    {imagePreview.substring(0, 120)}...
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
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
                disabled={!isSaveEnabled}
                className={
                  !isSaveEnabled ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                {isSubmitting ? "Uploading..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={toggleEdit}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              16:9 aspect ratio recommended
            </div>

            {/* Enhanced debug info */}
          </form>
        </Form>
      )}
    </div>
  );
};

export default ImageForm;
