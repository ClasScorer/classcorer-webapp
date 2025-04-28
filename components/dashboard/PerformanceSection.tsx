import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceGraph } from "./performance-graph";
import { PerformanceSummary } from "./PerformanceSummary";

// Define a proper interface for course data expected by PerformanceGraph
export interface EnhancedCourseData {
  id: string;
  code: string;
  name: string;
  term?: string;
  section?: string;
  totalStudents: number;
  averageAttendance: number;
  averageScore: number;
  atRiskCount: number;
  submissionRate: number;
  progress: number;
  week: number;
  submissions?: number;
  stats?: {
    classAverage: any;
    engagement: any;
    assignments: any;
    progress: any;
  };
}

interface PerformanceSectionProps {
  courses: EnhancedCourseData[];
}

export function PerformanceSection({ courses }: PerformanceSectionProps) {
  // Calculate average metrics across all courses
  const averageScore = Math.round(
    courses.reduce((sum, course) => sum + course.averageScore, 0) / courses.length
  );
  
  const submissionRate = Math.round(
    courses.reduce((sum, course) => sum + course.submissionRate, 0) / courses.length
  );
  
  const attendanceRate = Math.round(
    courses.reduce((sum, course) => sum + course.averageAttendance, 0) / courses.length
  );

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-7 mb-8">
      <Card className="lg:col-span-5 hover:shadow-md transition-shadow border border-muted">
        <CardHeader className="bg-muted/30">
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Track submissions, scores, and attendance over time</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <PerformanceGraph courses={courses} />
        </CardContent>
      </Card>

      <PerformanceSummary 
        averageScore={averageScore}
        submissionRate={submissionRate}
        attendanceRate={attendanceRate}
      />
    </div>
  );
} 