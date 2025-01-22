import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Academic Calendar",
  description: "Course schedules, deadlines, and academic events",
}

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 