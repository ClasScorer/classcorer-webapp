import { Metadata } from "next"
import { getCourseById } from "@/lib/data"

interface LectureRoomLayoutProps {
  children: React.ReactNode
  params: {
    courseId: string
  }
}

export async function generateMetadata({ params }: LectureRoomLayoutProps): Promise<Metadata> {
  try {
    const course = await getCourseById(params.courseId)
    if (!course) return { title: "Course Not Found" }

    return {
      title: `Live Lecture - ${course.name}`,
      description: `Live lecture session for ${course.code}`,
    }
  } catch (error) {
    console.error("Error fetching course data:", error);
    return { 
      title: "Error Loading Course",
      description: "There was an error loading the course data"
    }
  }
}

export default function LectureRoomLayout({ children }: LectureRoomLayoutProps) {
  return children
} 