import { PrismaClient, User, Course, Assignment, Badge } from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, subDays, subHours, format } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting database seeding process...");
    
    // Clear existing data
    console.log("Clearing existing data...");
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
    console.log("All existing data cleared");

    // Create test user for login
    const testUserPassword = await hash("password", 12);
    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: testUserPassword,
        role: "PROFESSOR",
        department: "Test Department",
        avatar: "/avatars/test-user.png",
        timezone: "America/New_York",
      },
    });
    console.log("Created test user for login:", testUser.email);

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
    const professors: User[] = [];
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
    const courses: Course[] = [];
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
    const badges: Badge[] = [];
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
    const assignments: Assignment[] = [];

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
        studentCourseIds.includes(a.courseId) && new Date(a.dueDate) < new Date()
      );
      
      for (const assignment of relevantAssignments) {
        // 80% chance of submitting each assignment
        if (Math.random() < 0.8) {
          const isLate = Math.random() < 0.2;
          const submittedDate = isLate 
            ? addDays(new Date(assignment.dueDate), Math.floor(Math.random() * 3) + 1)
            : subDays(new Date(assignment.dueDate), Math.floor(Math.random() * 5) + 1);
            
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
        if (lectureDate < today) {
          const title = generateLectureTitle(course.code, i);
          const date = new Date(lectureDate);
          date.setHours(9 + Math.floor(Math.random() * 8)); // Between 9 AM and 5 PM
          date.setMinutes(Math.random() < 0.5 ? 0 : 30);
          
          const duration = 60; // 1 hour lectures (in minutes)
          
          const lecture = await prisma.lecture.create({
            data: {
              courseId: course.id,
              title,
              description: `Lecture ${i} for ${course.name}`,
              date,
              duration,
              isActive: false, // Past lectures are not active
            }
          });
          
          console.log(`Created lecture ${i} for ${course.code}`);
          
          // Generate random attendance for this lecture
          if (lectureDate < subDays(today, 1)) { // Only for lectures that have definitely passed
            const courseEnrollments = await prisma.studentEnrollment.findMany({
              where: { courseId: course.id },
              select: { studentId: true },
            });
            
            for (const enrollment of courseEnrollments) {
              // 80% chance of attending each lecture
              if (Math.random() < 0.8) {
                await prisma.attendance.create({
                  data: {
                    studentId: enrollment.studentId,
                    lectureId: lecture.id,
                    status: Math.random() < 0.9 ? "PRESENT" : "LATE",
                    joinTime: date, // Use lecture date as check-in time
                  }
                });
              }
            }
            console.log(`Created attendance records for lecture ${i} of ${course.code}`);
          }
        }
      }
    }

    // Create student engagement data for recent lectures
    const recentLectures = await prisma.lecture.findMany({
      where: {
        date: {
          gte: subDays(today, 14), // Last two weeks
          lte: today,
        }
      },
      include: {
        course: true
      }
    });
    
    for (const lecture of recentLectures) {
      // For each student enrolled in this course
      const enrolledStudents = await prisma.studentEnrollment.findMany({
        where: { courseId: lecture.courseId },
        select: { studentId: true }
      });
      
      for (const enrollment of enrolledStudents) {
        // Generate engagement data points for this student in this lecture
        const attendanceRecord = await prisma.attendance.findFirst({
          where: {
            studentId: enrollment.studentId,
            lectureId: lecture.id
          }
        });
        
        // Only generate engagement for students who attended
        if (attendanceRecord) {
          const lectureDate = new Date(lecture.date);
          const totalMinutes = lecture.duration || 60;
          
          // Calculate average engagement over the lecture instead of creating multiple entries
          let totalEngagementScore = 0;
          let dataPoints = 0;
          
          // Generate data points for calculation only (not for DB insertion)
          for (let minute = 0; minute < totalMinutes; minute += 5) {
            const baseEngagement = 0.7 + (Math.random() * 0.3);
            const timeFactor = 1 - (minute / totalMinutes * 0.5); // Gradually decrease
            let pointScore = Math.floor((baseEngagement * timeFactor) * 100);
            
            // Occasional dips in engagement
            if (Math.random() < 0.2) {
              pointScore = Math.floor(pointScore * 0.6);
            }
            
            totalEngagementScore += pointScore;
            dataPoints++;
          }
          
          // Calculate average
          const avgEngagementScore = Math.floor(totalEngagementScore / (dataPoints || 1));
          
          // Create a single engagement record with the average score
          await prisma.studentEngagement.create({
            data: {
              studentId: enrollment.studentId,
              lectureId: lecture.id,
              timestamp: lectureDate,
              engagementLevel: getEngagementLevel(avgEngagementScore),
              detectionCount: Math.floor(Math.random() * 10) + 1,
              focusScore: avgEngagementScore,
              attentionDuration: Math.floor(Math.random() * 300),
              distractionCount: Math.floor(Math.random() * 5),
              handRaisedCount: Math.floor(Math.random() * 2),
              averageConfidence: 0.7 + (Math.random() * 0.3),
              detectionSnapshots: [],
            }
          });
          
          console.log(`Created engagement data for student ${enrollment.studentId} in lecture ${lecture.id}`);
        }
      }
    }

    // Award badges to some students
    const topPerformers = await prisma.submission.groupBy({
      by: ['studentId'],
      _avg: {
        score: true,
      },
      having: {
        score: {
          _avg: {
            gt: 90
          }
        }
      }
    });
    
    for (const student of topPerformers) {
      await awardBadge(student.studentId, "Top Performer");
    }
    
    // Award perfect attendance badges
    const students2 = await prisma.student.findMany({
      include: {
        enrollments: true,
        attendances: true
      }
    });
    
    for (const student of students2) {
      let totalLectures = 0;
      
      // Calculate total lectures for courses this student is enrolled in
      for (const enrollment of student.enrollments) {
        const courseLectures = await prisma.lecture.count({
          where: { courseId: enrollment.courseId }
        });
        totalLectures += courseLectures;
      }
      
      // If they attended all lectures, award badge
      if (student.attendances.length >= totalLectures && totalLectures > 0) {
        await awardBadge(student.id, "Perfect Attendance");
      }
    }
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getEngagementLevel(score: number): string {
  if (score >= 80) return "high";
  if (score >= 40) return "medium";
  return "low";
}

