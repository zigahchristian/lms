import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const courseId = (await params).courseId;

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

    //FIND  CHAPTER
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: session?.user.id,
      },
      include: {
        chapters: true,
      },
    });

    const hasPublishedChapter = course?.chapters.some(
      (chapter) => chapter.isPublished
    );

    if (
      !course ||
      !course.image ||
      !course.title ||
      !course.description ||
      !course.categoryId ||
      !hasPublishedChapter
    ) {
      new NextResponse("Missing required fields", { status: 400 });
    }

    const publishedCourse = await prisma.course.update({
      where: {
        id: courseId,
        userId: session?.user.id,
      },
      data: {
        isPublished: true,
      },
    });

    return NextResponse.json(
      {
        publishedCourse,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("COURSE_PUBLISH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
