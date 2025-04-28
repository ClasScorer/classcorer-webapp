import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CourseOverviewItem {
  id: string;
  code: string;
  name: string;
  progress: number;
  totalStudents: number;
  atRiskCount: number;
  averageAttendance: number;
  averageScore: number;
}

interface CourseOverviewProps {
  courses: CourseOverviewItem[];
}

export function CourseOverview({ courses }: CourseOverviewProps) {
  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Course Overview</h3>
          <p className="text-sm text-muted-foreground">Performance metrics for all active courses</p>
        </div>
        <Button variant="outline" size="sm" asChild className="hover:bg-secondary">
          <Link href="/dashboard/courses">
            View All Courses
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link 
            key={course.id}
            href={`/dashboard/courses/${course.id}`}
            className="block group"
          >
            <Card className="transition-all duration-200 hover:shadow-md group-hover:border-primary/20">
              <CardHeader className="pb-3 bg-muted/20">
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
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-1 bg-secondary/20" />
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
  );
} 