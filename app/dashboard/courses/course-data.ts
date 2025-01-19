import { loadCourses, type Course } from "@/lib/data";
import { CourseData } from "./types";

function mapStatus(status: Course['status']): 'ahead' | 'on-track' | 'behind' {
  switch (status) {
    case 'ahead':
      return 'ahead';
    case 'on-track':
      return 'on-track';
    case 'on-schedule':
      return 'on-track';
    default:
      return 'behind';
  }
}

function convertCourseToData(course: Course): CourseData {
  return {
    id: course.id,
    code: course.code,
    name: course.name,
    term: course.term,
    section: course.section,
    totalStudents: course.totalStudents,
    attendance: course.attendance,
    passRate: course.passRate,
    stats: {
      classAverage: {
        average: course.classAverage,
        previousAverage: course.previousAverage,
        target: course.target,
        trend: course.trend,
      },
      engagement: {
        percentage: course.engagement,
        trend: course.engagementTrend,
        activeStudents: course.activeStudents,
        totalStudents: course.totalStudents,
        atRiskCount: course.atRiskCount,
      },
      assignments: {
        completionRate: course.completionRate,
        submittedCount: course.submittedCount,
        totalAssignments: course.totalAssignments,
        nextDueAssignment: course.nextDueAssignment,
        status: mapStatus(course.status),
      },
      progress: {
        percentage: course.progress,
        currentWeek: course.currentWeek,
        totalWeeks: course.totalWeeks,
        currentTopic: course.currentTopic,
        nextTopic: course.nextTopic,
        status: mapStatus(course.status),
      },
    },
  };
}

export async function getCourseData(): Promise<Record<string, CourseData>> {
  const courses = await loadCourses();
  return courses.reduce((acc, course) => {
    acc[course.id] = convertCourseToData(course);
    return acc;
  }, {} as Record<string, CourseData>);
} 