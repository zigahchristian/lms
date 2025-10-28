import { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const backgroundVariants = cva(
  "rounded-full flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-sky-100",
        danger: "bg-destructive-100",
        success: "bg-emerald-100",
      },
      size: {
        default: "p-2",
        sm: "p-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const iconVariants = cva("", {
  variants: {
    variant: {
      default: "text-sky-700",
      danger: "text-red-500 hover:text-red-700",
      success: "text-emerald-700",
    },
    size: {
      default: "h-8 w-8",
      sm: "h-4 w-4",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type BackgroundVariantsProps = VariantProps<typeof backgroundVariants>;
type IconVariantsProps = VariantProps<typeof iconVariants>;

interface IconBadgeProps extends BackgroundVariantsProps, IconVariantsProps {
  icon: LucideIcon;
  className?: string;
  onClick?: () => void;
}

export const IconBadge = ({
  icon: Icon,
  variant,
  size,
  className,
  onClick,
}: IconBadgeProps) => {
  return (
    <div
      className={cn(
        backgroundVariants({ variant, size }),
        onClick && "cursor-pointer hover:opacity-75 transition-opacity",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <Icon className={cn(iconVariants({ variant, size }))} />
    </div>
  );
};
