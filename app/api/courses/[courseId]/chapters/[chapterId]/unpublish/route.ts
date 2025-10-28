import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PATCH(
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

    // Check Required Fields

    const unPublishedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
        courseId: courseId,
      },
      data: {
        isPublished: false,
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
        unPublishedChapter,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("COURSE_UNPUBLISH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
