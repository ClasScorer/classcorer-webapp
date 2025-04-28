'use client';

import { Suspense, lazy } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedCourseData } from './PerformanceSection';

// Lazy load components
const LazyPerformanceSection = lazy(() => import('./LazyPerformanceSection'));
const LazyCourseOverview = lazy(() => import('./LazyCourseOverview'));
const LazyBottomSection = lazy(() => import('./LazyBottomSection'));

// Client-side wrapper components with loading fallbacks
interface PerformanceSectionProps {
  courses: EnhancedCourseData[];
}

export function ClientPerformanceSection({ courses }: PerformanceSectionProps) {
  return (
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
      <LazyPerformanceSection courses={courses} />
    </Suspense>
  );
}

interface CourseOverviewProps {
  courses: any[];
}

export function ClientCourseOverview({ courses }: CourseOverviewProps) {
  return (
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
      <LazyCourseOverview courses={courses} />
    </Suspense>
  );
}

interface BottomSectionProps {
  announcements: any[];
  formatDate: (date: string) => Promise<string>;
}

export function ClientBottomSection({ announcements, formatDate }: BottomSectionProps) {
  return (
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
            {[1, 2, 3, 4, 5].map((i) => (
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
      <LazyBottomSection 
        announcements={announcements}
        formatDate={formatDate}
      />
    </Suspense>
  );
} 