"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Trophy, Medal, Star, Flame, Target, Zap, Award, Crown, Sparkles, ChevronDown, RefreshCw } from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma"
import { loadCourses, type Course } from "@/lib/data"

// Define the student type that matches our expected structure
interface StudentData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  score: number;
  level: number;
  badges: string[];
  course: string;
  grade: string;
  streak: number;
  progress: number;
}

// Placeholder for the expected allStudents type
let allStudents: StudentData[] = [];

// We need separate server functions for data fetching to use in client components
// These will be called from the client component

async function fetchCourses() {
  try {
    const response = await fetch('/api/courses');
    if (!response.ok) throw new Error('Failed to fetch courses');
    return await response.json();
  } catch (error) {
    console.error("Error loading courses:", error);
    return [];
  }
}

async function fetchStudentsByLecture(courseId: string, lectureId: string) {
  try {
    const response = await fetch(`/api/leaderboard?courseId=${courseId}&lectureId=${lectureId}`, {
      cache: 'no-store' // Don't cache to ensure fresh data on each request
    });
    
    if (!response.ok) throw new Error('Failed to fetch students');
    return await response.json();
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
}

// Client component for the leaderboard
export default function CourseLeaderboardPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ course: string }>;
  searchParams: Promise<{ lecture?: string }>;
}) {
  const [courseData, setCourseData] = useState<any>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds default
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  const unwrappedParams = use(params);
  const unwrappedSearchParams = use(searchParams);
  const courseId = unwrappedParams.course;
  const lectureId = unwrappedSearchParams.lecture;
  
  // Function to fetch leaderboard data
  const fetchLeaderboardData = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setRefreshing(true);
      
      // Fetch course data first
      if (!courseData) {
        const courses = await fetchCourses();
        const course = courses.find((c: any) => 
          c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === courseId
        );
        if (course) setCourseData(course);
      }
      
      // Fetch students data
      if (lectureId) {
        const studentsData = await fetchStudentsByLecture(courseId, lectureId);
        setStudents(studentsData);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing leaderboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId, lectureId, courseData]);
  
  // Initial data load
  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);
  
  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      fetchLeaderboardData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchLeaderboardData]);
  
  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchLeaderboardData();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }
  
  if (!courseData) notFound();
  
  const hasStudents = students && students.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {courseData.name} Leaderboard
              </h2>
              <p className="text-muted-foreground">
                {courseData.description}
              </p>
              {lectureId && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-sm">
                    Active Lecture
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2 text-sm">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh">Auto-refresh</Label>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualRefresh}
                disabled={refreshing}
                className={refreshing ? "animate-pulse" : ""}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <Card className="border-primary/20">
            <CardContent className="pt-6">
              {hasStudents ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-muted-foreground">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                    <div className="text-sm font-medium">
                      {students.length} students on the leaderboard
                    </div>
                  </div>
                  
                  <TopThree students={students.slice(0, 3)} />
                  <LeaderboardList students={students.slice(3)} />
                </>
              ) : (
                <div className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Students Detected</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {lectureId 
                      ? "No students have been detected in this lecture yet. Students will appear on the leaderboard once they are detected by the camera."
                      : "There are no students enrolled in this course yet."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>Want to join the leaderboard? Sign up for our courses!</p>
            <Link href="/courses" className="inline-flex">
              <Button variant="link" size="sm" className="hover:underline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function TopThree({ students }: { students: StudentData[] }) {
  const [first, second, third] = students
  
  return (
    <div className="relative mb-8 grid grid-cols-3 gap-4 md:gap-8">
      {/* Second Place */}
      {second && (
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
                <div className="text-sm font-medium bg-gradient-to-r from-[#C0C0C0] to-[#A0A0A0] bg-clip-text text-transparent">{second.score} pts</div>
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
      )}
      {!second && <div className="order-1" />}

      {/* First Place */}
      {first && (
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
                <div className="text-sm font-medium">{first.score} pts</div>
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
      )}
      {!first && <div className="order-2" />}

      {/* Third Place */}
      {third && (
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
                <div className="text-sm font-medium bg-gradient-to-r from-[#CD7F32] to-[#A05A32] bg-clip-text text-transparent">{third.score} pts</div>
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
      )}
      {!third && <div className="order-3" />}
    </div>
  )
}

function LeaderboardList({ students }: { students: StudentData[] }) {
  if (!students || students.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {students.map((student, index) => (
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
                    <span>{student.course}</span>
                    <span>•</span>
                    <span className="font-medium">{student.grade}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold group-hover:text-primary transition-colors">{student.score} pts</div>
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
          Showing {students.length} students
        </div>
      </div>
    </div>
  )
} 