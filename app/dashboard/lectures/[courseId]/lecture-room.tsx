"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import LectureRoom from "@/components/lecture-room/LectureRoom"
import { Course, Student } from "@/lib/data"

export default function LectureRoomPage() {
  const params = useParams()
  const courseId = params.courseId as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`)
        if (!courseResponse.ok) throw new Error("Failed to fetch course")
        const courseData = await courseResponse.json()
        setCourse(courseData)
        
        // Fetch students for the course
        const studentsResponse = await fetch(`/api/courses/${courseId}/students`)
        if (!studentsResponse.ok) throw new Error("Failed to fetch students")
        const studentsData = await studentsResponse.json()
        setStudents(studentsData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (courseId) {
      fetchCourseData()
    }
  }, [courseId])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Course Not Found</h2>
          <p className="text-muted-foreground">Unable to load course information</p>
        </div>
      </div>
    )
  }
  
  return <LectureRoom course={course} students={students} />
}