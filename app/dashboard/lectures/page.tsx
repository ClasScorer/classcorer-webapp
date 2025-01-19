import { Metadata } from "next"
import { loadCourses } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Users, Video } from "lucide-react"

export const metadata: Metadata = {
  title: "Lectures",
  description: "Start and manage your course lectures",
}

export default async function LecturesPage() {
  const courses = await loadCourses()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Lectures</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:bg-accent/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{course.code}</span>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  course.status === 'ahead'
                    ? 'bg-green-100 text-green-700'
                    : course.status === 'behind'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {course.status}
                </div>
              </CardTitle>
              <CardDescription>{course.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{course.totalStudents} Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>Week {course.week}</span>
                  </div>
                </div>
                <Link href={`/dashboard/lectures/${course.id}`}>
                  <Button className="w-full gap-2">
                    <Video className="h-4 w-4" />
                    Start Lecture
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 