import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Trophy, Medal, Star, Flame, Target, Zap, Award, Crown, Sparkles, ChevronDown } from "lucide-react"
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

// Get course data from CSV or database
async function getCourses() {
  try {
    // First try to get courses from database
    const dbCourses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true
      }
    });

    if (dbCourses.length > 0) {
      const courseMap: Record<string, { id: string; name: string; description: string }> = {
        all: {
          id: "all",
          name: "All Courses",
          description: "Top performing students across all courses",
        }
      };

      dbCourses.forEach(course => {
        const id = course.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        courseMap[id] = {
          id: course.id,
          name: course.name,
          description: `${course.code} - ${course.name}`,
        };
      });

      return courseMap;
    }

    // Fallback to CSV courses if no DB courses
    const courses = await loadCourses();
    const courseMap: Record<string, { id: string; name: string; description: string }> = {
      all: {
        id: "all",
        name: "All Courses",
        description: "Top performing students across all courses",
      }
    };

    courses.forEach(course => {
      const id = course.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      courseMap[id] = {
        id: course.id,
        name: course.name,
        description: `${course.code} - ${course.name}`,
      };
    });

    return courseMap;
  } catch (error) {
    console.error("Error loading courses:", error);
    return {
      all: {
        id: "all",
        name: "All Courses",
        description: "Top performing students across all courses",
      }
    };
  }
}

// Get students by course - show all students from course in the leaderboard
async function getStudentsByCourse(courseId: string, lectureId?: string): Promise<StudentData[]> {
  try {
    // Find course by normalized ID
    const courses = await prisma.course.findMany();
    const course = courses.find(c => c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === courseId);
    
    if (!course) {
      return [];
    }

    // If we have a lectureId, only show students who were detected in this lecture
    if (lectureId) {
      // Get engagement records for this lecture
      const engagementRecords = await prisma.studentEngagement.findMany({
        where: {
          lectureId: lectureId
        },
        include: {
          student: true
        }
      });

      // If no engagements yet, return empty array
      if (engagementRecords.length === 0) {
        return [];
      }

      // Map engagement records to student data
      const students: StudentData[] = engagementRecords.map(record => {
        return {
          id: record.student.id,
          name: record.student.name,
          email: record.student.email,
          avatar: record.student.avatar || `https://avatar.vercel.sh/${record.student.id}`,
          score: record.focusScore, // Use actual focus score from engagement
          level: Math.floor(record.attentionDuration / 60) + 1, // Level based on attention time in minutes
          badges: [
            record.engagementLevel.charAt(0).toUpperCase() + record.engagementLevel.slice(1), // Capitalize first letter
            record.handRaisedCount > 0 ? "Active Participant" : "Viewer"
          ],
          course: course.name,
          grade: record.focusScore >= 80 ? "A" : 
                 record.focusScore >= 70 ? "B" : 
                 record.focusScore >= 60 ? "C" : 
                 record.focusScore >= 50 ? "D" : "F",
          streak: Math.min(record.attentionDuration / 30, 10), // Streak based on attention time (max 10)
          progress: Math.min(record.attentionDuration / 3, 100) // Progress percentage based on attention time
        };
      });

      // Sort by score (descending)
      return students.sort((a, b) => b.score - a.score);
    }
    
    // Otherwise, get all enrollments for this course (default behavior)
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        courseId: course.id
      },
      include: {
        student: true
      }
    });

    // Map enrollments to the expected student data format
    const students: StudentData[] = enrollments.map(enrollment => {
      return {
        id: enrollment.student.id,
        name: enrollment.student.name,
        email: enrollment.student.email,
        avatar: enrollment.student.avatar || `https://avatar.vercel.sh/${enrollment.student.id}`,
        score: Math.floor(Math.random() * 1000), // placeholder score for now
        level: Math.floor(Math.random() * 10) + 1, // placeholder level
        badges: ["Active", "Engaged"], // placeholder badges
        course: course.name,
        grade: ["A", "B", "C", "A-", "B+"][Math.floor(Math.random() * 5)], // placeholder grade
        streak: Math.floor(Math.random() * 10), // placeholder streak
        progress: Math.floor(Math.random() * 100) // placeholder progress
      };
    });

    // Sort by score (descending)
    return students.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { course: string } }): Promise<Metadata> {
  const courses = await getCourses();
  const course = courses[params.course];
  if (!course) return {};

  return {
    title: `${course.name} Leaderboard`,
    description: course.description,
    openGraph: {
      title: `${course.name} Leaderboard`,
      description: course.description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.name} Leaderboard`,
      description: course.description,
    },
  }
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

export default async function CourseLeaderboardPage({ params, searchParams }: { 
  params: { course: string };
  searchParams: { lecture?: string }
}) {
  const courses = await getCourses();
  const course = courses[params.course];
  if (!course) notFound();

  // Get any lecture ID from the URL if present
  const lectureId = searchParams.lecture;
  
  // Get all students for this course
  const students = await getStudentsByCourse(params.course, lectureId);
  allStudents = students; // Set reference for other components
  const hasStudents = students && students.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {course.name} Leaderboard
            </h2>
            <p className="text-muted-foreground">
              {course.description}
            </p>
            {lectureId && (
              <div className="mt-2">
                <Badge variant="outline" className="text-sm">
                  Active Lecture
                </Badge>
              </div>
            )}
          </div>

          <Card className="border-primary/20">
            <CardContent className="pt-6">
              {hasStudents ? (
                <>
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