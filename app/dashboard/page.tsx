import { Metadata } from "next";
import { Suspense } from "react";
import { formatDateServer } from "@/lib/serverActions";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Import server components directly
import { DashboardHeader } from "@/components/dashboard";
import { StatCards } from "@/components/dashboard";
import { CanvasSection } from "@/components/dashboard";

// Import client component wrappers
import { 
  ClientPerformanceSection, 
  ClientCourseOverview, 
  ClientBottomSection 
} from "@/components/dashboard/ClientComponents";

export const metadata: Metadata = {
  title: "Professor Dashboard",
  description: "Course management and student performance analytics dashboard",
};

// Enable streaming with server-side rendering that's always fresh
export const fetchCache = 'force-no-store';
export const revalidate = 0; // Don't cache this page

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        {/* Welcome Section - Critical UI, load immediately */}
        <DashboardHeader />

        {/* Canvas Integration - Wrap in suspense for streaming */}
        <Suspense fallback={<div className="h-16" />}>
          <CanvasIntegrationSection />
        </Suspense>

        {/* Stats Cards - Critical stats, load with streaming */}
        <Suspense fallback={
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-md border border-muted">
                <Skeleton className="h-6 w-28 mb-4" />
                <Skeleton className="h-10 w-12 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        }>
          <StatsCardSection />
        </Suspense>

        {/* Performance Overview - Load with client component */}
        <Suspense fallback={
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7 mb-8">
            <div className="lg:col-span-5 p-6 rounded-md border border-muted">
              <Skeleton className="h-[350px] w-full" />
            </div>
            <div className="lg:col-span-2 p-6 rounded-md border border-muted">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        }>
          <PerformanceSectionWrapper />
        </Suspense>

        {/* Course Overview - Load with client component */}
        <Suspense fallback={
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-md p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-6" />
                  <Skeleton className="h-2 w-full mb-6" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }>
          <CourseOverviewWrapper />
        </Suspense>

        {/* Bottom Section - Load with client component */}
        <Suspense fallback={
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <div className="border rounded-md p-4">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-8" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-md p-4">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-8" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }>
          <BottomSectionWrapper />
        </Suspense>
      </div>
    </div>
  );
}

// Separate components for data fetching to enable streaming
async function CanvasIntegrationSection() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <CanvasSection isActive={false} />;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { canvasConfig: true }
    });
    
    const isActive = user?.canvasConfig?.isActive || false;
    return <CanvasSection isActive={isActive} />;
  } catch (error) {
    console.error("Failed to load Canvas status:", error);
    return <CanvasSection isActive={false} />;
  }
}

