import { useEffect, useState } from "react"
import { type Student, type Course, loadCourses } from "@/lib/data"

export function StudentDetails({ student }: { student: Student }) {
  const [course, setCourse] = useState<Course | null>(null)

  useEffect(() => {
    async function fetchCourse() {
      try {
        const courses = await loadCourses()
        const studentCourse = courses.find(c => c.id === student.courseId)
        setCourse(studentCourse || null)
      } catch (error) {
        console.error('Error loading course:', error)
      }
    }
    fetchCourse()
  }, [student.courseId])

  return (
    <div className="space-y-8">
      {/* Student Info Section */}
      <div>
        <h4 className="font-medium mb-4">Student Information</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground">Level</div>
            <div className="text-lg font-medium">{student.level}</div>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="text-lg font-medium">{student.score}</div>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground">Grade</div>
            <div className="text-lg font-medium">{student.grade}</div>
          </div>
        </div>
      </div>

      {/* Course Details Section */}
      <div>
        <h4 className="font-medium mb-4">Course Details</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {course && (
            <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-medium">{course.name}</h5>
                  <p className="text-sm text-muted-foreground">{course.code}</p>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  course.status === 'ahead' 
                    ? 'bg-green-100 text-green-700'
                    : course.status === 'behind'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {course.status}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Instructor</div>
                  <div className="font-medium">{course.instructor}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Credits</div>
                  <div className="font-medium">{course.credits}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Average</div>
                  <div className="font-medium">{course.average}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Progress</div>
                  <div className="font-medium">{course.progress}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Section */}
      <div>
        <h4 className="font-medium mb-4">Performance Metrics</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground">Average</div>
            <div className="text-lg font-medium">{student.average}%</div>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground">Attendance</div>
            <div className="text-lg font-medium">{student.attendance}</div>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground">Submissions</div>
            <div className="text-lg font-medium">{student.submissions}</div>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground">Streak</div>
            <div className="text-lg font-medium">{student.streak} days</div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div>
        <h4 className="font-medium mb-4">Achievements</h4>
        <div className="grid gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Recent Achievement</div>
              <div className="text-sm font-medium">{student.lastSubmission}</div>
            </div>
            <div className="text-lg font-medium mb-2">{student.recentAchievement}</div>
            <div className="flex flex-wrap gap-2">
              {student.badges.map((badge, index) => (
                <div
                  key={index}
                  className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                >
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 