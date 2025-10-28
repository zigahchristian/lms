"use client"

import { BarChart, Compass, Layout, List } from "lucide-react";
import SidebarItem from "./sidebar-item";
import { usePathname } from "next/navigation";

const guestRoutes = [
    {
        label:"Dashboard",
        icon: Layout,
        href:"/"
    },
    {
        label:"Browse",
        icon: Compass,
        href:"/search"
    }
];

const teacherRoutes = [
    {
        label:"Courses",
        icon: List,
        href:"/teacher/courses"
    },
    {
        label:"Analytics",
        icon: BarChart,
        href:"/teacher/analytics"
    }
];




const SidebarRoutes = () => {

const pathname = usePathname();


const isTeacherPage = pathname?.startsWith("/teacher");

const routes = isTeacherPage? teacherRoutes: guestRoutes;
    return (  
        <div className="flex flex-col w-full">
            {routes.map((item)=>(
                <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}/>
            ))}
        </div>
    );
}                       

 
export default SidebarRoutes;