import { CourseData } from "./types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceGraph } from "../performance-graph";
import { StudentLeaderboard } from "../student-leaderboard";

interface CoursePageProps {
  data: CourseData;
}

export function CoursePage({ data }: CoursePageProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{data.code}: {data.name}</h2>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <span className="text-sm font-medium">{data.term}</span>
              <span className="hidden md:inline text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{data.section}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center px-3 py-2 md:px-4 md:py-2 bg-muted rounded-lg">
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-blue-500">
                  <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                </svg>
                <span className="text-sm md:text-base font-medium">{data.totalStudents}</span>
              </div>
              <span className="text-[10px] md:text-xs text-muted-foreground mt-1">Students</span>
            </div>
            <div className="flex flex-col items-center px-3 py-2 md:px-4 md:py-2 bg-muted rounded-lg">
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-green-500">
                  <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
                </svg>
                <span className="text-sm md:text-base font-medium">{data.attendance}%</span>
              </div>
              <span className="text-[10px] md:text-xs text-muted-foreground mt-1">Attendance</span>
            </div>
            <div className="flex flex-col items-center px-3 py-2 md:px-4 md:py-2 bg-muted rounded-lg">
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-yellow-500">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
                <span className="text-sm md:text-base font-medium">{data.passRate}%</span>
              </div>
              <span className="text-[10px] md:text-xs text-muted-foreground mt-1">Pass Rate</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Class Average
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${data.stats.classAverage.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-2 py-0.5 rounded-full`}>
                  {data.stats.classAverage.trend >= 0 ? 'Above Target' : 'Below Target'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted-foreground">
                  <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-bold">{data.stats.classAverage.average}%</div>
                <div className={`text-sm ${data.stats.classAverage.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {data.stats.classAverage.trend >= 0 ? '+' : ''}{data.stats.classAverage.trend}%
                </div>
              </div>
              <Progress value={data.stats.classAverage.average} className="mt-2" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-xs text-muted-foreground">
                  <div>Target</div>
                  <div className="font-medium">{data.stats.classAverage.target}%</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>Previous Term</div>
                  <div className="font-medium">{data.stats.classAverage.previousAverage}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Student Engagement
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${data.stats.engagement.trend >= -2 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded-full`}>
                  {data.stats.engagement.trend >= -2 ? 'Good' : 'Needs Attention'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted-foreground">
                  <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-bold">{data.stats.engagement.percentage}%</div>
                <div className={`text-sm ${data.stats.engagement.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {data.stats.engagement.trend >= 0 ? '+' : ''}{data.stats.engagement.trend}%
                </div>
              </div>
              <Progress value={data.stats.engagement.percentage} className="mt-2" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-xs text-muted-foreground">
                  <div>Active Students</div>
                  <div className="font-medium">{data.stats.engagement.activeStudents}/{data.stats.engagement.totalStudents}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>At Risk</div>
                  <div className="font-medium text-red-500">{data.stats.engagement.atRiskCount} Students</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignment Completion</CardTitle>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${
                  data.stats.assignments.status === 'ahead' ? 'bg-green-100 text-green-700' :
                  data.stats.assignments.status === 'on-track' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                } px-2 py-0.5 rounded-full`}>
                  {data.stats.assignments.status === 'ahead' ? 'Ahead' :
                   data.stats.assignments.status === 'on-track' ? 'On Track' :
                   'Behind'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted-foreground">
                  <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zM6 12a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V12zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 15a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V15zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 18a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V18zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-bold">{data.stats.assignments.completionRate}%</div>
                <div className="text-sm text-green-500">
                  {data.stats.assignments.submittedCount}/{data.stats.assignments.totalAssignments}
                </div>
              </div>
              <Progress value={data.stats.assignments.completionRate} className="mt-2" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-xs text-muted-foreground">
                  <div>Submitted</div>
                  <div className="font-medium">{data.stats.assignments.submittedCount}/{data.stats.assignments.totalAssignments} Tasks</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>Next Due</div>
                  <div className="font-medium">{data.stats.assignments.nextDueAssignment}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Course Progress
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${
                  data.stats.progress.status === 'ahead' ? 'bg-green-100 text-green-700' :
                  data.stats.progress.status === 'on-schedule' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                } px-2 py-0.5 rounded-full`}>
                  {data.stats.progress.status === 'ahead' ? 'Ahead' :
                   data.stats.progress.status === 'on-schedule' ? 'On Schedule' :
                   'Behind'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted-foreground">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-bold">{data.stats.progress.percentage}%</div>
                <div className="text-sm text-green-500">Week {data.stats.progress.currentWeek}/{data.stats.progress.totalWeeks}</div>
              </div>
              <Progress value={data.stats.progress.percentage} className="mt-2" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-xs text-muted-foreground">
                  <div>Current Topic</div>
                  <div className="font-medium">{data.stats.progress.currentTopic}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>Next Topic</div>
                  <div className="font-medium">{data.stats.progress.nextTopic}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Analytics and Student List */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="w-full sm:w-auto flex justify-start overflow-x-auto">
            <TabsTrigger value="analytics" className="flex-1 sm:flex-none">Class Analytics</TabsTrigger>
            <TabsTrigger value="students" className="flex-1 sm:flex-none">Student Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics" className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>
                  Class-wide performance metrics and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2 overflow-x-auto">
                <div className="min-w-[600px] md:min-w-0">
                  <PerformanceGraph />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Rankings</CardTitle>
                <CardDescription>
                  Performance breakdown by student 📊
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <StudentLeaderboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 