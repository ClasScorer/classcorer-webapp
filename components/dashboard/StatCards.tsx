import { TrendingUp, TrendingDown, AlertTriangle, CalendarDays, BookOpen, Bell, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Deadline {
  course: string;
  task: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
}

interface StatCardsProps {
  totalStudents: number;
  averageAttendance: number;
  averagePassRate: number;
  atRiskStudents: number;
  upcomingDeadlines: Deadline[];
  studentTrend: 'up' | 'down';
}

export function StatCards({
  totalStudents,
  averageAttendance,
  averagePassRate,
  atRiskStudents,
  upcomingDeadlines,
  studentTrend,
}: StatCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card className="border-t-4 border-t-primary hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <GraduationCap className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">{totalStudents}</div>
            <Badge variant={studentTrend === 'up' ? 'default' : 'secondary'} className="ml-2">
              {studentTrend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">
              {atRiskStudents} at risk
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-t-blue-500 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
          <CalendarDays className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">{averageAttendance}%</div>
            <Badge 
              variant={averageAttendance >= 90 ? 'default' : 'secondary'} 
              className="ml-2"
            >
              {averageAttendance >= 90 ? 'On Track' : 'Below Target'}
            </Badge>
          </div>
          <Progress value={averageAttendance} className="mt-3 h-2 bg-blue-100" />
          <p className="text-xs text-muted-foreground mt-2">
            Target: 90% attendance rate
          </p>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-t-green-500 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
          <BookOpen className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">{averagePassRate}%</div>
            <Badge 
              variant={averagePassRate >= 80 ? 'default' : 'destructive'} 
              className="ml-2"
            >
              {averagePassRate >= 80 ? 'Above Target' : 'Below Target'}
            </Badge>
          </div>
          <Progress value={averagePassRate} className="mt-3 h-2 bg-green-100" />
          <p className="text-xs text-muted-foreground mt-2">
            Target: 80% pass rate
          </p>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-t-amber-500 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
          <Bell className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingDeadlines.slice(0, 2).map((deadline, index) => (
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
  );
} 