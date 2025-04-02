import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CanvasImportButton } from "@/app/components/canvas-import-button";

interface CoursePageProps {
  params: {
    courseId: string;
  };
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { title: "Unauthorized" };

  const course = await prisma.course.findUnique({
    where: { 
      id: params.courseId,
      instructorId: session.user.id
    },
  });

  if (!course) return { title: "Course Not Found" };

  return {
    title: `${course.name} (${course.code})`,
    description: course.description || `Course details for ${course.name}`,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const course = await prisma.course.findUnique({
    where: { 
      id: params.courseId,
      instructorId: session.user.id
    },
    include: {
      students: {
        include: {
          student: true,
        }
      },
      lectures: true,
      assignments: true,
    },
  });

  if (!course) {
    return notFound();
  }

  // Calculate grade distribution based on actual student scores
  const gradeRanges = {
    'A': { min: 90, count: 0 },
    'B': { min: 80, count: 0 },
    'C': { min: 70, count: 0 },
    'D': { min: 60, count: 0 },
    'F': { min: 0, count: 0 }
  };

  // Calculate student averages and grade distribution
  const studentAverages = await Promise.all(
    course.students.map(async (enrollment) => {
      const submissions = await prisma.submission.findMany({
        where: {
          studentId: enrollment.student.id,
          assignment: {
            courseId: course.id
          }
        },
        include: {
          assignment: true
        }
      });

      const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      const average = submissions.length > 0 ? totalScore / submissions.length : 0;

      if (average >= 90) gradeRanges['A'].count++;
      else if (average >= 80) gradeRanges['B'].count++;
      else if (average >= 70) gradeRanges['C'].count++;
      else if (average >= 60) gradeRanges['D'].count++;
      else gradeRanges['F'].count++;

      return average;
    })
  );

  // Calculate class statistics
  const classAverage = studentAverages.length > 0
    ? Math.round(studentAverages.reduce((sum, avg) => sum + avg, 0) / studentAverages.length)
    : 0;

  // Calculate at-risk students (those with average below 70)
  const atRiskCount = studentAverages.filter(avg => avg < 70).length;
  const atRiskPercentage = course.students.length > 0 
    ? (atRiskCount / course.students.length) * 100 
    : 0;

  // Calculate attendance rate
  const attendanceRate = await prisma.attendance.groupBy({
    by: ['status'],
    where: {
      lecture: {
        courseId: course.id
      }
    },
    _count: true
  }).then(groups => {
    const total = groups.reduce((sum, g) => sum + g._count, 0);
    const present = groups.find(g => g.status === 'PRESENT')?._count || 0;
    return total > 0 ? Math.round((present / total) * 100) : 100;
  });

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{course.name}</h1>
          <p className="text-muted-foreground">{course.code}</p>
        </div>
        <div>
          <CanvasImportButton courseId={course.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-sm text-muted-foreground">Students</div>
          <div className="text-2xl font-bold">{course.students.length}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Class Average</div>
          <div className="text-2xl font-bold">{classAverage}%</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Attendance Rate</div>
          <div className="text-2xl font-bold">{attendanceRate}%</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">At Risk Students</div>
          <div className="text-2xl font-bold text-red-500">{atRiskCount}</div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="grades">Grade Distribution</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
                <CardDescription>General information about the course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Course Code</div>
                  <div className="mt-1">{course.code}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Description</div>
                  <div className="mt-1">{course.description || 'No description available'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Credits</div>
                  <div className="mt-1">{course.credits}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">At Risk Students</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold text-red-500">{atRiskCount}</div>
                    <div className="text-sm text-muted-foreground">
                      ({Math.round(atRiskPercentage)}% of class)
                    </div>
                  </div>
                  <Progress value={atRiskPercentage} className="mt-2" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Pass Rate</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold">
                      {Math.round(((course.students.length - atRiskCount) / course.students.length) * 100) || 0}%
                    </div>
                  </div>
                  <Progress 
                    value={((course.students.length - atRiskCount) / course.students.length) * 100 || 0} 
                    className="mt-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="grid gap-4">
            {course.students.map((enrollment) => (
              <div key={enrollment.student.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={enrollment.student.avatar || undefined} alt={enrollment.student.name} />
                    <AvatarFallback>{enrollment.student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{enrollment.student.name}</div>
                    <div className="text-sm text-muted-foreground">{enrollment.student.email}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>Breakdown of student grades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(gradeRanges).map(([grade, { count }]) => (
                  <div key={grade} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Grade {grade}</div>
                      <div className="text-sm text-muted-foreground">
                        {count} students ({Math.round((count / course.students.length) * 100) || 0}%)
                      </div>
                    </div>
                    <Progress value={(count / course.students.length) * 100 || 0} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Student attendance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Class Average Attendance</div>
                  <div className="mt-2 text-2xl font-bold">{attendanceRate}%</div>
                  <Progress value={attendanceRate} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 