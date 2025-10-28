import getChapter from "@/actions/get-chapters";
import { Banner } from "@/components/banner";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import VideoPlayer from "./_components/video-player";
import CourseEnrollmentButton from "./_components/course-enrolment-button";
import { Separator } from "@/components/ui/separator";
import { Preview } from "@/components/preview";

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

  const { chapterId, courseId } = await params;

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
    <>
      <div>
        {userProgress?.isCompleted && (
          <Banner
            variant="success"
            label="You already completed this chapter"
          />
        )}
        {isLocked && (
          <Banner
            variant="warning"
            label="You need to purchase this course to watch this chapter."
          />
        )}
        <div>
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
        <div className="p-4 flex flex-col md:flex-row items-center justify-between">
          <h2 className="text-2xl font-semibold mb-2">{chapter.title}</h2>
          {purchase ? (
            {
              /**ProgressButton */
            }
          ) : (
            <CourseEnrollmentButton
              courseId={params.courseId}
              price={course.price}
            />
          )}
        </div>
        <Separator />
        <div>
          <Preview value={chapter.description} />
        </div>
        {!!attachments.length && (
          <>
            <Separator />
            <div className="p-4">
              {attachments.map((attachment) => (
                <a
                  href={attachment.url}
                  target="_blank"
                  key={attachment.id}
                  className="flex items-center p-3 w-full bg-sky-200 border text-sky-700 rounded-md hover:underline"
                >
                  <p>{attachment.name}</p>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ChapterIdPage;
