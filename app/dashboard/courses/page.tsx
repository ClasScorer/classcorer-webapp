import { Metadata } from 'next'
import { AddCourseDialog } from '@/app/components/add-course-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/app/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Courses - ClasScorer',
  description: 'Manage your courses',
}

export default async function CoursesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const courses = await prisma.course.findMany({
    where: { instructorId: session.user.id },
    include: {
      students: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            }
          }
        }
      },
      lectures: true,
      assignments: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Transform the courses to include students directly
  const transformedCourses = courses.map(course => ({
    ...course,
    students: course.students.map(enrollment => enrollment.student)
  }))

  // Log the number of students for each course
  transformedCourses.forEach(course => {
    console.log(`Course ${course.name} has ${course.students.length} students`);
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Manage your courses and their content</p>
        </div>
        <AddCourseDialog />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {transformedCourses.map((course) => (
          <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
                <CardDescription>{course.code}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    {course.description || 'No description available'}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div>{course.students.length} students</div>
                    <div>{course.lectures.length} lectures</div>
                    <div>{course.assignments.length} assignments</div>
                    <div>{course.credits} credits</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {transformedCourses.length === 0 && (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first course
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 