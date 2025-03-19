import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    await prisma.attendance.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.studentBadge.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.lecture.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.studentEnrollment.deleteMany();
    await prisma.student.deleteMany();
    await prisma.course.deleteMany();
    await prisma.canvasConfig.deleteMany();
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
          credits: 3,
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
        },
      });
      courses.push(course);
      console.log("Created course:", course.code);
    }

    // Create badges
    const badges = [];
    const badgeNames = ["Top Performer", "Perfect Attendance", "Quiz Master"];
    for (const name of badgeNames) {
      const badge = await prisma.badge.create({
        data: {
          name,
          description: `Award for ${name}`,
          icon: `/badges/${name.toLowerCase().replace(" ", "-")}.png`,
        }
      });
      badges.push(badge);
      console.log("Created badge:", badge.name);
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
      
      const student = await prisma.student.create({
        data: {
          name,
          email,
          avatar: `/avatars/${Math.floor(Math.random() * 5) + 1}.png`,
          professorId: admin.id,
        },
      });
      
      // Enroll student in random course
      const randomCourse = courses[Math.floor(Math.random() * courses.length)];
      await prisma.studentEnrollment.create({
        data: {
          studentId: student.id,
          courseId: randomCourse.id,
          status: "ACTIVE",
        }
      });
      
      // Assign badges to student
      for (const badge of badges) {
        await prisma.studentBadge.create({
          data: {
            studentId: student.id,
            badgeId: badge.id,
          }
        });
      }
      
      console.log("Created student:", student.email);
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