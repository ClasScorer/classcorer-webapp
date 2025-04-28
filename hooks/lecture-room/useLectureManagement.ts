import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface UseLectureManagementProps {
  courseId: string | number
  durationMinutes?: number
}

interface UseLectureManagementResult {
  lectureId: string | null
  lectureStarted: boolean
  isLoading: boolean
  isDeletingLecture: boolean
  isDeleteDialogOpen: boolean
  lectureStartTime: Date | null
  elapsedSeconds: number
  isPaused: boolean
  durationMinutes: number
  scheduleTime: string
  useScheduledTime: boolean
  attendanceData: {[studentId: string]: {status: string, joinTime: Date, lastSeen: Date}}
  startNewLecture: (scheduledTime?: Date) => Promise<string | null>
  endLecture: () => Promise<void>
  deleteLecture: (lectureId: string) => Promise<void>
  confirmDeleteLecture: (lectureId: string) => void
  saveAttendanceRecords: () => Promise<boolean>
  toggleStopwatch: () => void
  setDurationMinutes: React.Dispatch<React.SetStateAction<number>>
  setScheduleTime: React.Dispatch<React.SetStateAction<string>>
  setUseScheduledTime: React.Dispatch<React.SetStateAction<boolean>>
  setIsDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function useLectureManagement({
  courseId,
  durationMinutes: initialDuration = 60
}: UseLectureManagementProps): UseLectureManagementResult {
  const router = useRouter()
  
  // Lecture state
  const [lectureId, setLectureId] = useState<string | null>(null)
  const [lectureStarted, setLectureStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeletingLecture, setIsDeletingLecture] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [lectureToDelete, setLectureToDelete] = useState<string | null>(null)
  
  // Duration tracking state
  const [lectureStartTime, setLectureStartTime] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [durationMinutes, setDurationMinutes] = useState(initialDuration)
  const [durationInterval, setDurationInterval] = useState<NodeJS.Timeout | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  
  // Scheduling state
  const [scheduleTime, setScheduleTime] = useState<string>(() => {
    // Set default to current time plus 5 minutes, rounded to nearest 5
    const now = new Date()
    now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5)
    now.setSeconds(0)
    return now.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
  })
  const [useScheduledTime, setUseScheduledTime] = useState(false)
  
  // Attendance state
  const [attendanceData, setAttendanceData] = useState<{[studentId: string]: {status: string, joinTime: Date, lastSeen: Date}}>({})

