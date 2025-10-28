import { Menu } from "lucide-react";
import { Course, Chapter, UserProgress } from "@/lib/generated/prisma";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import NavbarRoutes from "./navbar-routes";
import CourseSidebar from "./course-sidebar";

interface CourseMobileSidebarProps {
  course: Course & {
    chapters: (Chapter & {
      userProgress: UserProgress[] | null;
    })[];
  };
  progressCount: number;
}

const CourseMobileSidebar = ({
  course,
  progressCount,
}: CourseMobileSidebarProps) => {
  return (
    <div className="md:hidden h-[80px] w-full border-b flex items-center px-6 bg-white shadow-sm fixed inset-x-0 top-0 z-50">
      <Sheet>
        <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
          <Menu size={28} /> {/* Slightly larger icon for mobile */}
        </SheetTrigger>

        <SheetContent side="left" className="w-64 p-0 border-r">
          <CourseSidebar course={course} progressCount={progressCount} />
        </SheetContent>
      </Sheet>

      <NavbarRoutes />
    </div>
  );
};

export default CourseMobileSidebar;
