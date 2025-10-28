import prisma from "@/lib/db";

console.log("Starting .....");

async function main() {
  try {
    await prisma.category.createMany({
      data: [
        { name: "Ditigal literacy" },
        { name: "Music" },
        { name: "Networking" },
        { name: "Web Design" },
        { name: "Web Development" },
        { name: "Python Developement" },
      ],
    });
    console.log("success");
  } catch (error) {
    console.log("Erro seeding the database categories", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
