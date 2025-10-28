import { IconBadge } from "@/components/icon-badge";
import formatPrice from "@/lib/format-price";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CourseCardProps {
  id: string;
  title: string;
  image: string;
  chaptersLength: number;
  price: number;
  progress: number | null;
  category: string | null;
}

const CourseCard = ({
  id,
  title,
  image,
  chaptersLength,
  price,
  category,
  progress,
}: CourseCardProps) => {
  return (
    <Link href={`/courses/${id}`}>
      <div className="group-hover:shadow-sm transition overflow-hidden border rounded-lg p-3 h-full">
        <div className="relative w-full aspect-video rounded-md overflow-hidden">
          <Image fill className="object-cover " alt={title} src={image} />
        </div>
        <div className="flex flex-col pt-2">
          <div className="text-lg md:text-base font-medium group-hover:text-skyt-700 transition line-clamp-2">
            {title}
          </div>
          <p className="text-xs text-muted-foreground">{category}</p>
        </div>
        <div className="my-3 flex items-center gapt-x-2 text-sm md:text-xs">
          <IconBadge size="sm" icon={BookOpen} />
          <span className="ml-2">
            {chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}
          </span>
        </div>
        {progress !== null ? (
          <div> TODO: Progress Component</div>
        ) : (
          <p className="text-md md:text-sm font-medium">{formatPrice(price)}</p>
        )}
      </div>
    </Link>
  );
};

export default CourseCard;
