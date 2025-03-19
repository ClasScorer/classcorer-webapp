"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Student } from "@/lib/data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Loader2 } from "lucide-react"

interface EngagementData {
  id: string
  timestamp: string
  attentionDuration: number
  distractionCount: number
  focusScore: number
  handRaisedCount: number
  recognitionStatus: string
  engagementLevel: string
  detectionCount: number
  averageConfidence: number
  lectureId: string
  studentId: string
  detectionSnapshots: any[]
  student: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  lecture?: {
    id: string
    title: string
    date: string
  }
}

interface StudentEngagementProps {
  student: Student
}

const COLORS = ['#4ade80', '#f87171', '#facc15', '#60a5fa']

export default function StudentEngagement({ student }: StudentEngagementProps) {
  const [engagementData, setEngagementData] = useState<EngagementData[]>([])
  const [lectures, setLectures] = useState<{[key: string]: {title: string, date: string}>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    async function fetchEngagementData() {
      try {
        setIsLoading(true)
        
        // Fetch all lectures for this student
        const lecturesResponse = await fetch(`/api/students/${student.id}/lectures`)
        if (!lecturesResponse.ok) throw new Error('Failed to fetch lectures')
        const lecturesData = await lecturesResponse.json()
        
        // Fetch engagement data for each lecture
        const engagementPromises = lecturesData.map((lecture: any) => 
          fetch(`/api/lectures/engagement?lectureId=${lecture.id}&studentId=${student.id}`)
            .then(res => res.json())
        )
        
        const engagementResults = await Promise.all(engagementPromises)
        
        // Flatten the results and add lecture details
        const flattenedData = engagementResults.flat().map((engagement: EngagementData, index: number) => ({
          ...engagement,
          lecture: {
            id: lecturesData[Math.min(index, lecturesData.length - 1)].id,
            title: lecturesData[Math.min(index, lecturesData.length - 1)].title,
            date: lecturesData[Math.min(index, lecturesData.length - 1)].date
          }
        }))
        
        setEngagementData(flattenedData)
        setLectures(lecturesData)
        
      } catch (error) {
        console.error('Error fetching engagement data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEngagementData()
  }, [student.id])
  
  // Calculate summary metrics
  const calculateMetrics = () => {
    if (engagementData.length === 0) {
      return {
        averageFocusScore: 0,
        totalAttentionDuration: 0,
        totalHandRaised: 0,
        totalDistractions: 0,
        engagementByLevel: [],
        focusScoreByLecture: []
      }
    }
    
    // Average focus score across all lectures
    const averageFocusScore = engagementData.reduce(
      (sum, data) => sum + data.focusScore, 0
    ) / engagementData.length
    
    // Total attention duration in minutes
    const totalAttentionDuration = engagementData.reduce(
      (sum, data) => sum + data.attentionDuration, 0
    ) / 60 // Convert seconds to minutes
    
    // Total hand raised count
    const totalHandRaised = engagementData.reduce(
      (sum, data) => sum + data.handRaisedCount, 0
    )
    
    // Total distractions
    const totalDistractions = engagementData.reduce(
      (sum, data) => sum + data.distractionCount, 0
    )
    
    // Engagement level distribution
    const engagementByLevel = [
      {
        name: 'High',
        value: engagementData.filter(data => data.engagementLevel === 'high').length
      },
      {
        name: 'Medium',
        value: engagementData.filter(data => data.engagementLevel === 'medium').length
      },
      {
        name: 'Low',
        value: engagementData.filter(data => data.engagementLevel === 'low').length
      }
    ]
    
    // Focus score by lecture
    const focusScoreByLecture = engagementData.map(data => ({
      name: data.lecture?.title.substring(0, 15) || 'Unknown',
      score: data.focusScore
    }))
    
    return {
      averageFocusScore,
      totalAttentionDuration,
      totalHandRaised,
      totalDistractions,
      engagementByLevel,
      focusScoreByLecture
    }
  }
  
  const metrics = calculateMetrics()
  
  // Format for x:xx time display
  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }
  
  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6 flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading engagement data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Engagement Analysis</CardTitle>
        <CardDescription>
          {engagementData.length > 0 
            ? `Data from ${engagementData.length} lecture${engagementData.length !== 1 ? 's' : ''}`
            : 'No engagement data available yet'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {engagementData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No engagement data recorded for this student yet.
          </div>
        ) : (
          <Tabs defaultValue="overview" onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lectures">By Lecture</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">Average Focus</h3>
                  <div className="mt-2 flex items-center">
                    <span className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                      {Math.round(metrics.averageFocusScore)}%
                    </span>
                    <Progress 
                      value={metrics.averageFocusScore} 
                      className="ml-2 h-2" 
                    />
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-900 dark:text-green-200">
                    Attention Time
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-green-800 dark:text-green-300">
                    {formatMinutes(metrics.totalAttentionDuration)}
                  </p>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    Hand Raised
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-amber-800 dark:text-amber-300">
                    {metrics.totalHandRaised} time{metrics.totalHandRaised !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-900 dark:text-red-200">
                    Distractions
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-red-800 dark:text-red-300">
                    {metrics.totalDistractions} time{metrics.totalDistractions !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Engagement Level Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.engagementByLevel}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {metrics.engagementByLevel.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-4">Latest Focus Scores</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={metrics.focusScoreByLecture.slice(-5)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#3b82f6" name="Focus Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="lectures">
              <div className="space-y-4">
                {engagementData.map((data) => (
                  <Card key={data.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {data.lecture?.title || 'Unknown Lecture'}
                        </CardTitle>
                        <Badge variant={
                          data.engagementLevel === 'high' ? 'default' : 
                          data.engagementLevel === 'medium' ? 'outline' : 'destructive'
                        }>
                          {data.engagementLevel.charAt(0).toUpperCase() + data.engagementLevel.slice(1)} Engagement
                        </Badge>
                      </div>
                      <CardDescription>
                        {data.lecture?.date ? new Date(data.lecture.date).toLocaleDateString() : 'Unknown date'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Focus Score</p>
                          <div className="flex items-center mt-1">
                            <span className="text-lg font-medium">{data.focusScore}%</span>
                            <Progress value={data.focusScore} className="ml-2 h-2 flex-1" />
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Attention Time</p>
                          <p className="text-lg font-medium mt-1">
                            {formatMinutes(data.attentionDuration / 60)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Hand Raised</p>
                          <p className="text-lg font-medium mt-1">
                            {data.handRaisedCount} time{data.handRaisedCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Detected</p>
                          <p className="text-lg font-medium mt-1">
                            {data.detectionCount} time{data.detectionCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="trends">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Focus Score Over Time</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={engagementData.map(data => ({
                          date: data.lecture?.date ? new Date(data.lecture.date).toLocaleDateString() : 'Unknown',
                          score: data.focusScore,
                          name: data.lecture?.title?.substring(0, 15) || 'Unknown'
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          labelFormatter={(value) => {
                            const item = engagementData.find(
                              d => d.lecture?.date && new Date(d.lecture.date).toLocaleDateString() === value
                            )
                            return item?.lecture?.title || 'Unknown'
                          }}
                        />
                        <Bar dataKey="score" fill="#3b82f6" name="Focus Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-4">Participation Metrics Over Time</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={engagementData.map(data => ({
                          date: data.lecture?.date ? new Date(data.lecture.date).toLocaleDateString() : 'Unknown',
                          handRaised: data.handRaisedCount,
                          distractions: data.distractionCount,
                          name: data.lecture?.title?.substring(0, 15) || 'Unknown'
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => {
                            const item = engagementData.find(
                              d => d.lecture?.date && new Date(d.lecture.date).toLocaleDateString() === value
                            )
                            return item?.lecture?.title || 'Unknown'
                          }}
                        />
                        <Bar dataKey="handRaised" fill="#facc15" name="Hand Raised" />
                        <Bar dataKey="distractions" fill="#f87171" name="Distractions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
} 