  // Function to start/resume the stopwatch
  const startStopwatch = useCallback(() => {
    // Clear any existing interval first
    if (durationInterval) {
      clearInterval(durationInterval)
    }
    
    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const newSeconds = prev + 1
        // Check if duration exceeded
        if (newSeconds === durationMinutes * 60) {
          toast.warning("Lecture duration reached. Consider ending the lecture.")
        }
        return newSeconds
      })
    }, 1000)
    
    setDurationInterval(interval)
  }, [durationInterval, durationMinutes])
  
  // Function to pause the stopwatch
  const pauseStopwatch = useCallback(() => {
    if (durationInterval) {
      clearInterval(durationInterval)
      setDurationInterval(null)
      setIsPaused(true)
    }
  }, [durationInterval])
  
  // Function to resume the stopwatch
  const resumeStopwatch = useCallback(() => {
    setIsPaused(false)
    startStopwatch()
  }, [startStopwatch])

  // Function to toggle pause/resume
  const toggleStopwatch = useCallback(() => {
    if (isPaused) {
      resumeStopwatch()
    } else {
      pauseStopwatch()
    }
  }, [isPaused, resumeStopwatch, pauseStopwatch])

  // Modified function to start a new lecture and activate detection
  const startNewLecture = useCallback(async (scheduledTime?: Date) => {
    try {
      setIsLoading(true)
      const startTime = scheduledTime || new Date()
      const now = new Date()
      
      // Check if scheduled time is in the past
      if (scheduledTime && startTime < now) {
        toast.warning("The scheduled time is in the past. Lecture timing may not be accurate.")
      }
      
      // Check if scheduled time is in the future
      if (scheduledTime && startTime > now) {
        const diffMinutes = Math.round((startTime.getTime() - now.getTime()) / 1000 / 60)
        toast.info(`Lecture is scheduled to start ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} from now.`)
      }
      
      // Create the lecture record in the database
      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Live Lecture - ${startTime.toLocaleString()}`,
          description: "Automatically created from live lecture session",
          date: startTime.toISOString(),
          duration: durationMinutes, // Use the configured duration
          courseId: courseId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API error:", errorData)
        throw new Error(errorData.error || "Failed to create lecture record")
      }

      const data = await response.json()
      setLectureId(data.id)
      setLectureStarted(true)
      setLectureStartTime(startTime)
      
      // Reset and start stopwatch
      setElapsedSeconds(0)
      setIsPaused(false)
      startStopwatch()
      
      toast.success("Lecture started successfully")
      
      return data.id
    } catch (error) {
      console.error("Error creating lecture:", error)
      toast.error(`Failed to create lecture: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [courseId, durationMinutes, startStopwatch])

  // Function to save attendance records
  const saveAttendanceRecords = useCallback(async () => {
    if (!lectureId) return false
    
    try {
      const records = Object.entries(attendanceData).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        joinTime: data.joinTime,
        leaveTime: new Date()
      }))
      
      const response = await fetch("/api/attendance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lectureId,
          records
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save attendance records")
      }
      
      toast.success("Attendance records saved successfully")
      return true
    } catch (error) {
      console.error("Error saving attendance:", error)
      toast.error("Failed to save attendance records")
      return false
    }
  }, [lectureId, attendanceData])

  // Add function to delete a lecture
  const deleteLecture = useCallback(async (lectureId: string) => {
    if (!lectureId) return
    
    try {
      setIsDeletingLecture(true)
      
      // Call the API to delete the lecture
      const response = await fetch(`/api/lectures/${lectureId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete lecture")
      }
      
      toast.success("Lecture deleted successfully")
      
      // Navigate back to course page
      router.push(`/dashboard/lectures/${courseId}`)
    } catch (error) {
      console.error("Error deleting lecture:", error)
      toast.error(`Failed to delete lecture: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeletingLecture(false)
      setIsDeleteDialogOpen(false)
    }
  }, [courseId, router])
  
  // Function to show delete confirmation
  const confirmDeleteLecture = useCallback((lectureId: string) => {
    setLectureToDelete(lectureId)
    setIsDeleteDialogOpen(true)
  }, [])

  // Function to end lecture
  const endLecture = useCallback(async () => {
    // Clear duration timer
    if (durationInterval) {
      clearInterval(durationInterval)
      setDurationInterval(null)
    }
    
    // Save attendance records
    if (lectureId) {
      await saveAttendanceRecords()
      
      // Navigate to the lecture details page
      router.push(`/dashboard/lectures/${courseId}/${lectureId}`)
    }
    
    // Clean up
    setLectureStarted(false)
    setLectureId(null)
    setAttendanceData({})
    setElapsedSeconds(0)
    setLectureStartTime(null)
  }, [durationInterval, lectureId, saveAttendanceRecords, router, courseId])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (durationInterval) {
        clearInterval(durationInterval)
      }
    }
  }, [durationInterval])

  return {
    lectureId,
    lectureStarted,
    isLoading,
    isDeletingLecture,
    isDeleteDialogOpen,
    lectureStartTime,
    elapsedSeconds,
    isPaused,
    durationMinutes,
    scheduleTime,
    useScheduledTime,
    attendanceData,
    startNewLecture,
    endLecture,
    deleteLecture,
    confirmDeleteLecture,
    saveAttendanceRecords,
    toggleStopwatch,
    setDurationMinutes,
    setScheduleTime,
    setUseScheduledTime,
    setIsDeleteDialogOpen
  }
} 