"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { 
  BookOpen, 
  Calendar,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,
  Settings2,
  School,
  Trophy,
  Bug,
  UserCog,
  type LucideIcon
} from "lucide-react"
import { useSession } from "next-auth/react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { type Course, fetchCourses } from "@/lib/data"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  items?: Array<{
    title: string
    url: string
    icon: LucideIcon
    status?: string
  }>
}

interface NavLabel {
  type: 'label'
  title: string
}

type NavData = {
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
    role: string
    department: string | null
  }
  teams: Array<{
    name: string
    logo: LucideIcon
    plan: string
  }>
  navMain: Array<NavItem | NavLabel>
}

// Base navigation data structure
const baseNavMain: Array<NavItem | NavLabel> = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Courses",
    url: "/dashboard/courses",
    icon: BookOpen,
    items: [], // Will be populated from database
  },
  {
    type: 'label' as const,
    title: 'Teaching',
  },
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Students",
    url: "/dashboard/students",
    icon: GraduationCap,
  },
  {
    title: "Lectures",
    url: "/dashboard/lectures",
    icon: Library,
  },
  {
    title: "Assignments",
    url: "/dashboard/assignments",
    icon: ListChecks,
  },
  {
    title: "Leaderboard",
    url: "/dashboard/leaderboard",
    icon: Trophy,
  },
  {
    type: 'label' as const,
    title: 'Settings',
  },
  {
    title: "Account",
    url: "/dashboard/account",
    icon: UserCog,
  },
  {
    title: "Configuration",
    url: "/dashboard/configuration",
    icon: Settings2,
  },
  {
    title: "Debug",
    url: "/dashboard/debug",
    icon: Bug,
  },
]

export function AppSidebar() {
  const [navData, setNavData] = useState<NavData>({
    user: {
      id: '',
      name: '',
      email: '',
      avatar: null,
      role: '',
      department: null,
    },
    teams: [
      {
        name: "Computer Science",
        logo: School,
        plan: "Department",
      },
    ],
    navMain: baseNavMain,
  })

  const session = useSession()

  useEffect(() => {
    // Add a small delay to ensure session is initialized
    const timer = setTimeout(async () => {
      try {
        const user = session.data?.user
        
        if (!user) {
          console.log("No user session available yet")
          return
        }
        
        // Only attempt to fetch courses if user is available
        const courses = await fetchCourses().catch(err => {
          console.error("Error fetching courses:", err)
          return []
        })

        // Update courses in navigation with course IDs
        const updatedNavMain = navData.navMain.map(item => {
          if ('url' in item && item.url === '/dashboard/courses') {
            return {
              ...item,
              items: courses.map(course => ({
                title: course.code || `Course ${course.id}`, // Show course code or ID
                url: `/dashboard/courses/${course.id}`,
                icon: BookOpen,
                status: course.status,
              })),
            }
          }
          return item
        })

        setNavData({
          user: {
            id: user.id || '',
            name: user.name || '',
            email: user.email || '',
            avatar: null,
            role: user.role || 'PROFESSOR',
            department: null,
          },
          teams: [
            {
              name: "Department",
              logo: School,
              plan: "Department",
            },
          ],
          navMain: updatedNavMain,
        })
      } catch (error) {
        console.error("Error loading sidebar data:", error)
      }
    }, 500) // 500ms delay to ensure session is initialized
    
    return () => clearTimeout(timer)
  }, [session.data])

  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader>
        <TeamSwitcher teams={navData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
