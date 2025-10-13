import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

const CoursesPage = () => {
    return (  
        <div className="p-6">
            <Link href="/teacher/create">
            <Button>New Course <span><Plus/></span></Button>
            </Link>
        </div>
    );
}
 
export default CoursesPage;