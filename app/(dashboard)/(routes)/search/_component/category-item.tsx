"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconType } from "react-icons";
import qs from "query-string";

interface CategoryItemProps {
  label: string;
  value?: string;
  icon?: IconType;
}

const CategoryItem = ({ label, value, icon: Icon }: CategoryItemProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategoryId = searchParams.get("categoryId");
  const isSelected = currentCategoryId === value;

  const onClick = () => {
    const currentQuery = qs.parse(searchParams.toString());

    const updatedQuery = {
      ...currentQuery,
      categoryId: isSelected ? null : value,
    };

    const url = qs.stringifyUrl(
      {
        url: pathname,
        query: updatedQuery,
      },
      { skipNull: true, skipEmptyString: true }
    );

    router.push(url);
  };

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "py-2 px-3 text-sm border border-slate-200 rounded-full flex items-center gap-x-2 cursor-pointer transition-colors",
        "hover:bg-sky-700 hover:text-white",
        isSelected && "border-sky-700 bg-sky-100 text-sky-800"
      )}
    >
      {Icon && <Icon size={18} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
};

export default CategoryItem;
