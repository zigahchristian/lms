import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseId = (await params).courseId;
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

    // Update Course
    const course = await prisma.course.update({
      where: {
        id: courseId,
        userId,
      },
      data: {
        ...body,
        updatedAt: new Date(), // Ensure updatedAt is always set
      },
    });

    return NextResponse.json(
      {
        success: true,
        course,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[COURSE_PATCH]", error);

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
