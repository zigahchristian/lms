import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "../../../../lib/db";
import {
  deleteFromCloudinary,
  uploadImageToCloudinary,
  uploadAttachmentsToCloudinary,
} from "@/lib/cloudinary";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseId = (await params).courseId;
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

    // Check if course have base64

    const formHasImage = !!body.image;

    if (formHasImage && body.image.startsWith("data:image")) {
      let cloudinaryData = {
        url: body.image,
        public_id: body.imagePublicId,
      };

      if (body.imagePublicId) {
        await deleteFromCloudinary(body.imagePublicId);
      }

      cloudinaryData = await uploadImageToCloudinary(
        body.image,
        "course_image"
      );
      body.image = cloudinaryData.url;
      body.imagePublicId = cloudinaryData.public_id;
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
      { status: 201 }
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const courseId = (await params).courseId;
    const body = await req.json();
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

    // Cloudinary upload
    let cloudinaryData = {
      url: body.url,
      public_id: body.urlPublicId,
    };

    if (body.urlPublicId) {
      await deleteFromCloudinary(body.imagePublicId);
    }

    cloudinaryData = await uploadAttachmentsToCloudinary(body.url);
    body.url = cloudinaryData.url;
    body.urlPublicId = cloudinaryData.public_id;

    const attachment = await prisma.attachment.create({
      data: {
        url: body.url,
        name: body.name,
        urlPublicId: body.urlPublicId,
        courseId: courseId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        attachment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("COURSE_ID_ATTACHMENT", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseId = (await params).courseId;
    const userId: string = session.user.id;

    // Check if course exists and user owns it
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId,
      },
      include: {
        attachments: true,
      },
    });

    if (!existingCourse) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // loop and delete image and attachment
    if (existingCourse.image) {
      const imageToDelete = existingCourse.imagePublicId || "";
      await deleteFromCloudinary(imageToDelete);
    }

    if (existingCourse.attachments.length) {
      for (const attachment of existingCourse.attachments) {
        await deleteFromCloudinary(attachment.urlPublicId);
      }
    }

    const deleteCourse = await prisma.course.delete({
      where: {
        id: courseId,
        userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        deleteCourse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[COURSE_DELETE]", error);

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
