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
import { type Course, loadCourses } from "@/lib/data"

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
    name: string
    email: string
    avatar: string
  }
  teams: Array<{
    name: string
    logo: LucideIcon
    plan: string
  }>
  navMain: Array<NavItem | NavLabel>
}

// Navigation data structure
const baseData: NavData = {
  user: {
    name: "Professor Smith",
    email: "smith@university.edu",
    avatar: "/avatars/professor.jpg",
  },
  teams: [
    {
      name: "Computer Science",
      logo: School,
      plan: "Department",
    },
  ],
  navMain: [
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
      items: [], // Will be populated from CSV
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [navData, setNavData] = useState<NavData>(baseData)

  useEffect(() => {
    async function fetchCourses() {
      try {
        const courses = await loadCourses()
        setNavData(prev => {
          const updatedNavMain = prev.navMain.map(item => {
            if ('title' in item && item.title === "Courses") {
              return {
                ...item,
                items: courses.map(course => ({
                  title: course.name,
                  url: `/dashboard/courses/${course.id}`,
                  icon: BookOpen,
                  status: course.status,
                }))
              }
            }
            return item
          })
          return { ...prev, navMain: updatedNavMain }
        })
      } catch (error) {
        console.error('Error loading courses:', error)
      }
    }
    fetchCourses()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={navData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
