import prisma from "@/lib/db";

export const getProgress = async (
  userId: string,
  CourseId: string
): Promise<number> => {
  try {
    const pusblishedChapters = await prisma.chapter.findMany({
      where: {
        courseId: CourseId,
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    const publishedChapterIds = pusblishedChapters.map((chapter) => chapter.id);

    const validCompletedChapters = await prisma.userProgress.count({
      where: {
        userId: userId,
        chapterId: {
          in: publishedChapterIds,
        },
        isCompleted: true,
      },
    });

    const progressPercentage =
      (validCompletedChapters / publishedChapterIds.length) * 100;
    return progressPercentage;
  } catch (error) {
    console.log("[GET_PROGRESS]", error);
    return 0;
  }
};
