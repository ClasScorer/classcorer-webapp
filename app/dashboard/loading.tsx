import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-60 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>

        {/* Canvas Section Skeleton */}
        <div className="h-16" />

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-md p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-2 w-full" />
                <div className="flex items-center">
                  <Skeleton className="h-5 w-5 rounded-full mr-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Overview Skeleton */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7 mb-8">
          <div className="lg:col-span-5 border rounded-md p-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-6" />
            <Skeleton className="h-[350px] w-full" />
          </div>
          <div className="lg:col-span-2 border rounded-md p-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Course Overview Skeleton */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-md p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Skeleton className="h-6 w-20 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-10" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-10" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-10" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-10" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="border rounded-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Skeleton className="h-6 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
            
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border rounded-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Skeleton className="h-6 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 