"use client";

import { Metadata } from "next"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getCourseById } from "@/lib/data"

interface LectureRoomLayoutProps {
  children: React.ReactNode
  params: {
    courseId: string
  }
}

export default function LectureRoomLayout({ children }: LectureRoomLayoutProps) {
  const params = useParams()
  const courseId = params.courseId as string
  const [title, setTitle] = useState<string>("Loading Course...")
  
  useEffect(() => {
    async function loadCourseData() {
      try {
        const course = await getCourseById(courseId)
        if (course) {
          document.title = `Live Lecture - ${course.name}`
          setTitle(`Live Lecture - ${course.name}`)
        } else {
          document.title = "Course Not Found"
          setTitle("Course Not Found")
        }
      } catch (error) {
        console.error("Error fetching course data for metadata:", error)
        document.title = "Error Loading Course"
        setTitle("Error Loading Course")
      }
    }
    
    loadCourseData()
  }, [courseId])
  
  return (
    <>
      {children}
    </>
  )
} 