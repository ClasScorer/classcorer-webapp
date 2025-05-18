"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { type Course, fetchCourses, fetchCourseById } from "@/lib/data"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status
    if (status === "unauthenticated") {
      console.log("User not authenticated, redirecting to login page");
      router.replace("/login");
      return;
    }

    if (status === "loading") {
      console.log("Session loading...");
      setIsLoading(true);
      return;
    }

    // Only fetch course data if authenticated
    if (status === "authenticated") {
      console.log("User authenticated:", session?.user);
      
      if (!session?.user?.id) {
        console.error("Session user ID missing, redirecting to login");
        router.replace("/login");
        return;
      }
      
      setIsLoading(false);
      
      async function fetchCourseData() {
        try {
          // Extract courseId from pathname if we're in a course route
          const match = pathname.match(/\/courses\/([^\/]+)/)
          if (match) {
            const courseId = match[1]
            const course = await fetchCourseById(courseId)
            setCurrentCourse(course)
          } else {
            setCurrentCourse(null)
          }
        } catch (error) {
          console.error('Error loading course data:', error)
          setCurrentCourse(null)
        }
      }
      
      fetchCourseData()
    }
  }, [pathname, router, status, session])

  // Determine the current page name based on the pathname
  const getPageName = () => {
    if (pathname === '/dashboard') return 'Overview'
    if (pathname === '/dashboard/students') return 'Students'
    if (pathname === '/dashboard/courses') return 'Courses'
    if (pathname === '/dashboard/calendar') return 'Calendar'
    if (currentCourse) return currentCourse.name
    return 'Overview'
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {isLoading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  {currentCourse ? (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/courses">
                          Courses
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{currentCourse.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbPage>{getPageName()}</BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </header>
        <main className="flex-1">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="space-y-4 text-center">
                <Skeleton className="h-12 w-[250px] mx-auto" />
                <Skeleton className="h-4 w-[300px] mx-auto" />
                <div className="flex justify-center gap-2 pt-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
} 