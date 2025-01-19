import { Metadata } from "next";
import { CalendarDays, GraduationCap, BookOpen, Bell } from "lucide-react";
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
    .filter((event: CalendarEvent) => 
      event.type === 'deadline' && 
      new Date(event.date) >= new Date()
    )
    .sort((a: CalendarEvent, b: CalendarEvent) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    .slice(0, 3)
    .map((event: CalendarEvent): Deadline => {
      const courseStudents = students.filter(s => String(s.courseId) === String(event.course));
      const course = courses.find(c => String(c.code) === String(event.course));
      return {
        course: event.course || '',
        task: event.title,
        dueDate: event.date,
        submissions: courseStudents.filter(s => Number(s.submissions) > 0).length,
        totalStudents: course?.totalStudents || courseStudents.length,
      };
    });

  // Get unique students (a student might be enrolled in multiple courses)
  const uniqueStudentIds = new Set(students.map(s => s.id));
  const totalStudents = uniqueStudentIds.size;

  // Calculate at-risk students (students with average below 60% or attendance below 70%)
  const atRiskStudents = students.filter(student => {
    const average = Number(student.average);
    const attendance = Number(student.attendance.toString().replace('%', ''));
    return average < 60 || attendance < 70;
  }).length;

  // Calculate weighted averages based on student count
  const averageAttendance = totalStudents === 0 ? 0 : Math.round(
    students.reduce((sum, student) => {
      const attendance = typeof student.attendance === 'string' 
        ? parseInt(student.attendance.replace('%', ''))
        : student.attendance;
      return sum + attendance;
    }, 0) / totalStudents
  );

  const averagePassRate = totalStudents === 0 ? 0 : Math.round(
    students.reduce((sum, student) => {
      return sum + (student.average >= 60 ? 1 : 0);
    }, 0) * 100 / totalStudents
  );

  return {
    totalStudents,
    averageAttendance,
    averagePassRate,
    atRiskStudents,
    upcomingDeadlines,
    recentAnnouncements: [
      {
        course: "CSE123",
        title: "Extra Office Hours Added",
        date: new Date().toISOString().split('T')[0],
        priority: "normal" as const,
      },
      {
        course: "CSE234",
        title: "Project Deadline Extended",
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        priority: "high" as const,
      },
      {
        course: "CSE456",
        title: "Guest Lecture Next Week",
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        priority: "normal" as const,
      },
    ],
  };
}

export default async function DashboardPage() {
  const totalStats = await getTotalStats();
  const courses = await loadCourses();
  const students = await loadStudents();

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
            <Button>
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button variant="outline">View Calendar</Button>
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
                {students.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {courses.length} courses
              </p>
              <div className="mt-3">
                <div className="text-xs text-muted-foreground">At Risk Students</div>
                <div className="text-sm font-medium text-red-500">
                  {students.filter(s => Number(s.average) < 60 || Number(s.attendance.toString().replace('%', '')) < 70).length} students need attention
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
                {totalStats.upcomingDeadlines.slice(0, 2).map((deadline: Deadline) => (
                  <div key={`${deadline.course}-${deadline.task}`} className="text-xs">
                    <div className="font-medium">{deadline.course}: {deadline.task}</div>
                    <div className="text-muted-foreground">Due: {deadline.dueDate}</div>
                  </div>
                ))}
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
              {courses.map((course: Course) => (
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
                        course.status === 'ahead' ? 'bg-green-100 text-green-700' :
                        course.status === 'on-track' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {course.status === 'ahead' ? 'Ahead' :
                         course.status === 'on-track' ? 'On Track' :
                         'Behind'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <div>Students</div>
                          <div className="font-medium">{course.totalStudents}</div>
                        </div>
                        <div>
                          <div>Average</div>
                          <div className="font-medium">{course.classAverage}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>Latest updates across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {totalStats.recentAnnouncements.map((announcement, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className={`w-2 h-2 mt-2 rounded-full ${
                      announcement.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium">{announcement.title}</h4>
                        <span className="text-xs text-muted-foreground">{announcement.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{announcement.course}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Assignment and project due dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {totalStats.upcomingDeadlines.map((deadline: Deadline, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium">{deadline.task}</h4>
                        <span className="text-xs text-muted-foreground">{deadline.dueDate}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{deadline.course}</p>
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground">Submissions</div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(deadline.submissions / deadline.totalStudents) * 100} 
                            className="flex-1"
                          />
                          <span className="text-xs font-medium">
                            {deadline.submissions}/{deadline.totalStudents}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}

              <Suspense fallback={<div>Loading...</div>}>
                <PerformanceGraph courses={courses} />
              </Suspense>
        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Students</CardTitle>
            <CardDescription>Students with exceptional performance across all courses</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <StudentLeaderboard />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
