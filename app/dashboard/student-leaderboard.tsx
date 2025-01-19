"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { type Student } from "@/lib/data"

const ITEMS_PER_PAGE = 5;

const getStatusColor = (status: string) => {
  switch (status) {
    case "Excellent":
      return "bg-green-100 text-green-700"
    case "Good":
      return "bg-blue-100 text-blue-700"
    case "At Risk":
      return "bg-red-100 text-red-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500">
          <path fillRule="evenodd" d="M12 20.25a.75.75 0 01-.75-.75V6.31l-5.47 5.47a.75.75 0 01-1.06-1.06l6.75-6.75a.75.75 0 011.06 0l6.75 6.75a.75.75 0 11-1.06 1.06l-5.47-5.47V19.5a.75.75 0 01-.75.75z" clipRule="evenodd" />
        </svg>
      )
    case "down":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
          <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v13.19l5.47-5.47a.75.75 0 111.06 1.06l-6.75 6.75a.75.75 0 01-1.06 0l-6.75-6.75a.75.75 0 111.06-1.06l5.47 5.47V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
      )
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
          <path fillRule="evenodd" d="M3.75 12a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        </svg>
      )
  }
}

export function StudentLeaderboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await fetch('/api/students')
        const data = await response.json()
        // Sort students by score in descending order
        const sortedStudents = data.sort((a: Student, b: Student) => b.score - a.score)
        setStudents(sortedStudents)
      } catch (error) {
        console.error('Error loading students:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  // Calculate pagination
  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedStudents = students.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Calculate student stats
  const calculateStats = (students: Student[]) => {
    const totalStudents = students.length;
    if (totalStudents === 0) return { averageGrade: 0, averageAttendance: 0 };

    const averageGrade = Math.round(
      students.reduce((sum, student) => sum + student.average, 0) / totalStudents
    );

    const averageAttendance = Math.round(
      students.reduce((sum, student) => {
        const attendance = typeof student.attendance === 'string' 
          ? parseInt(student.attendance.replace('%', ''))
          : student.attendance;
        return sum + attendance;
      }, 0) / totalStudents
    );

    return { averageGrade, averageAttendance };
  };

  const stats = calculateStats(students);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {paginatedStudents.map((student) => (
        <div key={student.id} className="flex flex-col p-4 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium leading-none">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className={`${getStatusColor(student.status)}`}>
                    {student.status}
                  </Badge>
                  {getTrendIcon(student.trend)}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Average</p>
              <div className="flex items-center space-x-2">
                <Progress value={student.average} className="h-2" />
                <span className="text-sm font-medium">{student.average}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Attendance</p>
              <p className="text-sm font-medium">{student.attendance}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submissions</p>
              <p className="text-sm font-medium">{student.submissions}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Activity</p>
              <p className="text-sm font-medium">{student.lastSubmission}</p>
            </div>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, students.length)} of {students.length} students
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 