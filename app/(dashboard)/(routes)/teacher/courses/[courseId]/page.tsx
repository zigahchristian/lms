import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { IconBadge } from "@/components/icon-badge";
import {
  CircleDollarSign,
  File,
  LayoutDashboard,
  ListCheck,
} from "lucide-react";

import TitleForm from "./_components/title-form";
import DescriptionForm from "./_components/description-form";
import ImageForm from "./_components/image-form";
import CategoryForm from "./_components/category-form";
import PriceForm from "./_components/price-form";
import AttachmentForm from "./_components/attachment-form";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import ChaptersForm from "./_components/chapters-form";
import { Banner } from "@/components/banner";
import Actions from "./_components/action";

interface CourseIdPageProps {
  params: Promise<{ courseId: string }>;
}

const CourseIdPage = async ({ params }: CourseIdPageProps) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/");
  }

  try {
    const { courseId } = await params;

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: session.user.id, // Security: users can only edit their own courses
      },
      include: {
        attachments: {
          orderBy: {
            createdAt: "desc",
          },
        },
        chapters: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!course) {
      return redirect("/");
    }

    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    const requiredFields = [
      course.title,
      course.description,
      course.price,
      course.image,
      course.categoryId,
      course.chapters.some((chapter) => chapter.isPublished),
    ];

    const totalFields = requiredFields.length;
    const completedFields = requiredFields.filter(Boolean).length;
    const completionText = `(${completedFields}/${totalFields})`;

    const isComplete = requiredFields.every(Boolean);

    return (
      <>
        {!course.isPublished && (
          <Banner label="This Course is unpublished. It will not be visible to students." />
        )}
        <div className="p-6">
          <div className="flex flex-row items-center justify-between gap-y-2 mb-8">
            <div>
              <h1 className="text-2xl font-medium">Course Setup</h1>
              <span className="text-sm text-slate-700">
                Complete all fields {completionText}
              </span>
            </div>
            <div>
              <Actions
                disabled={!isComplete}
                courseId={courseId}
                isPublished={course.isPublished}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16">
            <div className="space-y-6">
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl">Customize your course</h2>
              </div>
              <TitleForm initialData={course} courseId={course.id} />
              <DescriptionForm initialData={course} courseId={course.id} />
              <ImageForm initialData={course} courseId={course.id} />
              <CategoryForm
                initialData={course}
                courseId={course.id}
                options={categories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
              />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={ListCheck} />
                  <h2 className="text-xl">Course chapters</h2>
                </div>

                <ChaptersForm initialData={course} courseId={course.id} />
              </div>

              <div>
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={CircleDollarSign} />
                  <h2 className="text-xl">Sell your course</h2>
                </div>
                <PriceForm initialData={course} courseId={course.id} />
              </div>

              <div>
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={File} />
                  <h2 className="text-xl">Resources & Attachments</h2>
                </div>
                <AttachmentForm initialData={course} courseId={course.id} />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error loading course:", error);
    return redirect("/");
  }
};

export default CourseIdPage;
