import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Presentation, Users } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, Professor</h2>
        <p className="text-muted-foreground">
          Here's what's happening across your courses today
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/dashboard/calendar">
          <Button variant="outline" className="w-full justify-start hover:bg-secondary">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </Button>
        </Link>

        <Link href="/dashboard/lectures">
          <Button variant="outline" className="w-full justify-start hover:bg-secondary">
            <Presentation className="mr-2 h-4 w-4" />
            Lectures
          </Button>
        </Link>

        <Link href="/dashboard/students">
          <Button variant="outline" className="w-full justify-start hover:bg-secondary">
            <Users className="mr-2 h-4 w-4" />
            Students
          </Button>
        </Link>
      </div>
    </div>
  );
} 