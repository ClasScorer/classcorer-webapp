import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"
import { EnhancedFaceDetectionResponse } from "@/types/lecture-room"
import { Student } from "@/lib/data"

interface DetectionAnalysisProps {
  faceData: EnhancedFaceDetectionResponse | null
  lectureStarted: boolean
  students: Student[]
}

export function DetectionAnalysis({
  faceData,
  lectureStarted,
  students
}: DetectionAnalysisProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Detection Analysis</CardTitle>
        <CardDescription className="text-xs">
          Real-time student engagement tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!faceData ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-4 text-gray-500">
              {lectureStarted 
                ? "Waiting for detection data..." 
                : "Start the lecture to see detection results"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enhanced Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center shadow-sm">
                <p className="text-2xl font-bold text-blue-700">{faceData.total_faces}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center shadow-sm">
                <p className="text-2xl font-bold text-green-700">{faceData.summary.focused_faces}</p>
                <p className="text-sm text-gray-600">Focused</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center shadow-sm">
                <p className="text-2xl font-bold text-red-700">{faceData.summary.unfocused_faces}</p>
                <p className="text-sm text-gray-600">Unfocused</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center shadow-sm">
                <p className="text-2xl font-bold text-yellow-700">{faceData.summary.hands_raised}</p>
                <p className="text-sm text-gray-600">Hands Raised</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center shadow-sm">
                <div className="text-2xl font-bold text-purple-700">{faceData.classEngagement.toFixed(2)}%</div>
                <p className="text-sm text-gray-600">Class Engagement</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Engagement Trend */}
              <div className="lg:col-span-1">
                <div className="rounded-lg border p-4 h-full">
                  <div className="text-sm font-medium mb-3">Engagement Trend</div>
                  {faceData.timeSeries && faceData.timeSeries.length > 0 ? (
                    <div className="h-40 flex items-end space-x-1">
                      {faceData.timeSeries.map((point, index) => (
                        <div   
                          key={`trend-point-${index}-${point.timestamp}`} 
                          className="bg-blue-500 w-full rounded-t"
                          style={{ 
                            height: `${Math.max(5, point.focusedPercentage)}%`,
                            opacity: 0.3 + (index / faceData.timeSeries!.length * 0.7)
                          }}
                          title={`${new Date(point.timestamp).toLocaleTimeString()}: ${Math.round(point.focusedPercentage)}% focused`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      <p>No trend data available yet</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Detected Students */}
              <div className="lg:col-span-2">
                <div className="rounded-lg border h-full">
                  <div className="py-3 px-4 bg-gray-50 font-medium border-b">
                    Detected Students
                  </div>
                  <div className="divide-y max-h-60 overflow-y-auto p-0">
                    {faceData.faces.filter(face => face.recognition_status === "known").map((face, index) => {
                      // Find the student, accounting for possible empty students array
                      const student = students && students.length > 0
                        ? students.find(s => s.id === face.person_id)
                        : null;
                      
                      // If student is not found, create a placeholder with info from face data
                      const displayName = student ? student.name : face.name || `Unknown (ID: ${face.person_id})`;
                      const displayEmail = student ? student.email : "No email available";
                      const displayAvatar = student?.avatar || "";
                      
                      return (
                        <div key={`student-${face.person_id}-${index}`} className="p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={displayAvatar} alt={displayName} />
                                <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{displayName}</p>
                                <p className="text-xs text-gray-500">{displayEmail}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={face.attention_status === "focused" ? "default" : "destructive"}>
                                {face.attention_status}
                              </Badge>
                              {face.hand_raising_status.is_hand_raised && (
                                <Badge variant="outline" className="bg-yellow-50">
                                  Hand Raised
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Enhanced metrics */}
                          {face.attentionMetrics && (
                            <div className="grid grid-cols-4 gap-2 mt-1 text-xs">
                              <div className="bg-gray-50 p-1 rounded text-center">
                                <div className="font-medium">{face.attentionMetrics?.focusScore}%</div>
                                <div className="text-gray-500">Focus</div>
                              </div>
                              <div className="bg-gray-50 p-1 rounded text-center">
                                <div className="font-medium">{face.attentionMetrics?.focusDuration}s</div>
                                <div className="text-gray-500">Duration</div>
                              </div>
                              <div className="bg-gray-50 p-1 rounded text-center">
                                <div className="font-medium">{face.attentionMetrics?.distractionCount}</div>
                                <div className="text-gray-500">Distractions</div>
                              </div>
                              <div className="bg-gray-50 p-1 rounded text-center">
                                <div className="font-medium capitalize">{face.attentionMetrics?.engagementLevel}</div>
                                <div className="text-gray-500">Engagement</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {faceData.faces.filter(face => face.recognition_status === "known").length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        No known students detected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* New Faces */}
            {faceData.summary.new_faces > 0 && (
              <div className="rounded-md border p-4">
                <div className="font-medium text-sm mb-2">Unrecognized Faces</div>
                <div className="text-gray-600">
                  {faceData.summary.new_faces} unrecognized {faceData.summary.new_faces === 1 ? 'person' : 'people'} detected in the room
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 