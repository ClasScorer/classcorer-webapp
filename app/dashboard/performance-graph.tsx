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
      sum + (course.average * course.totalStudents), 0) / totalStudents
    
    const attendance = weekCourses.reduce((sum, course) => 
      sum + (course.attendance * course.totalStudents), 0) / totalStudents
    
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
    <Card>
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>Weekly performance metrics across all courses</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tickFormatter={(week) => `Week ${week}`} />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Week
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].payload.week}
                            </span>
                          </div>
                          {payload.map((p) => (
                            <div key={p.dataKey} className="flex flex-col">
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
              <Legend />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="submissions"
                stroke="#2563eb"
                activeDot={{ r: 6, style: { fill: "#2563eb", opacity: 0.25 } }}
              />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="average"
                stroke="#16a34a"
                activeDot={{ r: 6, style: { fill: "#16a34a", opacity: 0.25 } }}
              />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="attendance"
                stroke="#dc2626"
                activeDot={{ r: 6, style: { fill: "#dc2626", opacity: 0.25 } }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 