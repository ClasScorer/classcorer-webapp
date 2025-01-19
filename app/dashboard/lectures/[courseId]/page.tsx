import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCourseById, loadStudents } from "@/lib/data"
import { LectureRoom } from "./lecture-room"

interface LectureRoomPageProps {
  params: {
    courseId: string
  }
}

export async function generateMetadata({ params }: LectureRoomPageProps): Promise<Metadata> {
  const course = await getCourseById(params.courseId)
  if (!course) return { title: "Course Not Found" }

  return {
    title: `Live Lecture - ${course.name}`,
    description: `Live lecture session for ${course.code}`,
  }
}

export default async function LectureRoomPage({ params }: LectureRoomPageProps) {
  const course = await getCourseById(params.courseId)
  const allStudents = await loadStudents()

  if (!course) {
    notFound()
  }

  const courseStudents = allStudents.filter(student => student.courseId === course.id)

  return <LectureRoom course={course} students={courseStudents} />
} 