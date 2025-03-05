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
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { type Course, loadCourses } from "@/lib/data"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null)

  useEffect(() => {
    async function fetchCourseData() {
      try {
        // Extract courseId from pathname if we're in a course route
        const match = pathname.match(/\/courses\/(\d+)/)
        if (match) {
          const courseId = match[1]
          const courses = await loadCourses()
          const course = courses.find(c => c.id.toString() === courseId)
          setCurrentCourse(course || null)
        } else {
          setCurrentCourse(null)
        }
      } catch (error) {
        console.error('Error loading course data:', error)
        setCurrentCourse(null)
      }
    }
    fetchCourseData()
  }, [pathname])

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
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
} 