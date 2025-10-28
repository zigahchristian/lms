import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  uploadAttachmentsToCloudinary,
  deleteFromCloudinary,
} from "@/lib/cloudinary";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseId = (await params).courseId;
    const chapterId = (await params).chapterId;
    const userId: string = session.user.id;
    const body = await req.json();

    // Check if course exists and user owns it
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId,
      },
    });

    if (!existingCourse) {
      return new NextResponse("Course not found", { status: 404 });
    }
    const RequestHasVideo = !!body.videoUrl;

    if (RequestHasVideo && body.videoUrl.startsWith("data:video")) {
      let cloudinaryData = {
        url: body.videoUrl,
        public_id: body.publicVideoUrl,
      };

      if (body.imagePublicId) {
        await deleteFromCloudinary(body.imagePublicId);
      }

      cloudinaryData = await uploadAttachmentsToCloudinary(
        body.videoUrl,
        "course_video"
      );

      body.videoUrl = cloudinaryData.url;
      body.publicVideoUrl = cloudinaryData.public_id;
    }

    // Check if course have base64
    const chapter = await prisma.chapter.update({
      where: {
        id: chapterId,
        courseId: courseId,
      },
      data: {
        ...body,
      },
    });

    return NextResponse.json(
      {
        success: true,
        chapter,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[COURSE_CHAPTER_ID]", error);

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes("P2025")) {
        // Prisma not found error
        return new NextResponse("Course not found", { status: 404 });
      }
      if (error.message.includes("P2002")) {
        // Unique constraint
        return new NextResponse("Duplicate entry", { status: 409 });
      }
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const courseId = (await params).courseId;
    const chapterId = (await params).chapterId;
    const session = await getServerSession(authOptions);

    // Check Authorized User
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check Course Owner
    const courseOwner = prisma.course.findUnique({
      where: {
        id: courseId,
        userId: session?.user?.id,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unathorized", { status: 401 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        courseId: courseId,
      },
    });

    if (!chapter) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (chapter.videoUrl) {
      await deleteFromCloudinary(chapter.publicVideoUrl);
    }

    const deletedChapter = await prisma.chapter.delete({
      where: {
        id: chapterId,
        courseId: courseId,
      },
    });

    const publishedChaptersInCourse = await prisma.chapter.findMany({
      where: {
        courseId: courseId,
        isPublished: true,
      },
    });

    if (!publishedChaptersInCourse.length) {
      await prisma.course.update({
        where: {
          id: courseId,
        },
        data: {
          isPublished: false,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        deletedChapter,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("COURSE_ID_ATTACHMENT", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