async function StatsCardSection() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // Return default stats for non-authenticated users
    return (
      <StatCards
        totalStudents={0}
        averageAttendance={0}
        averagePassRate={0}
        atRiskStudents={0}
        upcomingDeadlines={[]}
        studentTrend="down"
      />
    );
  }

  try {
    // Get actual data from database
    const [courses, assignments] = await Promise.all([
      prisma.course.findMany({
        where: { instructorId: session.user.id },
        include: {
          students: {
            include: {
              student: {
                include: {
                  attendances: true,
                  submissions: true
                }
              }
            }
          },
          assignments: {
            where: {
              dueDate: {
                gte: new Date()
              }
            },
            take: 5,
            orderBy: {
              dueDate: 'asc'
            }
          }
        }
      }),
      prisma.assignment.findMany({
        where: {
          course: {
            instructorId: session.user.id
          },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        },
        include: {
          course: true,
          submissions: true
        },
        take: 3,
        orderBy: {
          dueDate: 'asc'
        }
      })
    ]);

    // Calculate statistics
    const allStudents = courses.flatMap(course => course.students.map(enrollment => enrollment.student));
    const totalStudents = allStudents.length;

    // Calculate average attendance
    let totalAttendanceScore = 0;
    let attendanceCount = 0;
    allStudents.forEach(student => {
      const attendances = student.attendances;
      if (attendances.length > 0) {
        const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
        const attendanceRate = (presentCount / attendances.length) * 100;
        totalAttendanceScore += attendanceRate;
        attendanceCount++;
      }
    });
    const averageAttendance = attendanceCount > 0 ? Math.round(totalAttendanceScore / attendanceCount) : 0;

    // Calculate pass rate (students with submissions)
    const studentsWithSubmissions = allStudents.filter(student => student.submissions.length > 0);
    const averagePassRate = totalStudents > 0 ? Math.round((studentsWithSubmissions.length / totalStudents) * 100) : 0;

    // Calculate at-risk students (low attendance or no submissions)
    const atRiskStudents = allStudents.filter(student => {
      const hasLowAttendance = student.attendances.length > 0 && 
        (student.attendances.filter(a => a.status === 'PRESENT').length / student.attendances.length) < 0.7;
      const hasNoSubmissions = student.submissions.length === 0;
      return hasLowAttendance || hasNoSubmissions;
    }).length;

    // Format upcoming deadlines
    const upcomingDeadlines = assignments.map(assignment => ({
      course: assignment.course.code,
      task: assignment.title,
      dueDate: assignment.dueDate.toLocaleDateString(),
      submissions: assignment.submissions.length,
      totalStudents: assignment.course.studentCapacity || 0
    }));

    // Calculate trend (simple comparison - if more students enrolled recently)
    const studentTrend = totalStudents > 0 ? 'up' : 'down';

    return (
      <StatCards
        totalStudents={totalStudents}
        averageAttendance={averageAttendance}
        averagePassRate={averagePassRate}
        atRiskStudents={atRiskStudents}
        upcomingDeadlines={upcomingDeadlines}
        studentTrend={studentTrend}
      />
    );
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
    // Return fallback stats
    return (
      <StatCards
        totalStudents={0}
        averageAttendance={0}
        averagePassRate={0}
        atRiskStudents={0}
        upcomingDeadlines={[]}
        studentTrend="down"
      />
    );
  }
}

