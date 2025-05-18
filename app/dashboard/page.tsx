import { Metadata } from "next";
import { Suspense } from "react";
import { formatDateServer } from "@/lib/serverActions";
import { Skeleton } from "@/components/ui/skeleton";

// Import server components directly
import { DashboardHeader } from "@/components/dashboard";
import { StatCards } from "@/components/dashboard";
import { CanvasSection } from "@/components/dashboard";

// Import client component wrappers
import { 
  ClientPerformanceSection, 
  ClientCourseOverview, 
  ClientBottomSection 
} from "@/components/dashboard/ClientComponents";

// Import data fetching functions
import { getTotalStats, getCourseStats, getCanvasIntegrationStatus } from "../../hooks/dashboard/useDashboardData";

export const metadata: Metadata = {
  title: "Professor Dashboard",
  description: "Course management and student performance analytics dashboard",
};

// Enable streaming with server-side rendering that's always fresh
export const fetchCache = 'force-no-store';
export const revalidate = 0; // Don't cache this page

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        {/* Welcome Section - Critical UI, load immediately */}
        <DashboardHeader />

        {/* Canvas Integration - Wrap in suspense for streaming */}
        <Suspense fallback={<div className="h-16" />}>
          <CanvasIntegrationSection />
        </Suspense>

        {/* Stats Cards - Critical stats, load with streaming */}
        <Suspense fallback={
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-md border border-muted">
                <Skeleton className="h-6 w-28 mb-4" />
                <Skeleton className="h-10 w-12 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        }>
          <StatsCardSection />
        </Suspense>

        {/* Performance Overview - Load with client component */}
        <Suspense fallback={
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7 mb-8">
            <div className="lg:col-span-5 p-6 rounded-md border border-muted">
              <Skeleton className="h-[350px] w-full" />
            </div>
            <div className="lg:col-span-2 p-6 rounded-md border border-muted">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        }>
          <PerformanceSectionWrapper />
        </Suspense>

        {/* Course Overview - Load with client component */}
        <Suspense fallback={
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-md p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-6" />
                  <Skeleton className="h-2 w-full mb-6" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }>
          <CourseOverviewWrapper />
        </Suspense>

        {/* Bottom Section - Load with client component */}
        <Suspense fallback={
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <div className="border rounded-md p-4">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-8" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-md p-4">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-8" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }>
          <BottomSectionWrapper />
        </Suspense>
      </div>
    </div>
  );
}

// Separate components for data fetching to enable streaming
async function CanvasIntegrationSection() {
  const canvasStatus = await getCanvasIntegrationStatus();
  return <CanvasSection isActive={canvasStatus.isActive} />;
}

async function StatsCardSection() {
  const totalStats = await getTotalStats();
  return (
    <StatCards
      totalStudents={totalStats.totalStudents}
      averageAttendance={totalStats.averageAttendance}
      averagePassRate={totalStats.averagePassRate}
      atRiskStudents={totalStats.atRiskStudents}
      upcomingDeadlines={totalStats.upcomingDeadlines}
      studentTrend={totalStats.studentTrend}
    />
  );
}

async function PerformanceSectionWrapper() {
  const courseStats = await getCourseStats();
  return <ClientPerformanceSection courses={courseStats} />;
}

async function CourseOverviewWrapper() {
  const courseStats = await getCourseStats();
  return <ClientCourseOverview courses={courseStats} />;
}

async function BottomSectionWrapper() {
  const totalStats = await getTotalStats();
  
  // Pre-format the dates server-side once to avoid repeated server calls
  const formattedDateFn = formatDateServer;
  
  return (
    <ClientBottomSection
      announcements={totalStats.recentAnnouncements}
      formatDate={formattedDateFn}
    />
  );
}