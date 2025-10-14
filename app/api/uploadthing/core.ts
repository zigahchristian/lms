import { createUploadthing, type FileRouter } from "uploadthing/next";
//import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

const handleAuth = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return { userId };
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {
      console.log("Upload complete");
    }),
  courseAttachment: f(["text", "image", "video", "audio"])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {
      console.log("Upload complete");
    }),
  chapterVideo: f({ video: { maxFileSize: "4GB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {
      console.log("Upload complete");
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
