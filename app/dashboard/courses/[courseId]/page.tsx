import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseById, loadStudents } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CoursePageProps {
  params: {
    courseId: Promise<string>;
  };
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const courseId = await params.courseId;
  const course = await getCourseById(courseId);
  if (!course) return { title: "Course Not Found" };

  return {
    title: `${course.name} (${course.code})`,
    description: course.description || `Course details for ${course.name}`,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const courseId = await params.courseId;
  const course = await getCourseById(courseId);
  const allStudents = await loadStudents();
  
  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Course Not Found</h1>
          <p className="text-muted-foreground">The requested course does not exist.</p>
        </div>
      </div>
    );
  }

  // Filter students for this course
  const courseStudents = allStudents.filter(student => student.courseId === course.id);
  
  // Calculate grade distribution based on actual student scores
  const gradeRanges = {
    'A': { min: 90, count: 0 },
    'B': { min: 80, count: 0 },
    'C': { min: 70, count: 0 },
    'D': { min: 60, count: 0 },
    'F': { min: 0, count: 0 }
  };

  courseStudents.forEach(student => {
    const grade = student.average; // Use student's average instead of score
    if (grade >= 90) gradeRanges['A'].count++;
    else if (grade >= 80) gradeRanges['B'].count++;
    else if (grade >= 70) gradeRanges['C'].count++;
    else if (grade >= 60) gradeRanges['D'].count++;
    else gradeRanges['F'].count++;
  });

  // Calculate at-risk students (those with average below 70)
  const atRiskStudents = courseStudents.filter(student => student.average < 70);
  const atRiskPercentage = courseStudents.length > 0 
    ? (atRiskStudents.length / courseStudents.length) * 100 
    : 0;

  // Calculate class statistics
  const classAverage = courseStudents.length > 0
    ? Math.round(courseStudents.reduce((sum, student) => sum + student.average, 0) / courseStudents.length)
    : 0;

  const attendanceRate = courseStudents.length > 0
    ? Math.round(courseStudents.reduce((sum, student) => sum + student.attendance, 0) / courseStudents.length)
    : 0;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{course.name}</h1>
          <p className="text-muted-foreground">{course.code}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Instructor: {course.instructor.name}
          </div>
          <div className={`px-3 py-1 text-sm rounded-full ${
            course.status === 'ahead'
              ? 'bg-green-100 text-green-700'
              : course.status === 'behind'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {course.status}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-sm text-muted-foreground">Progress</div>
          <div className="text-2xl font-bold">{course.progress}%</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Students</div>
          <div className="text-2xl font-bold">{courseStudents.length}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Class Average</div>
          <div className="text-2xl font-bold">{classAverage}%</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Attendance Rate</div>
          <div className="text-2xl font-bold">{attendanceRate}%</div>
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
                  <div className="text-sm font-medium text-muted-foreground">Instructor</div>
                  <div className="mt-1">{course.instructor.name}</div>
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
                    <div className="text-xl font-bold text-red-500">{atRiskStudents.length}</div>
                    <div className="text-sm text-muted-foreground">
                      ({Math.round(atRiskPercentage)}% of class)
                    </div>
                  </div>
                  <Progress value={atRiskPercentage} className="mt-2" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Pass Rate</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold">{Math.round((courseStudents.length - atRiskStudents.length) / courseStudents.length * 100) || 0}%</div>
                  </div>
                  <Progress 
                    value={(courseStudents.length - atRiskStudents.length) / courseStudents.length * 100 || 0} 
                    className="mt-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="grid gap-4">
            {courseStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={student.avatar} alt={student.name} />
                    <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">{student.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">Average</div>
                    <div>{student.average}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Attendance</div>
                    <div>{student.attendance}%</div>
                  </div>
                  <Badge variant={student.average >= 70 ? "success" : "destructive"}>
                    {student.average >= 90 ? 'A' :
                     student.average >= 80 ? 'B' :
                     student.average >= 70 ? 'C' :
                     student.average >= 60 ? 'D' : 'F'}
                  </Badge>
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
                        {count} students ({Math.round((count / courseStudents.length) * 100) || 0}%)
                      </div>
                    </div>
                    <Progress value={(count / courseStudents.length) * 100 || 0} />
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
                <div className="space-y-4">
                  {courseStudents.map((student) => (
                    <div key={student.id} className="flex items-center gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-medium">{student.name}</div>
                        <Progress value={student.attendance} />
                      </div>
                      <div className="text-sm font-medium">{student.attendance}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 