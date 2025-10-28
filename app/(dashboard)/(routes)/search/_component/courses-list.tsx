import { Category, Course } from "@/lib/generated/prisma";
import CourseCard from "./course-card";

type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: { id: string }[];
  progress: number | null;
};

interface CourseListProps {
  items: CourseWithProgressWithCategory[];
}

const CoursesList = ({ items }: CourseListProps) => {
  return (
    <div>
      <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:gid-cols-4 2xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <CourseCard
            key={item.id}
            id={item.id}
            title={item.title}
            image={item.image!}
            price={item.price!}
            progress={item.progress}
            category={item?.category!.name}
            chaptersLength={item.chapters.length}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center">No Courses found</div>
      )}
    </div>
  );
};

export default CoursesList;
