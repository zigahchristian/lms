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
import { File, PlusCircle, ImageIcon, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Course, Attachment } from "@/lib/generated/prisma";
import Image from "next/image";

interface AttachmentFormProps {
  initialData: Course & { attachments: Attachment[] };
  courseId: string;
}

// Updated schema to include fileName
const formSchema = z.object({
  url: z.string().min(1),
  name: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
});

const AttachmentForm = ({ initialData, courseId }: AttachmentFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSelectedFile, setHasSelectedFile] = useState(false);
  const [selectedname, setSelectedname] = useState<string>("");
  const [selectedFileType, setSelectedFileType] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      name: "",
      fileType: "",
    },
  });

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
    // Reset preview when canceling
    if (isEditing) {
      setFilePreview(null);
      setHasSelectedFile(false);
      setSelectedname("");
      setSelectedFileType("");
      form.reset({
        url: "",
        name: "",
        fileType: "",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4 mr-2" />;
    }
    return <File className="h-4 w-4 mr-2" />;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target.files?.[0];
    if (!fileInput) {
      setHasSelectedFile(false);
      setSelectedname("");
      setSelectedFileType("");
      setFilePreview(null);
      return;
    }

    // Validate file size (e.g., 10MB limit for all files)
    if (fileInput.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      setHasSelectedFile(false);
      setSelectedname("");
      setSelectedFileType("");
      setFilePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;

      // Set all form values including file metadata
      form.setValue("url", url, { shouldValidate: true });
      form.setValue("name", fileInput.name, { shouldValidate: true });
      form.setValue("fileType", fileInput.type || "application/octet-stream", {
        shouldValidate: true,
      });

      setSelectedname(fileInput.name);
      setSelectedFileType(fileInput.type || "application/octet-stream");
      setHasSelectedFile(true);

      // Only set preview for images
      if (fileInput.type.startsWith("image/")) {
        setFilePreview(url);
      } else {
        setFilePreview(null);
      }
    };
    reader.readAsDataURL(fileInput);
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    const attachmentId = id;
    await axios.delete(`/api/courses/${courseId}/attachments/${attachmentId}`);

    setFilePreview(null);
    setHasSelectedFile(false);
    setSelectedname("");
    setSelectedFileType("");
    router.refresh();
    try {
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("File upload error:", error);
      console.log("DELETE_ATTACHMENT", error);
    } finally {
      setDeletingId(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Create a structured object with file data and metadata
      const submissionData = {
        url: values.url, // base64 data
        name: values.name,
      };

      await axios.post(`/api/courses/${courseId}`, submissionData);
      toast.success("File uploaded successfully!");
      toggleEdit();
      setFilePreview(null);
      setHasSelectedFile(false);
      setSelectedname("");
      setSelectedFileType("");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("File upload error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if save should be enabled
  const isSaveEnabled = hasSelectedFile && !isSubmitting;

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course Attachments
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={toggleEdit} type="button">
            {isEditing && <>Cancel</>}
            {!isEditing && (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add a file
              </>
            )}
          </Button>
        </div>
      </div>

      {!isEditing ? (
        <div className="mt-2 space-y-4">
          {initialData.attachments && initialData.attachments.length > 0 ? (
            <div className="space-y-2">
              {initialData.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center p-3 bg-sky-100 border-sky-200 border text-sky-700 rounded-md"
                >
                  <File className="h-4 w-4 mr-2" />
                  <span className="text-sm flex-1">{attachment.name}</span>
                  <span className="text-xs text-sky-600 bg-sky-200 px-2 py-1 rounded">
                    {attachment.name?.split(".")[1]?.toUpperCase() || "FILE"}
                  </span>
                  {deletingId === attachment.id && (
                    <button>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </button>
                  )}
                  {deletingId !== attachment.id && (
                    <button
                      className="ml-auto hover:opacity-75 transition"
                      onClick={() => onDelete(attachment.id)}
                    >
                      <X className="ml-2 h-4 w-4 " />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm mt-2 text-slate-500 italic">
              No attachments yet
            </p>
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
              name="url"
              render={({}) => (
                <FormItem>
                  <FormLabel>Course Attachment</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="*/*" // Accept all file types
                          onChange={handleFileChange}
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* File info display */}
                      {selectedname && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-start">
                            {getFileIcon(selectedFileType)}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-800">
                                {selectedname}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  Type: {selectedFileType || "Unknown"}
                                </span>
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  Size:{" "}
                                  {(
                                    (form.getValues("url").length * 0.75) /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{" "}
                                  MB (approx)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image preview - only for images */}
                      {filePreview && selectedFileType.startsWith("image/") && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Preview:</p>
                          <div className="relative w-full h-48 border rounded-md overflow-hidden">
                            <Image
                              src={filePreview}
                              alt="Preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Non-image file message */}
                      {selectedname &&
                        !selectedFileType.startsWith("image/") && (
                          <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
                            <div className="flex items-center">
                              <File className="h-8 w-8 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  File ready for upload
                                </p>
                                <p className="text-xs text-gray-500">
                                  This file type will be available for download
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden fields for file metadata */}
            <input type="hidden" {...form.register("name")} />
            <input type="hidden" {...form.register("fileType")} />

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
              Add anything your students might need to complete the course.
              Supported: PDF, Documents, Images, Videos, ZIP files, and more.
            </div>

            {/* Debug info - remove in production */}
            <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-100 rounded">
              <p>Debug Info:</p>
              <p>File Name: {form.getValues("name") || "Not set"}</p>
              <p>File Type: {form.getValues("fileType") || "Not set"}</p>
              <p>Data Length: {form.getValues("url").length} characters</p>
              <p>
                Is Image: {selectedFileType.startsWith("image/") ? "Yes" : "No"}
              </p>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default AttachmentForm;
