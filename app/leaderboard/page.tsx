import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function LeaderboardPage() {
  // Get the first available course to redirect to
  const firstCourse = await prisma.course.findFirst({
    orderBy: { name: 'asc' },
  })
  
  if (firstCourse) {
    // Convert course ID to URL-friendly format
    const courseSlug = firstCourse.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    redirect(`/leaderboard/${courseSlug}`)
  } else {
    // If no courses found, create a useful empty state
    redirect('/dashboard')
  }
} 