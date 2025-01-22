import { Metadata } from "next"
import { getCourseById } from "@/lib/data"

interface LectureRoomLayoutProps {
  children: React.ReactNode
  params: {
    courseId: string
  }
}

export async function generateMetadata({ params }: LectureRoomLayoutProps): Promise<Metadata> {
  const course = await getCourseById(params.courseId)
  if (!course) return { title: "Course Not Found" }

  return {
    title: `Live Lecture - ${course.name}`,
    description: `Live lecture session for ${course.code}`,
  }
}

export default function LectureRoomLayout({ children }: LectureRoomLayoutProps) {
  return children
} 