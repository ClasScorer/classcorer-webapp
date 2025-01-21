"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { type Course } from "@/lib/data"

interface PerformanceData {
  week: number
  submissions: number
  average: number
  attendance: number
}

function calculateWeeklyStats(courses: Course[]): PerformanceData[] {
  // Find the maximum week across all courses
  const maxWeek = Math.max(...courses.map(course => course.week))
  
  // Initialize weekly stats array
  const weeklyStats: PerformanceData[] = []
  
  // Calculate stats for each week
  for (let week = 1; week <= maxWeek; week++) {
    const weekCourses = courses.filter(course => course.week === week)
    
    if (weekCourses.length === 0) {
      // If no courses for this week, use previous week's data or default values
      const previousWeek = weeklyStats[weeklyStats.length - 1]
      weeklyStats.push({
        week,
        submissions: previousWeek ? previousWeek.submissions : 0,
        average: previousWeek ? previousWeek.average : 0,
        attendance: previousWeek ? previousWeek.attendance : 0
      })
      continue
    }
    
    // Calculate weighted averages for the week based on student count
    const totalStudents = weekCourses.reduce((sum, course) => sum + course.totalStudents, 0)
    
    const submissions = weekCourses.reduce((sum, course) => 
      sum + (course.submissions * course.totalStudents), 0) / totalStudents
    
    const average = weekCourses.reduce((sum, course) => 
      sum + (course.averageScore * course.totalStudents), 0) / totalStudents
    
    const attendance = weekCourses.reduce((sum, course) => 
      sum + (course.averageAttendance * course.totalStudents), 0) / totalStudents
    
    weeklyStats.push({
      week,
      submissions: Math.round(submissions),
      average: Math.round(average),
      attendance: Math.round(attendance)
    })
  }
  
  return weeklyStats
}

export function PerformanceGraph({ courses }: { courses: Course[] }) {
  const data = calculateWeeklyStats(courses)

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>Weekly performance metrics across all courses</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 pb-8">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="week" 
                tickFormatter={(week) => `Week ${week}`}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-lg">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground font-medium">
                              Week {payload[0].payload.week}
                            </span>
                          </div>
                          {payload.map((p) => (
                            <div key={p.dataKey} className="flex items-center justify-between gap-2">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {p.dataKey}
                              </span>
                              <span className="font-bold" style={{ color: p.color }}>
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
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm capitalize text-muted-foreground">
                    {value}
                  </span>
                )}
              />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="submissions"
                stroke="#3b82f6"
                dot={false}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="average"
                stroke="#22c55e"
                dot={false}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="attendance"
                stroke="#f43f5e"
                dot={false}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 