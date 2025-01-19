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
    courseId: string;
  };
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const course = await getCourseById(params.courseId);
  if (!course) return { title: "Course Not Found" };

  return {
    title: `${course.name} (${course.code})`,
    description: course.description,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const course = await getCourseById(params.courseId);
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
  
  // Calculate grade distribution
  const gradeRanges = {
    'A': { min: 90, count: 0 },
    'B': { min: 80, count: 0 },
    'C': { min: 70, count: 0 },
    'D': { min: 60, count: 0 },
    'F': { min: 0, count: 0 }
  };

  courseStudents.forEach(student => {
    const grade = student.score;
    if (grade >= 90) gradeRanges['A'].count++;
    else if (grade >= 80) gradeRanges['B'].count++;
    else if (grade >= 70) gradeRanges['C'].count++;
    else if (grade >= 60) gradeRanges['D'].count++;
    else gradeRanges['F'].count++;
  });

  // Calculate at-risk students
  const atRiskStudents = courseStudents.filter(student => student.score < 70);
  const atRiskPercentage = (atRiskStudents.length / courseStudents.length) * 100;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{course.name}</h2>
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 text-sm rounded-full ${
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseStudents.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled in {course.code}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.average}%</div>
            <Progress value={course.average} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{atRiskStudents.length}</div>
            <Progress value={atRiskPercentage} className="mt-2 bg-red-100">
              <div className="h-full bg-red-500" style={{ width: `${atRiskPercentage}%` }} />
            </Progress>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.progress}%</div>
            <Progress value={course.progress} className="mt-2" />
          </CardContent>
        </Card>
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
                  <div className="mt-1">{course.description}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Instructor</div>
                  <div className="mt-1">{course.instructor}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Credits</div>
                  <div className="mt-1">{course.credits}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Pass Rate</div>
                  <div className="mt-1">{course.passRate}%</div>
                  <Progress value={course.passRate} className="mt-2" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">At Risk Students</div>
                  <div className="mt-1">{atRiskStudents.length} students</div>
                  <Progress value={atRiskPercentage} className="mt-2 bg-red-100">
                    <div className="h-full bg-red-500" style={{ width: `${atRiskPercentage}%` }} />
                  </Progress>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Class Average</div>
                  <div className="mt-1">{course.classAverage}%</div>
                  <Progress value={course.classAverage} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student List</CardTitle>
              <CardDescription>Detailed student performance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">Current Grade</div>
                        <div className={`text-lg ${
                          student.score >= 90 ? 'text-green-600' :
                          student.score >= 80 ? 'text-blue-600' :
                          student.score >= 70 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {student.score}%
                        </div>
                      </div>
                      <Badge variant={
                        student.status === 'Excellent' ? 'default' :
                        student.status === 'Good' ? 'secondary' :
                        'destructive'
                      }>
                        {student.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>Breakdown of student grades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(gradeRanges).map(([grade, data]) => (
                  <div key={grade} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Grade {grade}</span>
                      <span>{data.count} students</span>
                    </div>
                    <Progress 
                      value={(data.count / courseStudents.length) * 100} 
                      className={`h-2 ${
                        grade === 'A' ? 'bg-green-100' :
                        grade === 'B' ? 'bg-blue-100' :
                        grade === 'C' ? 'bg-yellow-100' :
                        grade === 'D' ? 'bg-orange-100' :
                        'bg-red-100'
                      }`}
                    >
                      <div 
                        className={`h-full ${
                          grade === 'A' ? 'bg-green-500' :
                          grade === 'B' ? 'bg-blue-500' :
                          grade === 'C' ? 'bg-yellow-500' :
                          grade === 'D' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`} 
                        style={{ width: `${(data.count / courseStudents.length) * 100}%` }} 
                      />
                    </Progress>
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
              <CardDescription>Weekly attendance patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseStudents.map((student) => (
                  <div key={student.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Avatar>
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">Attendance Rate: {student.attendance || 0}%</div>
                    </div>
                    <Progress value={Number(student.attendance) || 0} className="w-1/3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 