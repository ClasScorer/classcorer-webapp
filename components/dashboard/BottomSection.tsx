import { Suspense } from "react";
import { AnnouncementsCard } from "./AnnouncementsCard";
import { StudentLeaderboard } from "./student-leaderboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface Announcement {
  course: string;
  title: string;
  date: string;
  priority: 'normal' | 'high';
}

interface BottomSectionProps {
  announcements: Announcement[];
  formatDate: (date: string) => string;
}

export function BottomSection({ announcements, formatDate }: BottomSectionProps) {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      <AnnouncementsCard 
        announcements={announcements}
        formatDate={formatDate}
      />

      <Card className="hover:shadow-md transition-shadow border border-muted">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Leaderboard</CardTitle>
              <CardDescription>Top performing students</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="hover:bg-secondary">
              <Link href="/dashboard/leaderboard">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading leaderboard...</div>}>
            <StudentLeaderboard />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
} 