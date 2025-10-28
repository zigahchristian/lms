"use client";
import { Category } from "@/lib/generated/prisma";
import { IconType } from "react-icons";
import { FcMusic } from "react-icons/fc";

import { FaNetworkWired, FaPython } from "react-icons/fa";

import { CgWebsite } from "react-icons/cg";

import { MdDeveloperMode } from "react-icons/md";

import { GiPc } from "react-icons/gi";
import CategoryItem from "./category-item";

const iconMap: Record<Category["name"], IconType> = {
  Music: FcMusic,
  "Digital Literacy": GiPc,
  "Web Design": CgWebsite,
  "Web Development": MdDeveloperMode,
  "Python Developement": FaPython,
  Networking: FaNetworkWired,
};

interface CategoriesProps {
  items: Category[];
}

const Categories = ({ items }: CategoriesProps) => {
  return (
    <div className=" flex items-center gap-x-2 overflow-x-auto pb-2">
      {items.map((item) => (
        <CategoryItem
          key={item.id}
          label={item.name}
          icon={iconMap[item.name]}
          value={item.id}
        />
      ))}
    </div>
  );
};

export default Categories;
