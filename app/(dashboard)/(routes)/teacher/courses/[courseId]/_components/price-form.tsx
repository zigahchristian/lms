"use client";
import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PriceFormProps {
  initialData: {
    price: number | null | string;
  };
  courseId: string;
}

// Enhanced validation schema
const formSchema = z.object({
  price: z
    .string()
    .min(1, { message: "Price is required" })
    .regex(/^\d+(\.\d{1,2})?$/, { message: "Please enter a valid price" })
    .refine((val) => parseFloat(val) >= 0, {
      message: "Price cannot be negative",
    }),
});

const PriceForm = ({ initialData, courseId }: PriceFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // Format initial price for display and form
  const formatPrice = (price: number | null | string): string => {
    if (price === null || price === "" || price === undefined) return "";
    return typeof price === "string" ? price : price.toString();
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: formatPrice(initialData?.price),
    },
  });

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
    // Reset form when canceling edit
    if (isEditing) {
      form.reset({ price: formatPrice(initialData?.price) });
    }
  };

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, {
        price: parseFloat(values.price), // Convert to number for API
      });
      toast.success("Price updated successfully!");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Price update error:", error);
    }
  };

  const displayPrice = initialData?.price
    ? `GH¢ ${parseFloat(initialData.price.toString()).toFixed(2)}`
    : "No price set";

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course Price
        <Button variant="ghost" onClick={toggleEdit} type="button">
          {isEditing ? (
            "Cancel"
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Price
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <p
          className={cn(
            "text-sm mt-2",
            !initialData?.price && "text-slate-500 italic"
          )}
        >
          {displayPrice}
        </p>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full mt-4 space-y-4"
          >
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Price (GH¢)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500">
                        GH¢
                      </span>
                      <Input
                        placeholder="0.00"
                        {...field}
                        disabled={isSubmitting}
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-12"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="mt-4"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default PriceForm;
