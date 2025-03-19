import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Student, StudentEnrollment, Course, Assignment, Submission, Attendance, StudentEngagement } from "@prisma/client"

interface StudentDetailsDialogProps {
  student: Student & {
    enrollments: (StudentEnrollment & {
      course: Course
    })[]
    submissions: (Submission & {
      assignment: Assignment
    })[]
    attendances: Attendance[]
    engagements: StudentEngagement[]
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentDetailsDialog({
  student,
  open,
  onOpenChange,
}: StudentDetailsDialogProps) {
  if (!student) return null

  // Calculate overall statistics
  const calculateOverallGrade = () => {
    if (student.submissions.length === 0) return 0
    return student.submissions.reduce((acc, sub) => acc + (sub.score || 0), 0) / student.submissions.length
  }

  const calculateAttendanceRate = () => {
    if (student.attendances.length === 0) return 0
    const presentCount = student.attendances.filter(a => a.status === 'PRESENT').length
    return (presentCount / student.attendances.length) * 100
  }

  const calculateEngagementScore = () => {
    if (student.engagements.length === 0) return 0
    return student.engagements.reduce((acc, eng) => acc + eng.focusScore, 0) / student.engagements.length
  }

  const overallGrade = calculateOverallGrade()
  const attendanceRate = calculateAttendanceRate()
  const engagementScore = calculateEngagementScore()

  // Prepare chart data
  const gradeHistory = student.submissions
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .map(sub => ({
      date: new Date(sub.submittedAt).toLocaleDateString(),
      grade: sub.score || 0,
      assignment: sub.assignment.title
    }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.avatar || ''} alt={student.name} />
              <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{student.name}</DialogTitle>
              <p className="text-muted-foreground">{student.email}</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-1">
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">{overallGrade.toFixed(1)}%</div>
                    <Progress value={overallGrade} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">{attendanceRate.toFixed(1)}%</div>
                    <Progress value={attendanceRate} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">{engagementScore.toFixed(1)}%</div>
                    <Progress value={engagementScore} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Grade History</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gradeHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="grade" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="mt-4">
              <div className="grid gap-4">
                {student.enrollments.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{enrollment.course.name}</CardTitle>
                        <Badge>{enrollment.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{enrollment.course.code}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <p>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                        {enrollment.course.startDate && (
                          <p>Course Start: {new Date(enrollment.course.startDate).toLocaleDateString()}</p>
                        )}
                        {enrollment.course.endDate && (
                          <p>Course End: {new Date(enrollment.course.endDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              <div className="space-y-4">
                {student.submissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{submission.assignment.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                          <span>Score</span>
                          <span className="font-medium">{submission.score || 'Not graded'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Submitted</span>
                          <span className="text-muted-foreground">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Status</span>
                          <Badge variant={submission.isLate ? "destructive" : "default"}>
                            {submission.isLate ? 'Late' : 'On Time'}
                          </Badge>
                        </div>
                        {submission.feedback && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Feedback:</p>
                            <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="mt-4">
              <div className="space-y-4">
                {student.engagements.map((engagement) => (
                  <Card key={engagement.id}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Session {new Date(engagement.timestamp).toLocaleDateString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                          <span>Focus Score</span>
                          <span className="font-medium">{engagement.focusScore}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Attention Duration</span>
                          <span>{Math.round(engagement.attentionDuration / 60)} minutes</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Distraction Count</span>
                          <span>{engagement.distractionCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Hand Raised Count</span>
                          <span>{engagement.handRaisedCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Engagement Level</span>
                          <Badge variant={
                            engagement.engagementLevel === 'high' ? 'default' :
                            engagement.engagementLevel === 'medium' ? 'secondary' : 'destructive'
                          }>
                            {engagement.engagementLevel}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 