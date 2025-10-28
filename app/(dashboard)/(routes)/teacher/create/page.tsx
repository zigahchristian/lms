'use client'
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as z from "zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";


const formSchema = z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters."})
    
})



const CreatePage = () => {
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: ""
        }
    });

    const { isSubmitting, isValid } = form.formState;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
         
            const response = await axios.post("/api/courses", values);
            router.push(`/teacher/courses/${response.data.course.id}`);
            toast.success("Course created successfully!");
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
            console.log(error);
        }
    }


    return (  
        <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full  p-6 ">
           <div>
                <h1 className="text-2xl"> Name  Your Course</h1>
                <p>
                    What would you like to name your course? You can always change it later.
                </p>
                 <Form {...(form)}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Course Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Learn Spanish" {...field} />
                                </FormControl>
                                <FormDescription>
                                    What will you teach in this course?
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center gap-x-2">
                        <Link href="/teacher/courses" className="text-sm">
                            <Button type="button" variant="ghost">Back to courses</Button>
                        </Link>
                        <Button  type="submit" disabled={!isValid || isSubmitting}>Continue</Button>
                    </div>

                
                </form>
            </Form>
            </div>
           


        </div>
    );
}
 
export default CreatePage;

