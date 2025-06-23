"use client"

import { useState, useEffect } from "react"
import { Metadata } from "next"
import { Trophy, Medal, Star, Flame, Target, Zap, Award, Crown, Sparkles, Share2, Settings } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Student {
  id: string;
  name: string;
  avatar?: string;
  currentScore: number;
  level: number;
  badges: string[];
  progress: number;
  trend: "up" | "down" | "stable";
  streak: number;
  recentAchievement?: string;
  courses: string[];
  enrollments: any[];
}

function TopThree({ students }: { students: Student[] }) {
  const [first, second, third] = students.slice(0, 3)
  
  return (
    <div className="relative mb-8 grid grid-cols-3 gap-4 md:gap-8">
      {/* Second Place */}
      <div className="order-1 flex flex-col items-center md:mt-12 transition-transform hover:scale-105">
        <div className="mb-4 rounded-full bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0] p-3 shadow-lg animate-bounce-slow">
          <Medal className="h-8 w-8 text-white drop-shadow animate-pulse" />
        </div>
        <div className="relative flex flex-col items-center group">
          <div className="rounded-xl bg-gradient-to-br from-[#C0C0C0]/20 via-[#D0D0D0]/20 to-[#C0C0C0]/10 p-4 backdrop-blur-sm border border-[#C0C0C0]/20 group-hover:border-[#C0C0C0]/40 transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#C0C0C0] shadow-lg">
                <span className="text-xl font-black text-white group-hover:scale-110 transition-transform">2</span>
              </div>
            </div>
            <Avatar className="h-24 w-24 border-4 border-[#C0C0C0] shadow-xl ring-4 ring-[#C0C0C0]/20 group-hover:ring-[#C0C0C0]/40 transition-all">
              <AvatarImage src={second.avatar} alt={second.name} />
              <AvatarFallback>{second.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="mt-4 text-center">
              <div className="font-bold">{second.name}</div>
              <div className="text-sm font-medium bg-gradient-to-r from-[#C0C0C0] to-[#A0A0A0] bg-clip-text text-transparent">{second.currentScore} pts</div>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {second.badges.map((badge) => (
                  <Badge key={badge} variant="secondary" className="text-[10px] bg-[#C0C0C0]/10 hover:bg-[#C0C0C0]/20 transition-colors">
                    {badge}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Level {second.level}</div>
            </div>
          </div>
        </div>
      </div>

      {/* First Place */}
      <div className="order-2 flex flex-col items-center transition-transform hover:scale-105">
        <div className="relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-float">
            <Sparkles className="h-6 w-6 text-[#FFD700] animate-pulse" />
          </div>
          <div className="mb-4 rounded-full bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00] p-3 shadow-lg animate-bounce-slow">
            <Crown className="h-8 w-8 text-white drop-shadow animate-pulse" />
          </div>
        </div>
        <div className="relative flex flex-col items-center group">
          <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/20 via-[#FFA500]/20 to-[#FF8C00]/10 p-6 backdrop-blur-sm border border-[#FFD700]/20 group-hover:border-[#FFD700]/40 transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-lg">
                <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform">1</span>
              </div>
            </div>
            <Avatar className="h-32 w-32 border-4 border-[#FFD700] shadow-xl ring-4 ring-[#FFD700]/20 group-hover:ring-[#FFD700]/40 transition-all">
              <AvatarImage src={first.avatar} alt={first.name} />
              <AvatarFallback>{first.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="mt-4 text-center">
              <div className="text-lg font-bold bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FF8C00] bg-clip-text text-transparent">{first.name}</div>
              <div className="text-sm font-medium">{first.currentScore} pts</div>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {first.badges.map((badge) => (
                  <Badge key={badge} variant="secondary" className="text-[10px] bg-[#FFD700]/10 hover:bg-[#FFD700]/20 transition-colors">
                    {badge}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Level {first.level}</div>
              <div className="mt-2 flex items-center justify-center gap-1 text-xs">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-2 py-1 flex items-center gap-1 animate-pulse">
                  <Flame className="h-3 w-3 text-white" />
                  <span className="text-white font-medium">{first.streak} Day Streak!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Place */}
      <div className="order-3 flex flex-col items-center md:mt-16 transition-transform hover:scale-105">
        <div className="mb-4 rounded-full bg-gradient-to-br from-[#CD7F32] to-[#A05A32] p-3 shadow-lg animate-bounce-slow">
          <Award className="h-8 w-8 text-white drop-shadow animate-pulse" />
        </div>
        <div className="relative flex flex-col items-center group">
          <div className="rounded-xl bg-gradient-to-br from-[#CD7F32]/20 via-[#B87333]/20 to-[#CD7F32]/10 p-4 backdrop-blur-sm border border-[#CD7F32]/20 group-hover:border-[#CD7F32]/40 transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#CD7F32] shadow-lg">
                <span className="text-xl font-black text-white group-hover:scale-110 transition-transform">3</span>
              </div>
            </div>
            <Avatar className="h-24 w-24 border-4 border-[#CD7F32] shadow-xl ring-4 ring-[#CD7F32]/20 group-hover:ring-[#CD7F32]/40 transition-all">
              <AvatarImage src={third.avatar} alt={third.name} />
              <AvatarFallback>{third.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="mt-4 text-center">
              <div className="font-bold">{third.name}</div>
              <div className="text-sm font-medium bg-gradient-to-r from-[#CD7F32] to-[#A05A32] bg-clip-text text-transparent">{third.currentScore} pts</div>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {third.badges.map((badge) => (
                  <Badge key={badge} variant="secondary" className="text-[10px] bg-[#CD7F32]/10 hover:bg-[#CD7F32]/20 transition-colors">
                    {badge}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Level {third.level}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaderboardList({ students }: { students: Student[] }) {
  return (
    <div className="space-y-4">
      {students.slice(3).map((student, index) => (
        <Card key={student.id} className="overflow-hidden group hover:shadow-lg transition-all">
          <CardContent className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/80 font-semibold group-hover:scale-110 transition-transform">
              {index + 4}
            </div>
            <Avatar className="h-14 w-14 border-2 border-muted ring-2 ring-muted/20 group-hover:ring-muted/40 transition-all">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold group-hover:text-primary transition-colors">{student.name}</span>
                    {student.streak > 0 && (
                      <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 px-2 py-0.5 text-xs group-hover:from-orange-500 group-hover:to-red-500 group-hover:text-white transition-all">
                        <Flame className="h-3 w-3" />
                        <span>{student.streak}d</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Level {student.level}</span>
                    <span>•</span>
                    <span>{student.courses.join(', ')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold group-hover:text-primary transition-colors">{student.currentScore} pts</div>
                  <div className="flex gap-1">
                    {student.badges.map((badge) => (
                      <Badge key={badge} variant="secondary" className="text-xs group-hover:bg-primary/10 transition-colors">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress to next level</span>
                  <span className="font-medium">{student.progress}%</span>
                </div>
                <Progress value={student.progress} className="mt-1 group-hover:[&>div]:bg-primary transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing 4-6 of 150 students
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" className="hover:scale-105 transition-transform" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive className="hover:scale-105 transition-transform">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" className="hover:scale-105 transition-transform">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" className="hover:scale-105 transition-transform">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" className="hover:scale-105 transition-transform" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

export default function AdminLeaderboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/leaderboard`

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students/leaderboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      
      const data = await response.json();
      
      // Transform the data to match our interface
      const transformedStudents: Student[] = data.students.map((student: any) => ({
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        currentScore: student.currentScore || 0,
        level: Math.floor((student.currentScore || 0) / 100) + 1, // Simple level calculation
        badges: student.badges?.map((b: any) => b.badge?.name || 'Badge') || [],
        progress: ((student.currentScore || 0) % 100), // Progress to next level
        trend: determineScoreTrend(student.recentActions || []),
        streak: calculateStreak(student.attendances || []),
        recentAchievement: student.recentActions?.[0]?.reason || 'No recent activity',
        courses: student.enrollments?.map((e: any) => e.course?.name || 'Unknown Course') || [],
        enrollments: student.enrollments || []
      }));

      setStudents(transformedStudents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const determineScoreTrend = (recentActions: any[]): "up" | "down" | "stable" => {
    if (recentActions.length === 0) return "stable";
    
    const recentPoints = recentActions.slice(0, 5).reduce((sum, action) => sum + (action.points || 0), 0);
    if (recentPoints > 0) return "up";
    if (recentPoints < 0) return "down";
    return "stable";
  };

  const calculateStreak = (attendances: any[]): number => {
    // Calculate attendance streak from recent attendances
    let streak = 0;
    const sortedAttendances = attendances
      .filter(a => a.status === 'PRESENT')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (let i = 0; i < sortedAttendances.length; i++) {
      const current = new Date(sortedAttendances[i].date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - (i + 1));
      
      if (current.toDateString() === yesterday.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(shareUrl)
    // Add toast notification here
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <Button onClick={fetchLeaderboardData} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Manage Leaderboard</h2>
          <p className="text-muted-foreground">
            Configure and share the student leaderboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 mr-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:scale-105 transition-transform flex items-center gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Leaderboard Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Configure Visibility
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Scoring Rules
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Achievement Badges
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Reset Rankings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">This Week</Button>
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">This Month</Button>
          <Button size="sm" className="hover:scale-105 transition-transform">All Time</Button>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardContent className="pt-6">
          {students.length >= 3 ? (
            <>
              <TopThree students={students} />
              <LeaderboardList students={students} />
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Not enough students for leaderboard display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 