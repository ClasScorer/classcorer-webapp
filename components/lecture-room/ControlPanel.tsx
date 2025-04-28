import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, VideoOff, Mic, MicOff, Square, X, Bug } from "lucide-react"

interface ControlPanelProps {
  lectureStarted: boolean
  lectureStartTime: Date | null
  elapsedSeconds: number
  durationMinutes: number
  isPaused: boolean
  isVideoOn: boolean
  isAudioOn: boolean
  isDetecting: boolean
  isLoading: boolean
  isDeletingLecture: boolean
  lectureId: string | null
  scheduleTime: string
  useScheduledTime: boolean
  toggleVideo: () => Promise<void>
  toggleAudio: () => Promise<void>
  startFaceDetection: (lectureId: string) => void
  stopFaceDetection: () => void
  simulateDetection: () => void
  startNewLecture: (scheduledTime?: Date) => Promise<string | null>
  endLecture: () => Promise<void>
  confirmDeleteLecture: (lectureId: string) => void
  toggleStopwatch: () => void
  setDurationMinutes: React.Dispatch<React.SetStateAction<number>>
  setScheduleTime: React.Dispatch<React.SetStateAction<string>>
  setUseScheduledTime: React.Dispatch<React.SetStateAction<boolean>>
}

export function ControlPanel({
  lectureStarted,
  lectureStartTime,
  elapsedSeconds,
  durationMinutes,
  isPaused,
  isVideoOn,
  isAudioOn,
  isDetecting,
  isLoading,
  isDeletingLecture,
  lectureId,
  scheduleTime,
  useScheduledTime,
  toggleVideo,
  toggleAudio,
  startFaceDetection,
  stopFaceDetection,
  simulateDetection,
  startNewLecture,
  endLecture,
  confirmDeleteLecture,
  toggleStopwatch,
  setDurationMinutes,
  setScheduleTime,
  setUseScheduledTime
}: ControlPanelProps) {
  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`
  }

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m`
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Controls</CardTitle>
        <CardDescription className="text-xs">
          {lectureStarted 
            ? `Lecture in progress: ${formatElapsedTime(elapsedSeconds)} / ${formatDuration(durationMinutes)}`
            : "Start a lecture to begin"
          }
          {lectureStarted && lectureStartTime && (
            <div className="mt-1">Started: {lectureStartTime.toLocaleString()}</div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add stopwatch display when lecture is running */}
        {lectureStarted && (
          <div className="mb-3 bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Elapsed Time</div>
            <div className="text-2xl font-mono font-semibold">
              {String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:
              {String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')}:
              {String(elapsedSeconds % 60).padStart(2, '0')}
            </div>
            <div className="w-full bg-gray-200 h-1.5 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min(100, (elapsedSeconds / (durationMinutes * 60)) * 100)}%`,
                  backgroundColor: elapsedSeconds > durationMinutes * 60 ? '#f87171' : undefined
                }}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2"
              onClick={toggleStopwatch}
            >
              {isPaused ? "Resume Timer" : "Pause Timer"}
            </Button>
          </div>
        )}
          
        {!lectureStarted ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm">Lecture Duration (minutes)</label>
              <Input 
                id="duration"
                type="number" 
                min="5"
                max="240"
                value={durationMinutes}
                onChange={e => setDurationMinutes(Math.max(5, parseInt(e.target.value) || 60))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useScheduledTime"
                  checked={useScheduledTime}
                  onChange={(e) => setUseScheduledTime(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="useScheduledTime" className="text-sm font-medium">
                  Use scheduled time
                </label>
              </div>
              {useScheduledTime && (
                <div className="space-y-1">
                  <label htmlFor="scheduledTime" className="text-xs text-muted-foreground">
                    Lecture scheduled for:
                  </label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full" 
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {scheduleTime && new Date(scheduleTime).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => startNewLecture(useScheduledTime && scheduleTime ? new Date(scheduleTime) : undefined)} 
              className="w-full" 
              disabled={isLoading || (useScheduledTime && !scheduleTime)}
            >
              {isLoading ? "Starting..." : "Start Lecture"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <Button 
                variant={isVideoOn ? "default" : "secondary"} 
                onClick={toggleVideo}
                className="w-full"
              >
                {isVideoOn ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
                {isVideoOn ? "Camera Off" : "Camera On"}
              </Button>
              
              <Button 
                variant={isAudioOn ? "default" : "secondary"} 
                onClick={toggleAudio}
                className="w-full"
              >
                {isAudioOn ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isAudioOn ? "Mute" : "Unmute"}
              </Button>
            </div>
            
            <div className="flex flex-col gap-2">
              {isVideoOn && (
                <Button
                  variant={isDetecting ? "destructive" : "default"}
                  onClick={isDetecting ? stopFaceDetection : () => lectureId && startFaceDetection(lectureId)}
                  className="w-full"
                >
                  {isDetecting ? "Stop Detection" : "Start Detection"}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={simulateDetection}
                className="w-full"
              >
                <Bug className="mr-2 h-4 w-4" />
                Simulate
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={endLecture}
                className="w-full mb-2"
                disabled={isLoading}
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Lecture
              </Button>
              
              <Button
                variant="outline"
                onClick={() => lectureId && confirmDeleteLecture(lectureId)}
                className="w-full"
                disabled={isLoading || isDeletingLecture || !lectureId}
              >
                <X className="mr-2 h-4 w-4" />
                Delete Lecture
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 