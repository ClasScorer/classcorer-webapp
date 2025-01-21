import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    await prisma.event.deleteMany();
    await prisma.student.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    const hashedPassword = await hash("admin123", 12);
    const admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@university.edu",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log("Created admin user:", admin.email);

    // Create courses
    const courses = [];
    for (let i = 1; i <= 5; i++) {
      const course = await prisma.course.create({
        data: {
          name: `Computer Science ${i}`,
          code: `CS${i}01`,
          description: `Advanced topics in computer science - Level ${i}`,
          instructorId: admin.id,
          status: "Active",
          week: i,
          progress: 75 + i,
          credits: 3,
          average: 85 + i,
          attendance: 90 + i,
          passRate: 95,
          classAverage: 88 + i,
          totalStudents: 20 + i,
          atRiskCount: 2,
        },
      });
      courses.push(course);
      console.log("Created course:", course.code);
    }

    // Create students
    const studentNames = [
      "Ahmed El-Sayed",
      "Sarah Johnson",
      "Mohammed Ali",
      "Emily Chen",
      "David Kim"
    ];

    for (const name of studentNames) {
      const email = name.toLowerCase().replace(" ", ".") + "@university.edu";
      const randomCourse = courses[Math.floor(Math.random() * courses.length)];
      
      const student = await prisma.student.create({
        data: {
          name,
          email,
          avatar: `/avatars/${Math.floor(Math.random() * 5) + 1}.png`,
          score: Math.floor(Math.random() * 1000) + 2000,
          level: Math.floor(Math.random() * 10) + 10,
          average: Math.floor(Math.random() * 15) + 80,
          attendance: Math.floor(Math.random() * 10) + 90,
          submissions: Math.floor(Math.random() * 10) + 15,
          lastSubmission: new Date(),
          status: "Active",
          trend: Math.random() > 0.5 ? "up" : "down",
          badges: ["Top Performer", "Perfect Attendance", "Quiz Master"],
          progress: Math.floor(Math.random() * 20) + 80,
          streak: Math.floor(Math.random() * 10) + 5,
          grade: "A",
          courseId: randomCourse.id,
        },
      });
      console.log("Created student:", student.email);
    }

    // Create events
    const eventTypes = ["Assignment", "Quiz", "Exam", "Project", "Presentation"];
    for (let i = 0; i < 10; i++) {
      const randomCourse = courses[Math.floor(Math.random() * courses.length)];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30));
      
      const event = await prisma.event.create({
        data: {
          title: `${randomType} - ${randomCourse.code}`,
          date: futureDate,
          time: "14:00",
          type: randomType,
          description: `${randomType} for ${randomCourse.name}`,
          courseId: randomCourse.id,
        },
      });
      console.log("Created event:", event.title);
    }

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main(); 