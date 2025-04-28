import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface Announcement {
  course: string;
  title: string;
  date: string;
  priority: 'normal' | 'high';
}

interface AnnouncementsCardProps {
  announcements: Announcement[];
  formatDate: (date: string) => string;
}

export function AnnouncementsCard({ announcements, formatDate }: AnnouncementsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow border border-muted">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription>Latest updates from your courses</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="hover:bg-secondary">
            <Link href="/dashboard/announcements">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {announcements.map((announcement, index) => (
            <div key={`${announcement.course}-${index}`} className="flex items-start gap-4">
              <Avatar className="border border-muted">
                <AvatarFallback className="bg-primary/10">
                  {getInitials(announcement.course)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{announcement.title}</p>
                  <Badge variant={announcement.priority === 'high' ? 'destructive' : 'secondary'}>
                    {announcement.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {announcement.course} • {formatDate(announcement.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 