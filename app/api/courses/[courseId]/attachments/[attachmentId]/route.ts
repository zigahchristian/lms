import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; attachmentId: string }> }
) {
  try {
    const courseId = (await params).courseId;
    const session = await getServerSession(authOptions);
    const attachmentId = (await params).attachmentId;

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

    const attachmentToUpdate = await prisma.attachment.findUnique({
      where: {
        id: attachmentId,
        courseId: courseId,
      },
    });

    // Cloudinary upload

    if (attachmentToUpdate?.urlPublicId) {
      await deleteFromCloudinary(attachmentToUpdate?.urlPublicId);
    }

    await prisma.attachment.delete({
      where: {
        id: attachmentId,
      },
    });

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("COURSE_ID_ATTACHMENT", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