async function awardBadge(studentId: string, badgeName: string) {
  const badge = await prisma.badge.findFirst({
    where: { name: badgeName }
  });
  
  if (badge) {
    await prisma.studentBadge.create({
      data: {
        studentId,
        badgeId: badge.id,
        awardedAt: new Date(),
      }
    });
    console.log(`Awarded ${badgeName} badge to student ${studentId}`);
  }
}

function generateFeedback(score: number): string {
  if (score >= 90) {
    return "Excellent work! Your understanding of the material is outstanding.";
  } else if (score >= 80) {
    return "Good job! You've demonstrated a solid grasp of the concepts.";
  } else if (score >= 70) {
    return "Satisfactory work with a few areas that could be improved.";
  } else if (score >= 60) {
    return "You've shown basic understanding but need to work on several concepts.";
  } else {
    return "Please review the material and consider attending office hours for additional help.";
  }
}

function generateLectureTitle(courseCode: string, lectureNumber: number): string {
  const titles: Record<string, string[]> = {
    "CS101": [
      "Introduction to Programming Concepts",
      "Variables and Data Types",
      "Conditional Statements",
      "Loops and Iteration",
      "Functions and Modularity",
      "Lists and Arrays",
      "Dictionaries and Hash Tables",
      "File I/O Operations",
      "Exception Handling",
      "Object-Oriented Programming Basics",
      "Classes and Objects",
      "Inheritance and Polymorphism",
      "Debugging Techniques",
      "Algorithm Efficiency",
      "Basic Data Structures",
      "Final Project Workshop",
    ],
    "CS201": [
      "Algorithm Analysis and Big O Notation",
      "Arrays and Linked Lists",
      "Stacks and Queues",
      "Trees and Binary Search Trees",
      "Heaps and Priority Queues",
      "Hash Tables and Hash Functions",
      "Graphs and Graph Representations",
      "Graph Traversal Algorithms",
      "Sorting Algorithms",
      "Searching Algorithms",
      "Dynamic Programming",
      "Greedy Algorithms",
      "Divide and Conquer Strategies",
      "Advanced Data Structures",
      "Algorithm Design Techniques",
      "Case Studies in Algorithm Implementation",
    ],
    "CS301": [
      "Introduction to Database Systems",
      "Relational Data Model",
      "SQL Fundamentals",
      "Database Design and ER Diagrams",
      "Normalization Techniques",
      "Database Indexing",
      "Query Optimization",
      "Transaction Management",
      "Concurrency Control",
      "Database Recovery",
      "NoSQL Databases",
      "Distributed Databases",
      "Data Warehousing Concepts",
      "Database Security",
      "Advanced SQL Techniques",
      "Modern Database Technologies",
    ],
    "MATH201": [
      "Vector Spaces and Subspaces",
      "Linear Transformations",
      "Matrix Operations",
      "Matrix Inverses",
      "Determinants",
      "Eigenvalues and Eigenvectors",
      "Diagonalization",
      "Inner Product Spaces",
      "Orthogonality and Least Squares",
      "Symmetric Matrices and Quadratic Forms",
      "Singular Value Decomposition",
      "Jordan Canonical Form",
      "Applications in Computer Graphics",
      "Applications in Machine Learning",
      "Linear Algebra in Cryptography",
      "Advanced Matrix Decompositions",
    ],
    "CS401": [
      "Introduction to Machine Learning",
      "Supervised vs. Unsupervised Learning",
      "Linear Regression",
      "Logistic Regression",
      "Decision Trees",
      "Support Vector Machines",
      "Neural Networks Fundamentals",
      "Deep Learning Architectures",
      "Convolutional Neural Networks",
      "Recurrent Neural Networks",
      "Clustering Algorithms",
      "Dimensionality Reduction",
      "Feature Engineering",
      "Model Evaluation and Validation",
      "Ensemble Methods",
      "Ethics in Machine Learning",
    ]
  };
  
  // Default titles for courses not in the predefined list
  const defaultTitles = [
    "Course Introduction",
    "Fundamental Concepts",
    "Core Principles",
    "Advanced Techniques",
    "Practical Applications",
    "Case Studies",
    "Current Research Topics",
    "Industry Practices",
    "Theoretical Foundations",
    "Problem-Solving Approaches",
    "Special Topics",
    "Student Presentations",
    "Guest Lecture",
    "Review Session",
    "Final Project Discussions",
    "Course Summary",
  ];
  
  const titleList = titles[courseCode] || defaultTitles;
  const index = (lectureNumber - 1) % titleList.length;
  
  return titleList[index];
}

// Call the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 