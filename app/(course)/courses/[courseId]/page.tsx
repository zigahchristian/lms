import prisma from "@/lib/db";
import { redirect } from "next/navigation";

interface ChapterIdPageProps {
  params: {
    courseId: string;
  };
}

const CourseIdPage = async ({ params }: ChapterIdPageProps) => {
  const courseId = (await params).courseId;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!course || course.chapters.length === 0) {
    return redirect("/");
  }

  return redirect(`/courses/${course.id}/chapters/${course.chapters[0].id}`);
};

export default CourseIdPage;
