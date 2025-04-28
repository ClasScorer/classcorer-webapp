"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { EnhancedCourseData } from "./PerformanceSection"

interface PerformanceData {
  week: number
  submissions: number
  average: number
  attendance: number
}

function calculateWeeklyStats(courses: EnhancedCourseData[]): PerformanceData[] {
  const maxWeek = Math.max(...courses.map(course => course.week))
  const weeklyStats: PerformanceData[] = []
  
  for (let week = 1; week <= maxWeek; week++) {
    const weekCourses = courses.filter(course => course.week === week)
    
    if (weekCourses.length === 0) {
      const previousWeek = weeklyStats[weeklyStats.length - 1]
      weeklyStats.push({
        week,
        submissions: previousWeek ? previousWeek.submissions : 0,
        average: previousWeek ? previousWeek.average : 0,
        attendance: previousWeek ? previousWeek.attendance : 0
      })
      continue
    }
    
    const totalStudents = weekCourses.reduce((sum, course) => sum + course.totalStudents, 0)
    
    const submissions = weekCourses.reduce((sum, course) => 
      sum + (course.submissionRate * course.totalStudents), 0) / (totalStudents || 1)
    
    const average = weekCourses.reduce((sum, course) => 
      sum + (course.averageScore * course.totalStudents), 0) / (totalStudents || 1)
    
    const attendance = weekCourses.reduce((sum, course) => 
      sum + (course.averageAttendance * course.totalStudents), 0) / (totalStudents || 1)
    
    weeklyStats.push({
      week,
      submissions: Math.round(submissions),
      average: Math.round(average),
      attendance: Math.round(attendance)
    })
  }
  
  return weeklyStats
}

interface PerformanceGraphProps {
  courses: EnhancedCourseData[];
}

export function PerformanceGraph({ courses }: PerformanceGraphProps) {
  const data = calculateWeeklyStats(courses)

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="week"
            tickFormatter={(week) => `W${week}`}
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
            tickLine={false}
            axisLine={false}
            dx={-10}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <div className="mb-2 text-sm font-medium">
                      Week {label}
                    </div>
                    <div className="space-y-1">
                      {payload.map((p) => (
                        <div key={p.dataKey} className="flex items-center justify-between gap-8">
                          <span className="text-sm capitalize text-muted-foreground">
                            {p.dataKey}
                          </span>
                          <span className="text-sm font-medium" style={{ color: p.color }}>
                            {p.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            content={({ payload }) => (
              <div className="flex justify-center gap-6">
                {payload?.map((entry) => (
                  <div key={entry.value} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-muted-foreground capitalize">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          />
          <Line
            type="monotone"
            dataKey="submissions"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="attendance"
            stroke="#f43f5e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 