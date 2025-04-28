import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PerformanceSummaryProps {
  averageScore: number;
  submissionRate: number;
  attendanceRate: number;
}

export function PerformanceSummary({
  averageScore,
  submissionRate,
  attendanceRate,
}: PerformanceSummaryProps) {
  return (
    <Card className="lg:col-span-2 hover:shadow-md transition-shadow border border-muted">
      <CardHeader className="bg-muted/30">
        <CardTitle>Performance Summary</CardTitle>
        <CardDescription>Key metrics this week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Average Score</span>
            <Badge variant="outline">{averageScore}%</Badge>
          </div>
          <Progress 
            value={averageScore} 
            className="h-2 bg-secondary/30"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Submission Rate</span>
            <Badge variant="outline">{submissionRate}%</Badge>
          </div>
          <Progress 
            value={submissionRate} 
            className="h-2 bg-secondary/30"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Attendance Rate</span>
            <Badge variant="outline">{attendanceRate}%</Badge>
          </div>
          <Progress 
            value={attendanceRate} 
            className="h-2 bg-secondary/30"
          />
        </div>
      </CardContent>
    </Card>
  );
} 