import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const courseId = params.courseId;

    // Get course with all related data
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        instructorId: session.user.id
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        assignments: {
          include: {
            submissions: {
              include: {
                student: true
              }
            }
          }
        },
        lectures: {
          include: {
            attendances: {
              include: {
                student: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return new NextResponse('Course not found', { status: 404 });
    }

    // Transform the data to match our CourseData interface
    const transformedCourse = {
      id: course.id,
      code: course.code,
      name: course.name,
      term: course.term || 'Current Term',
      section: course.section || 'Default Section',
      totalStudents: course.students.length,
      attendance: calculateAverageAttendance(course.lectures),
      passRate: calculatePassRate(course.assignments),
      students: transformStudents(course.students, course.assignments, course.lectures),
      stats: {
        classAverage: calculateClassAverage(course.assignments),
        engagement: calculateEngagement(course.students, course.assignments),
        assignments: calculateAssignmentStats(course.assignments),
        progress: calculateCourseProgress(course)
      }
    };

    return NextResponse.json(transformedCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper functions to transform the data
function calculateAverageAttendance(lectures: any[]) {
  if (lectures.length === 0) return 0;
  
  // Get unique students who have attended any lecture
  const studentAttendances = new Map<string, { present: number; total: number }>();
  
  lectures.forEach(lecture => {
    lecture.attendances.forEach((attendance: any) => {
      const studentId = attendance.studentId;
      if (!studentAttendances.has(studentId)) {
        studentAttendances.set(studentId, { present: 0, total: 0 });
      }
      const stats = studentAttendances.get(studentId)!;
      stats.total++;
      if (attendance.status === 'PRESENT') {
        stats.present++;
      }
    });
  });

  // Calculate average attendance across all students
  if (studentAttendances.size === 0) return 0;
  
  const totalAttendance = Array.from(studentAttendances.values()).reduce(
    (sum, stats) => sum + (stats.present / stats.total), 0
  );
  
  return Math.min(100, Math.round((totalAttendance / studentAttendances.size) * 100));
}

function calculatePassRate(assignments: any[]) {
  if (assignments.length === 0) return 0;
  
  // Get unique students and their submission status
  const studentScores = new Map<string, { passing: number; total: number }>();
  
  assignments.forEach(assignment => {
    assignment.submissions.forEach((submission: any) => {
      const studentId = submission.studentId;
      if (!studentScores.has(studentId)) {
        studentScores.set(studentId, { passing: 0, total: 0 });
      }
      const stats = studentScores.get(studentId)!;
      stats.total++;
      if (submission.score >= 60) {
        stats.passing++;
      }
    });
  });

  // Calculate pass rate across all students
  if (studentScores.size === 0) return 0;
  
  const totalPassRate = Array.from(studentScores.values()).reduce(
    (sum, stats) => sum + (stats.passing / stats.total), 0
  );
  
  return Math.min(100, Math.round((totalPassRate / studentScores.size) * 100));
}

function transformStudents(enrollments: any[], assignments: any[], lectures: any[]) {
  return enrollments.map(enrollment => {
    const student = enrollment.student;
    const studentSubmissions = assignments.flatMap(a => 
      a.submissions.filter((s: any) => s.studentId === student.id)
    );
    const studentAttendances = lectures.flatMap(l => 
      l.attendances.filter((a: any) => a.studentId === student.id)
    );

    const totalScore = studentSubmissions.reduce((sum: number, s: any) => 
      sum + (s.score || 0), 0);
    const average = studentSubmissions.length > 0 
      ? Math.round(totalScore / studentSubmissions.length)
      : 0;

    const attendanceCount = studentAttendances.length;
    const presentCount = studentAttendances.filter((a: any) => a.status === 'PRESENT').length;
    const attendance = attendanceCount > 0 
      ? Math.round((presentCount / attendanceCount) * 100)
      : 100;

    // Calculate streak
    const streak = calculateStreak(studentAttendances);

    // Determine grade
    let grade = 'F';
    if (average >= 90) grade = 'A';
    else if (average >= 80) grade = 'B';
    else if (average >= 70) grade = 'C';
    else if (average >= 60) grade = 'D';

    // Calculate trend
    const sortedSubmissions = [...studentSubmissions].sort((a: any, b: any) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    const recentSubmissions = sortedSubmissions.slice(0, 3);
    const olderSubmissions = sortedSubmissions.slice(3, 6);
    
    const recentAvg = recentSubmissions.length > 0
      ? recentSubmissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / recentSubmissions.length
      : 0;
    const olderAvg = olderSubmissions.length > 0
      ? olderSubmissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / olderSubmissions.length
      : 0;
    
    const trend = recentSubmissions.length > 0 && olderSubmissions.length > 0
      ? recentAvg >= olderAvg ? 'up' : 'down'
      : 'up';

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      avatar: student.avatar || '/avatars/default.png',
      score: Math.round(totalScore),
      average,
      trend,
      attendance,
      streak,
      status: average < 60 ? 'At Risk' : 'Active',
      grade
    };
  });
}

function calculateStreak(attendances: any[]) {
  let streak = 0;
  const sortedAttendances = [...attendances].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const attendance of sortedAttendances) {
    if (attendance.status === 'PRESENT') {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateClassAverage(assignments: any[]) {
  const allSubmissions = assignments.flatMap(a => a.submissions);
  const totalScore = allSubmissions.reduce((sum: number, s: any) => 
    sum + (s.score || 0), 0);
  const average = allSubmissions.length > 0 
    ? Math.round(totalScore / allSubmissions.length)
    : 0;

  // Calculate trend (comparing with previous week)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentSubmissions = allSubmissions.filter((s: any) => 
    new Date(s.submittedAt) > weekAgo);
  const olderSubmissions = allSubmissions.filter((s: any) => 
    new Date(s.submittedAt) <= weekAgo);

  const recentAvg = recentSubmissions.length > 0
    ? recentSubmissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / recentSubmissions.length
    : 0;
  const olderAvg = olderSubmissions.length > 0
    ? olderSubmissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / olderSubmissions.length
    : 0;

  return {
    average,
    previousAverage: olderAvg,
    target: 75,
    trend: Math.round(recentAvg - olderAvg)
  };
}

function calculateEngagement(students: any[], assignments: any[]) {
  const totalStudents = students.length;
  if (totalStudents === 0) return {
    percentage: 100,
    trend: 0,
    activeStudents: 0,
    totalStudents: 0,
    atRiskCount: 0
  };

  const activeStudents = students.filter(student => {
    const studentSubmissions = assignments.flatMap(a => 
      a.submissions.filter((s: any) => s.studentId === student.student.id)
    );
    return studentSubmissions.length > 0;
  }).length;

  const atRiskStudents = students.filter(student => {
    const studentSubmissions = assignments.flatMap(a => 
      a.submissions.filter((s: any) => s.studentId === student.student.id)
    );
    const average = studentSubmissions.length > 0
      ? studentSubmissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / studentSubmissions.length
      : 0;
    return average < 60;
  }).length;

  return {
    percentage: Math.round((activeStudents / totalStudents) * 100),
    trend: 0, // This would need historical data to calculate
    activeStudents,
    totalStudents,
    atRiskCount: atRiskStudents
  };
}

function calculateAssignmentStats(assignments: any[]) {
  const totalAssignments = assignments.length;
  if (totalAssignments === 0) return {
    completionRate: 100,
    submittedCount: 0,
    totalAssignments: 0,
    nextDueAssignment: 'No assignments',
    status: 'on-track'
  };

  const totalSubmissions = assignments.reduce((sum, a) => 
    sum + a.submissions.length, 0);
  const completionRate = Math.round((totalSubmissions / (totalAssignments * assignments[0]?.submissions.length || 1)) * 100);

  // Find next due assignment
  const now = new Date();
  const upcomingAssignments = assignments
    .filter(a => new Date(a.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const nextDue = upcomingAssignments[0]?.dueDate 
    ? new Date(upcomingAssignments[0].dueDate).toLocaleDateString()
    : 'No upcoming assignments';

  return {
    completionRate,
    submittedCount: totalSubmissions,
    totalAssignments,
    nextDueAssignment: nextDue,
    status: completionRate >= 80 ? 'ahead' : completionRate >= 60 ? 'on-track' : 'behind'
  };
}

function calculateCourseProgress(course: any) {
  if (!course.startDate || !course.endDate) {
    return {
      percentage: 0,
      currentWeek: 1,
      totalWeeks: 16,
      currentTopic: 'Introduction',
      nextTopic: 'Basic Concepts',
      status: 'on-track'
    };
  }

  const start = new Date(course.startDate);
  const end = new Date(course.endDate);
  const now = new Date();

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percentage = Math.round((elapsed / totalDuration) * 100);

  const weeks = Math.ceil(totalDuration / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.ceil(elapsed / (7 * 24 * 60 * 60 * 1000));

  return {
    percentage,
    currentWeek,
    totalWeeks: weeks,
    currentTopic: 'Current Topic', // This would come from course content
    nextTopic: 'Next Topic', // This would come from course content
    status: percentage >= 80 ? 'ahead' : percentage >= 60 ? 'on-track' : 'behind'
  };
} 