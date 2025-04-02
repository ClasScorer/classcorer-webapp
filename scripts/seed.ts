import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, subDays, subHours, format } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    await prisma.studentEngagement.deleteMany();
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
    await prisma.scoringConfig.deleteMany();
    await prisma.thresholdConfig.deleteMany();
    await prisma.decayConfig.deleteMany();
    await prisma.bonusConfig.deleteMany();
    await prisma.advancedConfig.deleteMany();
    await prisma.deadzone.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    const hashedPassword = await hash("admin123", 12);
    const admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@university.edu",
        password: hashedPassword,
        role: "ADMIN",
        department: "Computer Science",
        avatar: "/avatars/admin.png",
        timezone: "America/New_York",
      },
    });
    console.log("Created admin user:", admin.email);

    // Create professor users
    const professors = [];
    const professorData = [
      { name: "Dr. Maria Rodriguez", email: "rodriguez@university.edu", department: "Computer Science" },
      { name: "Dr. James Wilson", email: "wilson@university.edu", department: "Mathematics" },
      { name: "Dr. Li Wei", email: "wei@university.edu", department: "Engineering" },
    ];

    for (const prof of professorData) {
      const professor = await prisma.user.create({
        data: {
          name: prof.name,
          email: prof.email,
          password: await hash("faculty123", 12),
          role: "PROFESSOR",
          department: prof.department,
          avatar: `/avatars/professor-${professors.length + 1}.png`,
          timezone: "America/New_York",
        },
      });
      professors.push(professor);
      console.log("Created professor:", professor.email);
    }

    // Create courses
    const courses = [];
    const courseData = [
      { name: "Introduction to Programming", code: "CS101", description: "Fundamentals of programming with Python", instructorId: professors[0].id },
      { name: "Data Structures & Algorithms", code: "CS201", description: "Advanced data structures and algorithm analysis", instructorId: professors[0].id },
      { name: "Database Systems", code: "CS301", description: "Design and implementation of database systems", instructorId: professors[0].id },
      { name: "Linear Algebra", code: "MATH201", description: "Vector spaces, matrices, and linear transformations", instructorId: professors[1].id },
      { name: "Machine Learning", code: "CS401", description: "Principles and applications of machine learning algorithms", instructorId: professors[2].id },
    ];

    const today = new Date();
    const semesterStart = subDays(today, 60);
    const semesterEnd = addDays(today, 60);

    for (const course of courseData) {
      const newCourse = await prisma.course.create({
        data: {
          name: course.name,
          code: course.code,
          description: course.description,
          instructorId: course.instructorId,
          credits: 3,
          startDate: semesterStart,
          endDate: semesterEnd,
        },
      });
      courses.push(newCourse);
      console.log("Created course:", newCourse.code);
    }

    // Create badges
    const badges = [];
    const badgeData = [
      { name: "Top Performer", description: "Awarded to students with exceptional academic performance", icon: "/badges/top-performer.png" },
      { name: "Perfect Attendance", description: "Awarded for 100% attendance record", icon: "/badges/perfect-attendance.png" },
      { name: "Quiz Master", description: "Achieved perfect scores on five consecutive quizzes", icon: "/badges/quiz-master.png" },
      { name: "Problem Solver", description: "Demonstrated exceptional problem-solving skills", icon: "/badges/problem-solver.png" },
      { name: "Team Player", description: "Outstanding contribution to team projects", icon: "/badges/team-player.png" },
      { name: "Fast Learner", description: "Demonstrated rapid mastery of new concepts", icon: "/badges/fast-learner.png" }
    ];

    for (const badge of badgeData) {
      const newBadge = await prisma.badge.create({
        data: badge
      });
      badges.push(newBadge);
      console.log("Created badge:", newBadge.name);
    }

    // Create students with realistic names and data
    const studentNames = [
      "Ahmed El-Sayed", "Sarah Johnson", "Mohammed Ali", "Emily Chen", "David Kim",
      "Fatima Zahra", "Michael Rodriguez", "Juan Hernandez", "Priya Patel", "James Wilson",
      "Wei Liu", "Olivia Brown", "Hassan Ahmed", "Sofia Garcia", "Omar Khan",
      "Aisha Abdullah", "Carlos Mendoza", "Tina Nguyen", "Raj Sharma", "Zoe Williams"
    ];

    const students = [];

    for (const name of studentNames) {
      const email = name.toLowerCase().replace(/ /g, ".") + "@university.edu";
      
      const student = await prisma.student.create({
        data: {
          name,
          email,
          avatar: `/avatars/student-${Math.floor(Math.random() * 10) + 1}.png`,
          professorId: professors[Math.floor(Math.random() * professors.length)].id,
        },
      });
      
      students.push(student);
      console.log("Created student:", student.email);
    }

    // Enroll students in courses (with varied distribution)
    for (const student of students) {
      // Each student enrolls in 1-3 courses
      const numCourses = Math.floor(Math.random() * 3) + 1;
      
      // Shuffle all courses
      const shuffledCourses = [...courses].sort(() => 0.5 - Math.random());
      const selectedCourses = shuffledCourses.slice(0, numCourses);
      
      for (const course of selectedCourses) {
        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            status: "ACTIVE",
          }
        });
        console.log(`Enrolled ${student.name} in ${course.code}`);
      }
    }
    
    // Create assignments for each course
    const assignmentTypes = ["QUIZ", "ASSIGNMENT", "DISCUSSION", "EXAM", "PROJECT"];
    const assignments = [];

    for (const course of courses) {
      // Create 5-10 assignments per course
      const numAssignments = Math.floor(Math.random() * 6) + 5;
      
      for (let i = 1; i <= numAssignments; i++) {
        const dueDate = addDays(semesterStart, Math.floor(Math.random() * 100) + 10);
        const assignmentType = assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)];
        
        const assignment = await prisma.assignment.create({
          data: {
            title: `${course.code} ${assignmentType.charAt(0) + assignmentType.slice(1).toLowerCase()} ${i}`,
            description: `${assignmentType.charAt(0) + assignmentType.slice(1).toLowerCase()} ${i} for ${course.name}`,
            dueDate,
            pointsPossible: assignmentType === "EXAM" ? 100 : (assignmentType === "PROJECT" ? 150 : 50),
            weight: assignmentType === "EXAM" ? 0.3 : (assignmentType === "PROJECT" ? 0.25 : 0.1),
            assignmentType: assignmentType as any,
            courseId: course.id,
          }
        });
        
        assignments.push(assignment);
        console.log(`Created ${assignmentType.toLowerCase()} for ${course.code}`);
      }
    }

    // Create submissions for students
    for (const student of students) {
      // Get all assignments for courses this student is enrolled in
      const enrollments = await prisma.studentEnrollment.findMany({
        where: { studentId: student.id },
        select: { courseId: true },
      });
      
      const studentCourseIds = enrollments.map(e => e.courseId);
      
      const relevantAssignments = assignments.filter(a => 
        studentCourseIds.includes(a.courseId) && a.dueDate < new Date()
      );
      
      for (const assignment of relevantAssignments) {
        // 80% chance of submitting each assignment
        if (Math.random() < 0.8) {
          const isLate = Math.random() < 0.2;
          const submittedDate = isLate 
            ? addDays(assignment.dueDate, Math.floor(Math.random() * 3) + 1)
            : subDays(assignment.dueDate, Math.floor(Math.random() * 5) + 1);
            
          // Different score distributions for different students
          // Some students consistently do well, others struggle
          const studentQuality = student.id.charCodeAt(0) % 10; // Use student ID to get consistent quality
          const baseScore = 60 + (studentQuality * 4); // Base score 60-96
          const randomVariation = Math.floor(Math.random() * 20) - 10; // -10 to +10
          const calculatedScore = Math.max(0, Math.min(100, baseScore + randomVariation));
          
          const status = Math.random() < 0.7 ? "GRADED" : "SUBMITTED";
          
          await prisma.submission.create({
            data: {
              studentId: student.id,
              assignmentId: assignment.id,
              submittedAt: submittedDate,
              score: status === "GRADED" ? calculatedScore : null,
              feedback: status === "GRADED" ? generateFeedback(calculatedScore) : null,
              isLate,
              status: status as any,
            }
          });
          
          console.log(`Created ${status.toLowerCase()} submission for ${student.name}`);
        }
      }
    }

    // Create lectures for each course
    for (const course of courses) {
      // Create 15-20 lectures per course spread throughout the semester
      const numLectures = Math.floor(Math.random() * 6) + 15;
      const lectureGap = Math.floor(120 / numLectures); // Spread lectures across semester
      
      for (let i = 1; i <= numLectures; i++) {
        const lectureDate = addDays(semesterStart, i * lectureGap);
        // If lecture date is in the past
        const isPast = lectureDate < new Date();
        
        const lecture = await prisma.lecture.create({
          data: {
            title: `Lecture ${i}: ${generateLectureTitle(course.code, i)}`,
            description: `Week ${Math.ceil(i / 2)} lecture for ${course.name}`,
            date: lectureDate,
            duration: 90, // 90 minutes
            courseId: course.id,
            isActive: !isPast && i === numLectures, // Only the most recent future lecture is active
          }
        });
        
        // Create attendance records for past lectures
        if (isPast) {
          const enrollments = await prisma.studentEnrollment.findMany({
            where: { courseId: course.id },
            select: { studentId: true },
          });
          
          for (const enrollment of enrollments) {
            const studentId = enrollment.studentId;
            // Some students miss classes, others are late
            const attendanceRoll = Math.random();
            let status;
            
            // Student quality affects attendance
            const studentQuality = studentId.charCodeAt(0) % 10; // Use student ID to get consistent quality
            const qualityFactor = studentQuality / 10; // 0 to 0.9
            
            if (attendanceRoll < 0.1 - (qualityFactor * 0.05)) {
              status = "ABSENT";
            } else if (attendanceRoll < 0.25 - (qualityFactor * 0.15)) {
              status = "LATE";
            } else {
              status = "PRESENT";
            }
            
            await prisma.attendance.create({
              data: {
                studentId,
                lectureId: lecture.id,
                status: status as any,
                joinTime: status !== "ABSENT" ? subHours(lectureDate, status === "LATE" ? 0 : 0.1) : null,
                leaveTime: status !== "ABSENT" ? addDays(lectureDate, 0.0625) : null, // 90 minutes = 0.0625 days
              }
            });
            
            // Create engagement data for attending students
            if (status !== "ABSENT") {
              const baseEngagement = 50 + (studentQuality * 5);
              const randomVariation = Math.floor(Math.random() * 20) - 10;
              const engagementScore = Math.max(0, Math.min(100, baseEngagement + randomVariation));
              
              let engagementLevel;
              if (engagementScore < 40) engagementLevel = "low";
              else if (engagementScore < 75) engagementLevel = "medium";
              else engagementLevel = "high";
              
              await prisma.studentEngagement.create({
                data: {
                  studentId,
                  lectureId: lecture.id,
                  attentionDuration: Math.floor((engagementScore / 100) * 90 * 60), // Seconds attentive
                  distractionCount: Math.floor((100 - engagementScore) / 10),
                  focusScore: engagementScore,
                  handRaisedCount: Math.floor(Math.random() * 3),
                  engagementLevel,
                  detectionCount: Math.floor(Math.random() * 20) + 80, // 80-100 detections
                  averageConfidence: 0.85 + (Math.random() * 0.15),
                  detectionSnapshots: [],
                }
              });
            }
          }
        }
        
        console.log(`Created lecture ${i} for ${course.code}`);
      }
    }

    // Assign badges to students based on performance
    for (const student of students) {
      // Get student's submissions to calculate performance
      const submissions = await prisma.submission.findMany({
        where: { studentId: student.id, status: "GRADED" },
      });
      
      const attendances = await prisma.attendance.findMany({
        where: { studentId: student.id },
      });
      
      // Calculate average score
      if (submissions.length > 0) {
        const scores = submissions.map(s => s.score || 0);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        // Top Performer badge for students with 90+ average
        if (avgScore >= 90 && scores.length >= 5) {
          await awardBadge(student.id, "Top Performer");
        }
        
        // Quiz Master badge for students with 5+ perfect quiz scores
        const perfectQuizzes = await prisma.submission.count({
          where: {
            studentId: student.id,
            score: 100,
            assignment: {
              assignmentType: "QUIZ"
            }
          }
        });
        
        if (perfectQuizzes >= 3) {
          await awardBadge(student.id, "Quiz Master");
        }
      }
      
      // Perfect Attendance badge for students with all PRESENT attendances
      if (attendances.length > 0) {
        const allPresent = attendances.every(a => a.status === "PRESENT");
        if (allPresent && attendances.length >= 10) {
          await awardBadge(student.id, "Perfect Attendance");
        }
      }
      
      // Randomly award other badges (for demonstration)
      if (Math.random() < 0.3) {
        await awardBadge(student.id, "Problem Solver");
      }
      
      if (Math.random() < 0.3) {
        await awardBadge(student.id, "Team Player");
      }
      
      if (Math.random() < 0.3) {
        await awardBadge(student.id, "Fast Learner");
      }
    }

    // Create some announcements for each course
    const announcementTitles = [
      "Important deadline reminder",
      "Class canceled next week",
      "Office hours change",
      "Additional study resources",
      "Guest lecturer announcement",
      "Midterm exam details",
      "Project requirements update",
      "Grading policy clarification"
    ];
    
    for (const course of courses) {
      // 3-5 announcements per course
      const numAnnouncements = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numAnnouncements; i++) {
        const title = announcementTitles[Math.floor(Math.random() * announcementTitles.length)];
        const isImportant = Math.random() < 0.3;
        const publishedDate = subDays(new Date(), Math.floor(Math.random() * 30) + 1);
        
        await prisma.announcement.create({
          data: {
            title,
            content: generateAnnouncementContent(title, course.name),
            isImportant,
            publishedAt: publishedDate,
            courseId: course.id,
          }
        });
        
        console.log(`Created announcement for ${course.code}: ${title}`);
      }
    }

    // Create default configurations for admin
    await prisma.scoringConfig.create({
      data: {
        userId: admin.id,
      }
    });
    
    await prisma.thresholdConfig.create({
      data: {
        userId: admin.id,
      }
    });
    
    await prisma.decayConfig.create({
      data: {
        userId: admin.id,
      }
    });
    
    await prisma.bonusConfig.create({
      data: {
        userId: admin.id,
      }
    });
    
    await prisma.advancedConfig.create({
      data: {
        userId: admin.id,
      }
    });

    // Count Dr. Maria's unique students
    const drMariaCourses = await prisma.course.findMany({
      where: { instructorId: professors[0].id },
      select: { id: true }
    });

    const drMariaStudents = await prisma.studentEnrollment.findMany({
      where: {
        courseId: {
          in: drMariaCourses.map(c => c.id)
        }
      },
      select: {
        studentId: true
      },
      distinct: ['studentId']
    });

    console.log(`\nDr. Maria Rodriguez has ${drMariaStudents.length} unique students across her courses (CS101, CS201, CS301)`);

    console.log("\nDatabase seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions
async function awardBadge(studentId: string, badgeName: string) {
  const badge = await prisma.badge.findFirst({
    where: { name: badgeName }
  });
  
  if (badge) {
    await prisma.studentBadge.create({
      data: {
        studentId,
        badgeId: badge.id,
      }
    });
    console.log(`Awarded ${badgeName} badge to student ${studentId}`);
  }
}

function generateFeedback(score: number): string {
  if (score >= 90) {
    return "Excellent work! You've demonstrated a thorough understanding of the material.";
  } else if (score >= 80) {
    return "Good job! You've shown a solid grasp of the concepts with a few minor errors.";
  } else if (score >= 70) {
    return "Satisfactory work with good effort, but there's room for improvement in understanding key concepts.";
  } else if (score >= 60) {
    return "You've met the minimum requirements, but should review the material more carefully.";
  } else {
    return "This submission needs significant improvement. Please review the course materials and consider visiting office hours.";
  }
}

function generateLectureTitle(courseCode: string, lectureNumber: number): string {
  const cs101Titles = [
    "Introduction to Programming Concepts",
    "Variables and Data Types",
    "Control Structures",
    "Functions and Modules",
    "Lists and Dictionaries",
    "File I/O",
    "Exception Handling",
    "Object-Oriented Programming Basics",
    "Classes and Objects",
    "Inheritance and Polymorphism",
    "Recursion",
    "Algorithms Introduction",
    "Debugging Techniques",
    "GUI Programming",
    "Final Project Overview"
  ];
  
  const cs201Titles = [
    "Review of Programming Fundamentals",
    "Algorithm Analysis and Big O Notation",
    "Arrays and Linked Lists",
    "Stacks and Queues",
    "Trees and Binary Search Trees",
    "Heaps and Priority Queues",
    "Graphs and Graph Algorithms",
    "Hash Tables",
    "Sorting Algorithms",
    "Searching Algorithms",
    "Dynamic Programming",
    "Greedy Algorithms",
    "Divide and Conquer Strategies",
    "Advanced Data Structures",
    "Algorithm Design Patterns"
  ];
  
  const cs301Titles = [
    "Database Concepts and Architecture",
    "Entity-Relationship Model",
    "Relational Data Model",
    "SQL Fundamentals",
    "Advanced SQL Queries",
    "Normalization",
    "Database Design",
    "Indexing and Query Optimization",
    "Transaction Processing",
    "Concurrency Control",
    "Database Security",
    "NoSQL Databases",
    "Data Warehousing",
    "Big Data Processing",
    "Database Administration"
  ];
  
  const math201Titles = [
    "Vector Spaces",
    "Linear Transformations",
    "Matrix Operations",
    "Systems of Linear Equations",
    "Determinants",
    "Eigenvalues and Eigenvectors",
    "Diagonalization",
    "Inner Product Spaces",
    "Orthogonality",
    "Least Squares Approximation",
    "Singular Value Decomposition",
    "Applications in Computer Graphics",
    "Linear Programming",
    "Markov Chains",
    "Applications in Machine Learning"
  ];
  
  const cs401Titles = [
    "Introduction to Machine Learning",
    "Supervised Learning",
    "Linear Regression",
    "Logistic Regression",
    "Decision Trees",
    "Neural Networks",
    "Support Vector Machines",
    "Unsupervised Learning",
    "Clustering Algorithms",
    "Dimensionality Reduction",
    "Ensemble Methods",
    "Reinforcement Learning",
    "Deep Learning",
    "Natural Language Processing",
    "Ethics in AI and Machine Learning"
  ];
  
  let titles;
  switch (courseCode) {
    case "CS101": titles = cs101Titles; break;
    case "CS201": titles = cs201Titles; break;
    case "CS301": titles = cs301Titles; break;
    case "MATH201": titles = math201Titles; break;
    case "CS401": titles = cs401Titles; break;
    default: titles = ["Lecture " + lectureNumber];
  }
  
  // Get title based on lecture number, or use a default if out of range
  return titles[lectureNumber - 1] || `Advanced Topics ${lectureNumber}`;
}

function generateAnnouncementContent(title: string, courseName: string): string {
  switch (title) {
    case "Important deadline reminder":
      return `Remember that the next assignment for ${courseName} is due this Friday at 11:59 PM. Late submissions will be penalized according to the course policy.`;
    case "Class canceled next week":
      return `Due to a scheduling conflict, the ${courseName} class scheduled for next Tuesday will be canceled. We will post additional materials to cover the content.`;
    case "Office hours change":
      return `Office hours for ${courseName} will be moved to Thursdays 2-4 PM starting next week. Please adjust your schedules accordingly.`;
    case "Additional study resources":
      return `We've added supplementary materials for ${courseName} in the course resources section. These include practice problems and additional readings.`;
    case "Guest lecturer announcement":
      return `We're excited to announce that Dr. Jane Smith from Industry Labs will be giving a guest lecture next week in ${courseName}. Attendance is highly recommended.`;
    case "Midterm exam details":
      return `The midterm exam for ${courseName} will be held on March 15th. It will cover all material from lectures 1-7. A study guide has been posted.`;
    case "Project requirements update":
      return `We've updated the requirements for the final project in ${courseName}. Please review the changes in the project description document.`;
    case "Grading policy clarification":
      return `This is a clarification on the grading policy for ${courseName}. Participation accounts for 15% of your final grade, and will be assessed based on both in-class and online contributions.`;
    default:
      return `Important announcement for ${courseName}. Please read carefully and contact the instructor if you have any questions.`;
  }
}

main(); 