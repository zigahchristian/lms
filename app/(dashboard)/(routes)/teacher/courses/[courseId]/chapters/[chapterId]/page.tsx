import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, LayoutDashboard, Video } from "lucide-react";

import { IconBadge } from "@/components/icon-badge";
import ChapterTitleForm from "./_components/chapter-title-form";
import ChapterDescriptionForm from "./_components/chapter-description-form";
import ChapterAccessForm from "./_components/chapter-access-form";
import ChapterVideoForm from "./_components/chapter-video-form";
import { Banner } from "@/components/banner";
import ChapterActions from "./_components/chapter-action";

interface ChapterIdPageProps {
  params: {
    courseId: string;
    chapterId: string;
  };
}

const ChapterIdPage = async ({ params }: ChapterIdPageProps) => {
  const courseId = (await params).courseId;
  const chapterId = (await params).chapterId;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
  });

  if (!chapter) redirect("/");

  // progress tracker
  const requiredFields = [chapter.title, chapter.description, chapter.videoUrl];
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${requiredFields.length})`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!chapter.isPublished && (
        <Banner variant="warning" label="This chapter is unpublished" />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/teacher/courses/${courseId}`}
            className="flex items-center text-sm hover:opacity-75 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to course setup
          </Link>
        </div>

        <div className="flex flex-row items-center justify-between gap-y-2 mb-8">
          <div>
            <h1 className="text-2xl font-medium">Chapter Creation</h1>
            <span className="text-sm text-slate-700">
              Complete all fields {completionText}
            </span>
          </div>
          <div>
            <ChapterActions
              disabled={!isComplete}
              courseId={courseId}
              chapterId={chapterId}
              isPublished={chapter.isPublished}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {/* Left column */}
          <div className="space-y-4">
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
              <h2 className="text-xl">Customize your chapter</h2>
            </div>

            <ChapterTitleForm
              initialData={chapter}
              courseId={courseId}
              chapterId={chapterId}
            />

            <ChapterDescriptionForm
              initialData={chapter}
              courseId={courseId}
              chapterId={chapterId}
            />
            <div className="space-y-4">
              <div className="flex items-center gap-x-2">
                <IconBadge icon={Eye} />
                <h2 className="text-xl">Access Settings</h2>
              </div>

              <ChapterAccessForm
                initialData={chapter}
                courseId={courseId}
                chapterId={chapterId}
              />
            </div>

            {/* Right column */}
          </div>
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={Video} />
              <h2 className="text-xl">Add a video</h2>
            </div>
            <ChapterVideoForm
              initialData={chapter}
              courseId={courseId}
              chapterId={chapterId}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterIdPage;
