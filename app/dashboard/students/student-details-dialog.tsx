"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Student } from "@prisma/client"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  User, Mail, Calendar, BookOpen, Award, 
  Clock, AlertTriangle, CheckCircle, BarChart 
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StudentDetailsDialogProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function StudentDetailsDialog({
  student,
  open,
  onOpenChange,
}: StudentDetailsDialogProps) {
  const [detailedStudent, setDetailedStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!student || !open) return

      setLoading(true)

      try {
        const response = await fetch(`/api/students/${student.id}?include=all`)
        if (!response.ok) {
          throw new Error("Failed to fetch student details")
        }

        const data = await response.json()
        setDetailedStudent(data)
      } catch (error) {
        console.error("Error fetching student details:", error)
      } finally {
        setLoading(false)
      }
    }

    if (open && student) {
      fetchStudentDetails()
    }
  }, [student, open])

  // Calculate metrics when student data is loaded
  const metrics = (() => {
    if (!detailedStudent) return null

    // Calculate average grade
    const submissions = detailedStudent.submissions || []
    const avgGrade = submissions.length > 0
      ? Math.round(submissions.reduce((sum: number, sub: any) => sum + (sub.score || 0), 0) / submissions.length)
      : 0

    // Calculate attendance rate
    const attendances = detailedStudent.attendances || []
    const attendanceRate = attendances.length > 0
      ? Math.round((attendances.filter((a: any) => a.status === 'PRESENT').length / attendances.length) * 100)
      : 0

    // Calculate engagement score
    const engagements = detailedStudent.engagements || []
    const avgEngagement = engagements.length > 0
      ? Math.round(engagements.reduce((sum: number, eng: any) => sum + eng.focusScore, 0) / engagements.length)
      : 0

    // Calculate submission rate
    const assignments = detailedStudent.enrollments
      .flatMap((e: any) => e.course?.assignments || [])
    
    const submissionRate = assignments.length > 0
      ? Math.round((submissions.length / assignments.length) * 100)
      : 0

    return {
      avgGrade,
      attendanceRate,
      submissionRate,
      avgEngagement,
      engagementLevel: avgEngagement >= 80 ? "High" : avgEngagement >= 50 ? "Medium" : "Low",
      status: avgGrade >= 85 ? "Excellent" : avgGrade >= 70 ? "Good" : "Needs Help"
    }
  })()

  // Get badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent":
        return "bg-green-500/20 text-green-700 border-green-700/50"
      case "Good":
        return "bg-blue-500/20 text-blue-700 border-blue-700/50"
      case "Needs Help":
        return "bg-red-500/20 text-red-700 border-red-700/50"
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-700/50"
    }
  }

  // Get progress bar color based on value
  const getProgressColor = (value: number) => {
    if (value >= 85) return "bg-green-500"
    if (value >= 70) return "bg-blue-500"
    return "bg-red-500"
  }

  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            View detailed information about this student
          </DialogDescription>
        </DialogHeader>

        {loading || !detailedStudent ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Student profile */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://avatar.vercel.sh/${detailedStudent.id}`} alt={detailedStudent.name} />
                  <AvatarFallback>{detailedStudent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{detailedStudent.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{detailedStudent.email}</span>
                  </div>
                  {metrics && (
                    <Badge variant="outline" className={cn("mt-2", getStatusColor(metrics.status))}>
                      {metrics.status}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics && (
                  <>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between py-2">
                        <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">{metrics.avgGrade}%</div>
                        <Progress
                          value={metrics.avgGrade}
                          max={100}
                          className="h-2"
                          indicatorClassName={getProgressColor(metrics.avgGrade)}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between py-2">
                        <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">{metrics.attendanceRate}%</div>
                        <Progress
                          value={metrics.attendanceRate}
                          max={100}
                          className="h-2"
                          indicatorClassName={getProgressColor(metrics.attendanceRate)}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between py-2">
                        <CardTitle className="text-sm font-medium">Submission Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">{metrics.submissionRate}%</div>
                        <Progress
                          value={metrics.submissionRate}
                          max={100}
                          className="h-2"
                          indicatorClassName={getProgressColor(metrics.submissionRate)}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between py-2">
                        <CardTitle className="text-sm font-medium">Engagement Level</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">{metrics.engagementLevel}</div>
                        <Progress
                          value={metrics.avgEngagement}
                          max={100}
                          className="h-2"
                          indicatorClassName={getProgressColor(metrics.avgEngagement)}
                        />
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Tabs for details */}
              <Tabs defaultValue="courses">
                <TabsList className="w-full">
                  <TabsTrigger value="courses" className="flex-1">Courses</TabsTrigger>
                  <TabsTrigger value="assignments" className="flex-1">Assignments</TabsTrigger>
                  <TabsTrigger value="attendance" className="flex-1">Attendance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="courses" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Enrolled Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-md border">
                        <div className="grid divide-y">
                          {detailedStudent.enrollments?.length > 0 ? (
                            detailedStudent.enrollments.map((enrollment: any) => (
                              <div key={enrollment.id} className="flex justify-between items-center p-4">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{enrollment.course?.name || "Unknown Course"}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {enrollment.course?.instructor || "No instructor"}
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={enrollment.status === "ACTIVE" ? "text-green-600" : "text-yellow-600"}
                                >
                                  {enrollment.status}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              Not enrolled in any courses
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="assignments" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Assignment Submissions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-md border">
                        <div className="grid divide-y">
                          {detailedStudent.submissions?.length > 0 ? (
                            detailedStudent.submissions.map((submission: any) => (
                              <div key={submission.id} className="flex justify-between items-center p-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{submission.assignment?.title || "Unknown Assignment"}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={
                                    submission.score >= 85 ? "text-green-600" :
                                    submission.score >= 70 ? "text-blue-600" : "text-red-600"
                                  }
                                >
                                  {submission.score}%
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              No submissions found
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="attendance" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Attendance Records</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-md border">
                        <div className="grid divide-y">
                          {detailedStudent.attendances?.length > 0 ? (
                            detailedStudent.attendances.map((attendance: any) => (
                              <div key={attendance.id} className="flex justify-between items-center p-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">
                                      {new Date(attendance.date).toLocaleDateString(undefined, { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {attendance.courseId ? `Course ID: ${attendance.courseId}` : "No course specified"}
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={
                                    attendance.status === "PRESENT" ? "text-green-600" : 
                                    attendance.status === "LATE" ? "text-yellow-600" : "text-red-600"
                                  }
                                >
                                  {attendance.status}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              No attendance records found
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
} 