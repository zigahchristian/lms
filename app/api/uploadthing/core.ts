import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

// Auth middleware
const handleAuth = async () => {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("UNAUTHORIZED");
  return { userId };
};

// FileRouter configuration
export const ourFileRouter = {
  courseImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { userId } = await handleAuth();
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for user:", metadata.userId);
      console.log("File URL:", file.ufsUrl);

      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
      };
    }),

  courseAttachment: f(["text", "image", "video", "audio", "pdf"])
    .middleware(async () => {
      const { userId } = await handleAuth();
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Attachment upload complete for user:", metadata.userId);

      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
        type: file.type,
      };
    }),

  chapterVideo: f({
    video: {
      maxFileSize: "4GB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { userId } = await handleAuth();
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Video upload complete for user:", metadata.userId);

      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
/* import { createUploadthing, type FileRouter } from "uploadthing/next";
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
    .onUploadComplete(({ file }) => {
      return {
        file: file.ufsUrl,
      };
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
 */
