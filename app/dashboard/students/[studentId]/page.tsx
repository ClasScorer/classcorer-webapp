"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getStudentById, fetchCourses } from "@/lib/data"
import StudentEngagement from "./engagement"
import { Loader2, ArrowLeft, BookOpen, Calendar, GraduationCap, Users, Award } from "lucide-react"
import { useRouter } from "next/navigation"

export default function StudentDetailPage({ params }: { params: { studentId: string } }) {
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const studentData = await getStudentById(params.studentId)
        setStudent(studentData)
        
        const coursesData = await fetchCourses()
        setCourses(coursesData)
      } catch (error) {
        console.error("Error loading student data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [params.studentId])
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!student) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold">Student not found</h2>
        <p className="text-muted-foreground mt-2">The requested student could not be found.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }
  
  // Calculate attendance percentage
  const attendancePercentage = student.attendance || 85
  
  // Find enrollment for the student
  const enrolledCourses = courses.filter(course => 
    course.students?.some((s: any) => s.id === student.id)
  )
  
  return (
    <div className="space-y-6">
      <Button 
        variant="outline" 
        onClick={() => router.push('/dashboard/students')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Students
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Student Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-col items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={student.avatar || ""} alt={student.name} />
              <AvatarFallback>{student.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4 text-center">{student.name}</CardTitle>
            <CardDescription className="text-center">{student.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Attendance</span>
                  <span className="font-medium">{attendancePercentage}%</span>
                </div>
                <Progress value={attendancePercentage} className="h-2" />
              </div>
              
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-2">Enrolled Courses</h3>
                <div className="space-y-2">
                  {enrolledCourses.length > 0 ? (
                    enrolledCourses.map((course: any) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{course.name}</span>
                        </div>
                        <Badge variant="outline">{course.code}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Not enrolled in any courses</p>
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-2">Achievement Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {student.badges && student.badges.length > 0 ? (
                    student.badges.map((badge: any) => (
                      <Badge key={badge.id} variant="secondary">
                        <Award className="h-3 w-3 mr-1" />
                        {badge.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No badges earned yet</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          <Tabs defaultValue="overview" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Performance Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Performance</CardTitle>
                  <CardDescription>Student's academic performance across all courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <div className="flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                          Average Grade
                        </h3>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-blue-800 dark:text-blue-300">
                        {student.average || "N/A"}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                        <h3 className="text-sm font-medium text-green-900 dark:text-green-200">
                          Submissions
                        </h3>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-green-800 dark:text-green-300">
                        {student.submissions || 0}
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200">
                          Class Rank
                        </h3>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-purple-800 dark:text-purple-300">
                        {student.rank || "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest submissions and attendance records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {student.recentActivity && student.recentActivity.length > 0 ? (
                      student.recentActivity.map((activity: any, index: number) => (
                        <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                          <div className={`rounded-full p-2 ${
                            activity.type === 'submission' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'attendance' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {activity.type === 'submission' ? (
                              <BookOpen className="h-4 w-4" />
                            ) : activity.type === 'attendance' ? (
                              <Calendar className="h-4 w-4" />
                            ) : (
                              <Award className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.date}</p>
                            <p className="text-sm mt-1">{activity.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No recent activity recorded</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="engagement" className="space-y-6 mt-6">
              <StudentEngagement student={student} />
            </TabsContent>
            
            <TabsContent value="submissions" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submissions</CardTitle>
                  <CardDescription>Assignments and quiz submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Submission details will be displayed here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="attendance" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>Lecture attendance history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Attendance records will be displayed here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 