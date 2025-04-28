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
import { TrendingDown, TrendingUp } from "lucide-react"
import { loadStudents, type Student } from "@/lib/data"

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

function getRankBadge(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-4 w-4 text-yellow-500" />
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />
    default:
      return null
  }
}

function getPerformanceColor(average: number) {
  if (average >= 90) return "bg-green-500"
  if (average >= 80) return "bg-emerald-500"
  if (average >= 70) return "bg-blue-500"
  return "bg-muted"
}

function getTextColor(average: number) {
  if (average >= 90) return "text-green-500"
  if (average >= 80) return "text-emerald-500"
  if (average >= 70) return "text-blue-500"
  return "text-muted-foreground"
}

export async function StudentLeaderboard() {
  const students = await loadStudents()
  
  // Sort students by average score and get top 5
  const topStudents = students
    .sort((a, b) => b.average - a.average)
    .slice(0, 5)
    .map((student, index) => ({
      ...student,
      rank: index + 1
    }))

  return (
    <CardContent className="space-y-4">
      {topStudents.map((student) => (
        <div
          key={student.id}
          className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-accent/5 transition-colors"
        >
          <div className="flex-none w-8 text-center">
            {getRankBadge(student.rank) || (
              <span className="text-sm font-medium text-muted-foreground">
                #{student.rank}
              </span>
            )}
          </div>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src={student.avatar} alt={student.name} />
            <AvatarFallback className="bg-primary/10">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">
                {student.name}
              </p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${getTextColor(student.average)}`}
                >
                  {student.average}%
                </Badge>
              </div>
            </div>
            <div className="mt-1 relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full rounded-full transition-all ${getPerformanceColor(student.average)}`}
                style={{ width: `${student.average}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {student.level}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {student.streak} day streak
              </span>
            </div>
          </div>
        </div>
      ))}
    </CardContent>
  )
} 