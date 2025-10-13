import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import  prisma  from "../../../lib/db"

export async function POST(req: Request) {
    try {
        const {userId}  = await auth();
        const { title } = await req.json();

        // Check User ID
        if (!userId) {
            return new NextResponse("Unauthorized", {status: 401})
        }

        // Create a new Course
        const course = await prisma.course.create({
            data:{
                userId,
                title,
            }
        })

        console.log(course)

 
    return NextResponse.json({course}, { status: 201 });
    
    } catch (error) {
        console.log("[COURSES]", error);
        return new NextResponse("Internal Error", { status: 500 } );
    }
}


