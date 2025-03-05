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
  type LucideIcon
} from "lucide-react"

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
import { type Course, loadCourses, getCurrentUser } from "@/lib/data"

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
    title: "Configuration",
    url: "/dashboard/configuration",
    icon: Settings2,
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

  useEffect(() => {
    async function loadData() {
      const [courses, user] = await Promise.all([
        loadCourses(),
        getCurrentUser(),
      ])

      if (user) {
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
          user,
          teams: [
            {
              name: user.department || "Department",
              logo: School,
              plan: "Department",
            },
          ],
          navMain: updatedNavMain,
        })
      }
    }

    loadData()
  }, [])

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
