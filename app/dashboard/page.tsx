import { Metadata } from "next";
import { CalendarDays, GraduationCap, BookOpen, Bell, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PerformanceGraph } from "./performance-graph";
import { StudentLeaderboard } from "./student-leaderboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loadCourses, loadCalendarEvents, loadStudents, formatPercentage, formatTrend, type Course, type CalendarEvent, type Student } from "@/lib/data";
import { Suspense } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Professor Dashboard",
  description: "Course management and student performance analytics dashboard",
};

interface Deadline {
  course: string;
  task: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
}

interface Announcement {
  course: string;
  title: string;
  date: string;
  priority: 'normal' | 'high';
}

// Helper function to get total stats across all courses
async function getTotalStats() {
  const courses = await loadCourses();
  const events = await loadCalendarEvents();
  const students = await loadStudents();

  // Calculate upcoming deadlines with accurate submission counts
  const upcomingDeadlines = events
    .filter(event => 
      event.type === 'deadline' && 
      new Date(event.date) >= new Date()
    )
    .sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    .slice(0, 3)
    .map(event => {
      const course = courses.find(c => c.id === event.courseId);
      const courseStudents = students.filter(s => s.courseId === event.courseId);
      return {
        course: course?.code || '',
        task: event.title,
        dueDate: new Date(event.date).toLocaleDateString(),
        submissions: courseStudents.filter(s => s.submissions > 0).length,
        totalStudents: courseStudents.length,
      };
    });

  // Get unique students (a student might be enrolled in multiple courses)
  const uniqueStudentIds = new Set(students.map(s => s.id));
  const totalStudents = uniqueStudentIds.size;

  // Calculate at-risk students (students with average below 60% or attendance below 70%)
  const atRiskStudents = students.filter(student => 
    student.average < 60 || student.attendance < 70
  ).length;

  // Calculate weighted averages based on student count
  const averageAttendance = totalStudents === 0 ? 0 : Math.round(
    students.reduce((sum, student) => sum + student.attendance, 0) / totalStudents
  );

  const averagePassRate = totalStudents === 0 ? 0 : Math.round(
    students.reduce((sum, student) => sum + (student.average >= 60 ? 1 : 0), 0) * 100 / totalStudents
  );

  // Get recent events for announcements
  const recentEvents = events
    .filter(event => 
      event.type === 'announcement' && 
      new Date(event.date) <= new Date()
    )
    .sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 3)
    .map(event => {
      const course = courses.find(c => c.id === event.courseId);
      return {
        course: course?.code || '',
        title: event.title,
        date: new Date(event.date).toLocaleDateString(),
        priority: event.type === 'urgent' ? 'high' as const : 'normal' as const,
      };
    });

  return {
    totalStudents,
    averageAttendance,
    averagePassRate,
    atRiskStudents,
    upcomingDeadlines,
    recentAnnouncements: recentEvents,
  };
}

export default async function DashboardPage() {
  const totalStats = await getTotalStats();
  const courses = await loadCourses();
  const students = await loadStudents();

  // Calculate course-specific stats
  const courseStats = courses.map(course => {
    const courseStudents = students.filter(s => s.courseId === course.id);
    const averageAttendance = courseStudents.length > 0
      ? Math.round(courseStudents.reduce((sum, s) => sum + s.attendance, 0) / courseStudents.length)
      : 0;
    const averageScore = courseStudents.length > 0
      ? Math.round(courseStudents.reduce((sum, s) => sum + s.average, 0) / courseStudents.length)
      : 0;
    const atRiskCount = courseStudents.filter(s => s.average < 60 || s.attendance < 70).length;

    return {
      ...course,
      averageAttendance,
      averageScore,
      atRiskCount,
      totalStudents: courseStudents.length,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, Professor</h2>
            <p className="text-muted-foreground">
              Here's what's happening across your courses today
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/dashboard/calendar">
                <CalendarDays className="mr-2 h-4 w-4" />
                View Calendar
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalStats.totalStudents}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {courses.length} courses
              </p>
              <div className="mt-3">
                <div className="text-xs text-muted-foreground">At Risk Students</div>
                <div className="text-sm font-medium text-red-500">
                  {totalStats.atRiskStudents} students need attention
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.averageAttendance}%</div>
              <Progress value={totalStats.averageAttendance} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Target: 90% attendance rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.averagePassRate}%</div>
              <Progress value={totalStats.averagePassRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {totalStats.averagePassRate >= 80 ? 'Above target' : 'Below target'} (80% target)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.upcomingDeadlines.length}</div>
              <div className="mt-2 space-y-1">
                {totalStats.upcomingDeadlines.slice(0, 2).map((deadline) => (
                  <div key={`${deadline.course}-${deadline.task}`} className="text-xs">
                    <div className="font-medium">{deadline.course}: {deadline.task}</div>
                    <div className="text-muted-foreground">
                      Due: {deadline.dueDate} ({deadline.submissions}/{deadline.totalStudents} submitted)
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Graph */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-5">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Track submissions, scores, and attendance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceGraph courses={courseStats} />
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Key metrics this week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium">Average Score</div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(courseStats.reduce((sum, course) => sum + course.averageScore, 0) / courseStats.length)}%
                </div>
                <Progress 
                  value={Math.round(courseStats.reduce((sum, course) => sum + course.averageScore, 0) / courseStats.length)} 
                  className="mt-2"
                />
              </div>
              <div>
                <div className="text-sm font-medium">Submission Rate</div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(courseStats.reduce((sum, course) => sum + (course.submissions || 0), 0) / courseStats.length)}%
                </div>
                <Progress 
                  value={Math.round(courseStats.reduce((sum, course) => sum + (course.submissions || 0), 0) / courseStats.length)} 
                  className="mt-2"
                />
              </div>
              <div>
                <div className="text-sm font-medium">Attendance Rate</div>
                <div className="text-2xl font-bold text-rose-600">
                  {Math.round(courseStats.reduce((sum, course) => sum + course.averageAttendance, 0) / courseStats.length)}%
                </div>
                <Progress 
                  value={Math.round(courseStats.reduce((sum, course) => sum + course.averageAttendance, 0) / courseStats.length)} 
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Course Overview</CardTitle>
            <CardDescription>Quick overview of all your courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {courseStats.map((course) => (
                <Link 
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="block"
                >
                  <div className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{course.code}</h3>
                        <p className="text-sm text-muted-foreground">{course.name}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        course.averageScore >= 80 ? 'bg-green-100 text-green-700' :
                        course.averageScore >= 70 ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {course.averageScore >= 80 ? 'Excellent' :
                         course.averageScore >= 70 ? 'Good' :
                         'Needs Attention'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Students</div>
                          <div className="font-medium">{course.totalStudents}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">At Risk</div>
                          <div className="font-medium text-red-500">{course.atRiskCount}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Attendance</div>
                          <div className="font-medium">{course.averageAttendance}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Average</div>
                          <div className="font-medium">{course.averageScore}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Announcements and Student Leaderboard side by side */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Announcements</CardTitle>
                  <CardDescription>Latest updates from your courses</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {totalStats.recentAnnouncements.map((event) => (
                  <div key={event.course} className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={event.course?.instructor?.avatar} />
                      <AvatarFallback>
                        {getInitials(event.course?.instructor?.name || 'Instructor')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.course?.name} • {formatDate(event.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Leaderboard</CardTitle>
                  <CardDescription>Top performing students</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/leaderboard">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <StudentLeaderboard />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
