"use client";

import { Button } from "@/components/ui/button";
import formatPrice from "@/lib/format-price";

interface CourseEnrollmentButtonProps {
  price: number;
  courseId: string;
}

const CourseEnrollmentButton = ({
  price,
  courseId,
}: CourseEnrollmentButtonProps) => {
  return (
    <Button size="sm" className="w-full md:w-auto">
      Enroll for {formatPrice(price)}
    </Button>
  );
};

export default CourseEnrollmentButton;
