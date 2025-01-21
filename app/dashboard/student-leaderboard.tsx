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
      return <Trophy className="h-6 w-6 text-yellow-500" />
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />
    case 3:
      return <Award className="h-6 w-6 text-amber-600" />
    default:
      return <span className="font-bold text-muted-foreground">#{rank}</span>
  }
}

function getPerformanceColor(average: number) {
  if (average >= 90) return "text-green-500"
  if (average >= 80) return "text-emerald-500"
  if (average >= 70) return "text-blue-500"
  if (average >= 60) return "text-amber-500"
  return "text-red-500"
}

export async function StudentLeaderboard() {
  const students = await loadStudents()
  
  // Sort students by average score and calculate ranks
  const rankedStudents = students
    .sort((a, b) => b.average - a.average)
    .map((student, index) => ({
      ...student,
      rank: index + 1
    }))

  return (
    <div className="space-y-8">
      {/* Top 3 Students */}
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Top Performers</h2>
            <p className="text-muted-foreground">Leading students across all courses</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rankedStudents.slice(0, 3).map((student) => (
            <Card key={student.id} className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${student.rank === 1 ? 'bg-gradient-to-br from-yellow-50 to-white border-yellow-200' : ''}`}>
              <div className="absolute right-4 top-4">
                {getRankBadge(student.rank)}
              </div>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-muted">
                    <AvatarImage src={student.avatar} alt={student.name} />
                    <AvatarFallback className="text-lg">{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{student.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {student.level}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Average Score</div>
                      <div className={`text-xl font-bold ${getPerformanceColor(student.average)}`}>
                        {student.average}%
                      </div>
                    </div>
                    <Progress value={student.average} className="h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Attendance</div>
                      <div className="text-xl font-bold">{student.attendance}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-muted-foreground">Streak</div>
                      <div className="text-xl font-bold">{student.streak} days</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant={student.trend === 'up' ? 'default' : 'destructive'} className="rounded-full">
                      {student.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {student.trend === 'up' ? 'Improving' : 'Needs Help'}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      <Star className="h-3 w-3 mr-1" />
                      {student.badges} badges
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Rest of the Students */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>All students ranked by performance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {rankedStudents.slice(3).map((student) => (
              <div key={student.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="w-8 text-center">
                  <span className="font-bold text-muted-foreground">#{student.rank}</span>
                </div>
                <Avatar className="h-10 w-10 border border-muted">
                  <AvatarImage src={student.avatar} alt={student.name} />
                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{student.name}</div>
                    <Badge variant={student.trend === 'up' ? 'default' : 'destructive'} className="ml-auto rounded-full">
                      {student.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {student.average}%
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{student.level}</span>
                    <span>•</span>
                    <span><Star className="h-3 w-3 inline mr-1" />{student.badges} badges</span>
                    <span>•</span>
                    <span><Flame className="h-3 w-3 inline mr-1" />{student.streak} day streak</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 