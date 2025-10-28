import { Category, Course } from "@/lib/generated/prisma";
import prisma from "@/lib/db";
import { getProgress } from "./get-progress";

type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: string[];
  progress: number | null;
};

type GetCourses = {
  userId: string;
  title?: string;
  categoryId?: string;
};

export const getCourses = async ({
  userId,
  title,
  categoryId,
}: GetCourses): Promise<CourseWithProgressWithCategory[]> => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        isPublished: true,
        ...(title && { title: { contains: title } }),
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
        chapters: {
          where: { isPublished: true },
          select: { id: true },
        },
        purchases: {
          where: { userId },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const coursesWithProgress: CourseWithProgressWithCategory[] =
      await Promise.all(
        courses.map(async (course) => {
          const chapterIds = course.chapters.map((ch) => ch.id); // ✅ flatten chapter IDs

          if (course.purchases.length === 0) {
            return {
              ...course,
              chapters: chapterIds,
              progress: null,
            };
          }

          const progressPercentage = await getProgress(userId, course.id);

          return {
            ...course,
            chapters: chapterIds,
            progress: progressPercentage,
          };
        })
      );

    return coursesWithProgress;
  } catch (error) {
    console.error("[GET_COURSES]", error);
    throw new Error("Failed to fetch courses");
  }
};
