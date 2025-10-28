import prisma from "@/lib/db";
import Categories from "./_component/category";
import SearchInput from "@/components/search-input";
import { getCourses } from "@/actions/get-courses";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CoursesList from "./_component/courses-list";

interface SearchPageProps {
  searchParams: {
    title?: string;
    categoryId?: string;
  };
}

const SearchPage = async ({ searchParams }: SearchPageProps) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    return redirect("/");
  }

  // fetch categories
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // fetch courses filtered by category or title
  const courses = await getCourses({
    userId,
    title: (await searchParams)?.title,
    categoryId: (await searchParams)?.categoryId,
  });

  return (
    <>
      <div className="px-6 pt-6 md:hidden mb-0 block">
        <SearchInput />
      </div>
      <div className="p-6 space-y-4">
        <Categories items={categories} />
        <CoursesList items={courses} />
      </div>
    </>
  );
};

export default SearchPage;
