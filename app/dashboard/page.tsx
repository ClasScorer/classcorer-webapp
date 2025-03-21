import { Metadata } from "next";
import { CalendarDays, GraduationCap, BookOpen, Bell, ArrowRight, TrendingUp, TrendingDown, AlertTriangle, Calendar, Presentation, Users } from "lucide-react";
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
import { CanvasIntegration } from "./canvas-integration";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loadCourses, loadCalendarEvents, loadStudents, formatPercentage, formatTrend, type Course, type CalendarEvent, type Student } from "@/lib/data";
import { Suspense } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, Professor</h2>
            <p className="text-muted-foreground">
              Here's what's happening across your courses today
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/calendar">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Button>
            </Link>

            <Link href="/dashboard/lectures">
              <Button variant="outline" className="w-full justify-start">
                <Presentation className="mr-2 h-4 w-4" />
                Lectures
              </Button>
            </Link>

            <Link href="/dashboard/students">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Students
              </Button>
            </Link>
          </div>
        </div>

        {/* Canvas LMS Integration Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Integrations</h3>
          </div>
          <Suspense fallback={<div>Loading Canvas integration...</div>}>
            <CanvasIntegration />
          </Suspense>
        </div>

        {/* Quick Stats with Trends */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">{totalStats.totalStudents}</div>
                <Badge variant={totalStats.studentTrend === 'up' ? 'default' : 'secondary'} className="ml-2">
                  {totalStats.studentTrend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">
                  {totalStats.atRiskStudents} at risk
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">{totalStats.averageAttendance}%</div>
                <Badge 
                  variant={totalStats.averageAttendance >= 90 ? 'default' : 'secondary'} 
                  className="ml-2"
                >
                  {totalStats.averageAttendance >= 90 ? 'On Track' : 'Below Target'}
                </Badge>
              </div>
              <Progress value={totalStats.averageAttendance} className="mt-3" />
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
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">{totalStats.averagePassRate}%</div>
                <Badge 
                  variant={totalStats.averagePassRate >= 80 ? 'default' : 'destructive'} 
                  className="ml-2"
                >
                  {totalStats.averagePassRate >= 80 ? 'Above Target' : 'Below Target'}
                </Badge>
              </div>
              <Progress value={totalStats.averagePassRate} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-2">
                Target: 80% pass rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {totalStats.upcomingDeadlines.slice(0, 2).map((deadline, index) => (
                  <div key={`${deadline.course}-${deadline.task}`} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{deadline.course}</p>
                      <p className="text-xs text-muted-foreground">{deadline.task}</p>
                    </div>
                    <Badge variant={index === 0 ? 'destructive' : 'secondary'}>
                      {deadline.dueDate}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview and Summary */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Track submissions, scores, and attendance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceGraph courses={courseStats} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Key metrics this week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Score</span>
                  <Badge variant="outline">
                    {Math.round(courseStats.reduce((sum, course) => sum + course.averageScore, 0) / courseStats.length)}%
                  </Badge>
                </div>
                <Progress 
                  value={Math.round(courseStats.reduce((sum, course) => sum + course.averageScore, 0) / courseStats.length)} 
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Submission Rate</span>
                  <Badge variant="outline">
                    {Math.round(courseStats.reduce((sum, course) => sum + (course.submissions || 0), 0) / courseStats.length)}%
                  </Badge>
                </div>
                <Progress 
                  value={Math.round(courseStats.reduce((sum, course) => sum + (course.submissions || 0), 0) / courseStats.length)} 
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Attendance Rate</span>
                  <Badge variant="outline">
                    {Math.round(courseStats.reduce((sum, course) => sum + course.averageAttendance, 0) / courseStats.length)}%
                  </Badge>
                </div>
                <Progress 
                  value={Math.round(courseStats.reduce((sum, course) => sum + course.averageAttendance, 0) / courseStats.length)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Overview Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Course Overview</h3>
              <p className="text-sm text-muted-foreground">Performance metrics for all active courses</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/courses">
                View All Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {courseStats.map((course) => (
              <Link 
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="block group"
              >
                <Card className="transition-all duration-200 hover:shadow-md group-hover:border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.code}</CardTitle>
                        <CardDescription className="mt-1">{course.name}</CardDescription>
                      </div>
                      <Badge variant={
                        course.averageScore >= 80 ? 'default' :
                        course.averageScore >= 70 ? 'secondary' :
                        'destructive'
                      }>
                        {course.averageScore >= 80 ? 'Excellent' :
                         course.averageScore >= 70 ? 'Good' :
                         'Needs Attention'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Students</p>
                          <p className="text-sm font-medium">{course.totalStudents}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">At Risk</p>
                          <p className="text-sm font-medium text-red-500">{course.atRiskCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Attendance</p>
                          <p className="text-sm font-medium">{course.averageAttendance}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Average</p>
                          <p className="text-sm font-medium">{course.averageScore}%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Announcements and Student Leaderboard */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Announcements</CardTitle>
                  <CardDescription>Latest updates from your courses</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/announcements">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {totalStats.recentAnnouncements.map((announcement, index) => (
                  <div key={`${announcement.course}-${index}`} className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10">
                        {getInitials(announcement.course)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{announcement.title}</p>
                        <Badge variant={announcement.priority === 'high' ? 'destructive' : 'secondary'}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {announcement.course} • {formatDate(announcement.date)}
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
              <Suspense fallback={<div>Loading leaderboard...</div>}>
                <StudentLeaderboard />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}