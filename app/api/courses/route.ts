import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "../../../lib/db";

interface CreateCourseRequest {
  title: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Early return if no session
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId: string = session.user.id;
    const body: CreateCourseRequest = await req.json();
    const { title } = body;

    // Validate title
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return new NextResponse("Title is required", { status: 400 });
    }

    // Create a new Course
    const course = await prisma.course.create({
      data: {
        userId, // TypeScript knows this is definitely a string
        title: title.trim(),
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.log("[COURSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