async function PerformanceSectionWrapper() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <ClientPerformanceSection courses={[]} />;
  }

  try {
    const courses = await prisma.course.findMany({
      where: { instructorId: session.user.id },
      include: {
        students: {
          include: {
            student: {
              include: {
                attendances: true,
                submissions: true
              }
            }
          }
        },
        assignments: true
      }
    });

    // Transform to the expected format
    const courseStats = courses.map(course => {
      const enrollments = course.students;
      const students = enrollments.map(enrollment => enrollment.student);
      const totalStudents = students.length;

      // Calculate averages
      let totalAttendanceScore = 0;
      let attendanceCount = 0;
      students.forEach(student => {
        const attendances = student.attendances;
        if (attendances.length > 0) {
          const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
          const attendanceRate = (presentCount / attendances.length) * 100;
          totalAttendanceScore += attendanceRate;
          attendanceCount++;
        }
      });
      const averageAttendance = attendanceCount > 0 ? Math.round(totalAttendanceScore / attendanceCount) : 0;

      // Calculate submission rate
      const totalAssignments = course.assignments.length;
      let submissionRate = 0;
      if (totalAssignments > 0 && totalStudents > 0) {
        const totalPossibleSubmissions = totalAssignments * totalStudents;
        const totalSubmissions = students.reduce((sum, student) => sum + student.submissions.length, 0);
        submissionRate = Math.round((totalSubmissions / totalPossibleSubmissions) * 100);
      }

      // Calculate at-risk count
      const atRiskCount = students.filter(student => {
        const hasLowAttendance = student.attendances.length > 0 && 
          (student.attendances.filter(a => a.status === 'PRESENT').length / student.attendances.length) < 0.7;
        const hasNoSubmissions = student.submissions.length === 0;
        return hasLowAttendance || hasNoSubmissions;
      }).length;

      // Calculate course progress based on time since creation
      const daysSinceStart = Math.floor((new Date().getTime() - course.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      const progress = Math.min(100, Math.round((daysSinceStart / 120) * 100)); // Assume 120-day semester
      const week = Math.ceil(daysSinceStart / 7);

      return {
        id: course.id,
        code: course.code,
        name: course.name,
        totalStudents,
        averageAttendance,
        averageScore: submissionRate, // Using submission rate as score proxy
        atRiskCount,
        submissionRate,
        progress,
        week,
        term: `Fall 2024`, // Default term
        section: 'A', // Default section
        stats: {
          classAverage: { value: submissionRate },
          engagement: { value: averageAttendance },
          assignments: { value: submissionRate },
          progress: { value: progress }
        }
      };
    });

    return <ClientPerformanceSection courses={courseStats} />;
  } catch (error) {
    console.error("Failed to load course stats:", error);
    return <ClientPerformanceSection courses={[]} />;
  }
}

async function CourseOverviewWrapper() {
  // Same data as PerformanceSectionWrapper
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <ClientCourseOverview courses={[]} />;
  }

  try {
    const courses = await prisma.course.findMany({
      where: { instructorId: session.user.id },
      include: {
        students: {
          include: {
            student: {
              include: {
                attendances: true,
                submissions: true
              }
            }
          }
        },
        assignments: true
      }
    });

    // Transform to the expected format (same as above)
    const courseStats = courses.map(course => {
      const enrollments = course.students;
      const students = enrollments.map(enrollment => enrollment.student);
      const totalStudents = students.length;

      let totalAttendanceScore = 0;
      let attendanceCount = 0;
      students.forEach(student => {
        const attendances = student.attendances;
        if (attendances.length > 0) {
          const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
          const attendanceRate = (presentCount / attendances.length) * 100;
          totalAttendanceScore += attendanceRate;
          attendanceCount++;
        }
      });
      const averageAttendance = attendanceCount > 0 ? Math.round(totalAttendanceScore / attendanceCount) : 0;

      const totalAssignments = course.assignments.length;
      let submissionRate = 0;
      if (totalAssignments > 0 && totalStudents > 0) {
        const totalPossibleSubmissions = totalAssignments * totalStudents;
        const totalSubmissions = students.reduce((sum, student) => sum + student.submissions.length, 0);
        submissionRate = Math.round((totalSubmissions / totalPossibleSubmissions) * 100);
      }

      const atRiskCount = students.filter(student => {
        const hasLowAttendance = student.attendances.length > 0 && 
          (student.attendances.filter(a => a.status === 'PRESENT').length / student.attendances.length) < 0.7;
        const hasNoSubmissions = student.submissions.length === 0;
        return hasLowAttendance || hasNoSubmissions;
      }).length;

      // Calculate course progress based on time since creation
      const daysSinceStart = Math.floor((new Date().getTime() - course.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      const progress = Math.min(100, Math.round((daysSinceStart / 120) * 100)); // Assume 120-day semester
      const week = Math.ceil(daysSinceStart / 7);

      return {
        id: course.id,
        code: course.code,
        name: course.name,
        totalStudents,
        averageAttendance,
        averageScore: submissionRate,
        atRiskCount,
        submissionRate,
        progress,
        week,
        term: `Fall 2024`, // Default term
        section: 'A', // Default section
        stats: {
          classAverage: { value: submissionRate },
          engagement: { value: averageAttendance },
          assignments: { value: submissionRate },
          progress: { value: progress }
        }
      };
    });

    return <ClientCourseOverview courses={courseStats} />;
  } catch (error) {
    console.error("Failed to load course stats:", error);
    return <ClientCourseOverview courses={[]} />;
  }
}

async function BottomSectionWrapper() {
  const session = await getServerSession(authOptions);
  
  // Generate mock announcements for now
  const recentAnnouncements = [
    {
      course: 'General',
      title: 'Welcome to ClassCorer Dashboard',
      date: new Date().toLocaleDateString(),
      priority: 'normal' as const,
    },
    {
      course: 'System',
      title: 'Dashboard now shows real data from your courses',
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      priority: 'high' as const,
    }
  ];
  
  // Pre-format the dates server-side once to avoid repeated server calls
  const formattedDateFn = formatDateServer;
  
  return (
    <ClientBottomSection
      announcements={recentAnnouncements}
      formatDate={formattedDateFn}
    />
  );
}