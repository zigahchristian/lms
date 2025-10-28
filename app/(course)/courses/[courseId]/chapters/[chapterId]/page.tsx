import getChapter from "@/actions/get-chapters";
import { Banner } from "@/components/banner";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import VideoPlayer from "./_components/video-player";

interface ChapterIdPageProps {
  params: {
    courseId: string;
    chapterId: string;
  };
}

const ChapterIdPage = async ({ params }: ChapterIdPageProps) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  // Check if user is authenticated
  if (!userId) {
    return redirect("/auth/signin");
  }

  const { chapterId, courseId } = params;

  const { chapter, course, attachments, nextChapter, userProgress, purchase } =
    await getChapter({
      userId,
      chapterId,
      courseId,
    });

  if (!chapter || !course) {
    return redirect("/");
  }

  const isLocked = !chapter.isFree && !purchase;

  return (
    <div>
      {userProgress?.isCompleted && (
        <Banner variant="success" label="You already completed this chapter" />
      )}
      {isLocked && (
        <Banner
          variant="warning"
          label="You need to purchase this course to watch this chapter."
        />
      )}
      <div className="flex flex-col items-center max-w-4xl mx-auth pb-20">
        <div className="p-4 flex flex-col items-center justify-center">
          <VideoPlayer
            chapter={chapter}
            courseId={courseId}
            chapterId={chapterId}
            nextChapter={nextChapter}
            userProgress={userProgress}
            purchase={purchase}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
};

export default ChapterIdPage;
