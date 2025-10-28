import prisma from "@/lib/db";
import { Attachment, Chapter } from "@/lib/generated/prisma";

interface GetChapterProps {
  userId: string;
  courseId: string;
  chapterId: string;
}

const getChapter = async ({ userId, courseId, chapterId }: GetChapterProps) => {
  console.log(courseId, chapterId);

  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: courseId,
        },
      },
    });

    const course = await prisma.course.findUnique({
      where: {
        isPublished: true,
        id: courseId,
      },
      select: {
        price: true,
      },
    });

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        isPublished: true,
      },
    });

    if (!chapter || !course) {
      throw new Error("chapter or course not found");
    }

    const attachments: Attachment[] = [];
    let nextChapter: Chapter | null = null;

    if (chapter.isFree || purchase) {
      nextChapter = await prisma.chapter.findFirst({
        where: {
          courseId: courseId,
          isPublished: true,
          position: {
            gt: chapter?.position,
          },
        },
        orderBy: {
          position: "asc",
        },
      });
    }

    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
    });

    return {
      chapter,
      course,
      attachments,
      nextChapter,
      userProgress,
      purchase,
    };
  } catch (error) {
    console.log("[GET_CHAPTER", error);
    return {
      chapter: null,
      course: null,
      attachments: [],
      nextChapter: null,
      userProgress: null,
      purchase: null,
    };
  }
};

export default getChapter;
