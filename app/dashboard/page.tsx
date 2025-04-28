import { Metadata } from "next";
import { Suspense } from "react";
import { formatDate } from "@/lib/utils";

// Import components from index file
import {
  DashboardHeader,
  StatCards,
  PerformanceSection,
  CourseOverview,
  BottomSection,
  CanvasSection
} from "@/components/dashboard";

// Import data fetching functions
import { getTotalStats, getCourseStats, getCanvasIntegrationStatus } from "./hooks/useDashboardData";

export const metadata: Metadata = {
  title: "Professor Dashboard",
  description: "Course management and student performance analytics dashboard",
};

export default async function DashboardPage() {
  // Fetch all the required data
  const totalStats = await getTotalStats();
  const courseStats = await getCourseStats();
  const canvasStatus = await getCanvasIntegrationStatus();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        {/* Welcome Section */}
        <DashboardHeader />

        {/* Canvas LMS Integration Section - Only shown when active */}
        <CanvasSection isActive={canvasStatus.isActive} />

        {/* Quick Stats with Trends */}
        <StatCards
          totalStudents={totalStats.totalStudents}
          averageAttendance={totalStats.averageAttendance}
          averagePassRate={totalStats.averagePassRate}
          atRiskStudents={totalStats.atRiskStudents}
          upcomingDeadlines={totalStats.upcomingDeadlines}
          studentTrend={totalStats.studentTrend}
        />

        {/* Performance Overview and Summary */}
        <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading performance data...</div>}>
          <PerformanceSection courses={courseStats} />
        </Suspense>

        {/* Course Overview Grid */}
        <CourseOverview courses={courseStats} />

        {/* Recent Announcements and Student Leaderboard */}
        <BottomSection 
          announcements={totalStats.recentAnnouncements}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
}