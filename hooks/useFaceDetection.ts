import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { 
  FaceDetectionResponse, 
  EnhancedFaceDetectionResponse, 
  EnhancedFaceData 
} from "@/types/lecture-room"
import { Student } from "@/lib/data"

interface UseFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>
  isVideoOn: boolean
  lectureId: string | null
  students: Student[]
}

interface UseFaceDetectionResult {
  isDetecting: boolean
  faceData: EnhancedFaceDetectionResponse | null
  startFaceDetection: (lectureId: string) => void
  stopFaceDetection: () => void
  simulateDetection: () => void
  captureVideoFrame: () => Promise<Blob>
  drawFaceBoxes: () => void
  detectionCanvasRef: React.RefObject<HTMLCanvasElement>
  displayCanvasRef: React.RefObject<HTMLCanvasElement>
}

export function useFaceDetection({
  videoRef,
  isVideoOn,
  lectureId,
  students
}: UseFaceDetectionProps): UseFaceDetectionResult {
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null)
  const [faceData, setFaceData] = useState<EnhancedFaceDetectionResponse | null>(null)
  const [detectionHistory, setDetectionHistory] = useState<EnhancedFaceDetectionResponse[]>([])
  
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null)
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)

  // Function to capture a video frame and convert to blob
  const captureVideoFrame = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !isVideoOn) {
        console.error("Video is not available")
        reject(new Error("Video is not available"))
        return
      }

      // Use the detection canvas ref
      const canvas = detectionCanvasRef.current
      if (!canvas) {
        console.error("Canvas is not available")
        reject(new Error("Canvas is not available"))
        return
      }

      const video = videoRef.current
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        console.error("Canvas context not available")
        reject(new Error("Canvas context not available"))
        return
      }
      
      console.log("Attempting to capture frame from video:", {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      })
      
      try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        
        // Draw the current video frame to the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        console.log("Successfully drew video to canvas")
        
        // Add a timestamp for debugging
        ctx.fillStyle = "rgba(0, 255, 0, 0.5)"
        ctx.fillRect(0, 0, 150, 20)
        ctx.fillStyle = "black"
        ctx.font = "12px Arial"
        ctx.fillText(`${new Date().toLocaleTimeString()}`, 5, 15)
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Successfully created blob: ${blob.size} bytes`)
              resolve(blob)
            } else {
              console.error("Failed to create blob from canvas")
              reject(new Error("Failed to create blob from canvas"))
            }
          },
          'image/jpeg',
          0.8
        )
      } catch (err) {
        console.error("Error in frame capture:", err)
        reject(new Error(`Frame capture error: ${err.message}`))
      }
    })
  }, [videoRef, isVideoOn])

  // Function to send frame to API and get face detection results
  const sendFrameToAPI = useCallback(async (frameBlob: Blob) => {
    if (!lectureId) return null
    
    // Create a precise timestamp for this frame
    const frameTimestamp = new Date().toISOString()
    
    const formData = new FormData()
    formData.append('image', frameBlob)
    formData.append('lectureId', lectureId)
    formData.append('timestamp', frameTimestamp)
    
    try {
      // Use the correct API endpoint that matches the gateway
      const response = await fetch('/api/process-frame', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
      
      // Get the base response data
      const data: FaceDetectionResponse = await response.json()
      console.log("Received detection response:", data)
      
      // Transform the API response into the enhanced format
      const enhancedData = enhanceApiResponse(data)
      
      // Update state with the enhanced data
      setFaceData(enhancedData)
      
      // Store in history
      setDetectionHistory(prev => [...prev.slice(-9), enhancedData])
      
      // Also send the original data to our engagement API to store
      saveEngagementData(data)
      
      return data
    } catch (error) {
      console.error('Error sending frame to API:', error)
      toast.error(`Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    }
  }, [lectureId])

  // Enhance the API response with UI-specific data
  const enhanceApiResponse = useCallback((data: FaceDetectionResponse): EnhancedFaceDetectionResponse => {
    // Enhanced faces with additional metrics
    const enhancedFaces = data.faces.map(face => {
      // Try to find the student that matches the detected face
      const student = students.find(s => s.id.toString() === face.person_id)
      
      // Map recognition status from backend to frontend expected values
      // Backend uses "found" but frontend expects "known"
      const mappedRecognitionStatus = face.recognition_status === "found" ? "known" : face.recognition_status
      
      // Determine engagement level based on attention status
      const engagementLevel: 'high' | 'medium' | 'low' = 
        face.attention_status === "FOCUSED" ? 'high' : 'low'
      
      // Generate the additional metrics that the UI expects
      return {
        ...face,
        // Map recognition status
        recognition_status: mappedRecognitionStatus as "new" | "known" | "unknown",
        // Ensure correct case for attention_status (API uses uppercase)
        attention_status: face.attention_status.toLowerCase() as "focused" | "unfocused",
        // Add name if we found a matching student
        name: student?.name || "Unknown Person",
        // Add additional metrics needed for UI display with proper typing
        attentionMetrics: {
          focusScore: face.attention_status === "FOCUSED" ? 85 : 30,
          focusDuration: Math.round(Math.random() * 60), 
          distractionCount: face.attention_status === "FOCUSED" ? 1 : 4,
          engagementLevel: engagementLevel
        },
        lastDetectedAt: new Date().toISOString(),
        // Add UI-specific properties
        highlight: false,
        infoVisible: false
      }
    })
  
    // Calculate overall class engagement (% of focused students)
    const classEngagement = data.total_faces > 0 
      ? (data.summary.focused_faces / data.total_faces) * 100
      : 0
      
    // Return the enhanced data structure
    return {
      ...data,
      faces: enhancedFaces,
      classEngagement,
      // Add time series data structure for trends
      timeSeries: detectionHistory.slice(-10).map((history, index) => ({
        timestamp: new Date(Date.now() - (10 - index) * 5000).toISOString(),
        focusedPercentage: history?.summary?.focused_faces / Math.max(history?.total_faces, 1) * 100 || 0,
        totalFaces: history?.total_faces || 0
      }))
    }
  }, [students, detectionHistory])

  // Function to draw face boxes on the display canvas
  const drawFaceBoxes = useCallback(() => {
    if (!faceData || !faceData.faces || !displayCanvasRef.current || !videoRef.current) return
    
    const canvas = displayCanvasRef.current
    const video = videoRef.current
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Always redraw the video first
    if (isVideoOn) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }
    
    // Draw each face box
    faceData.faces.forEach(face => {
      const { x, y, width, height } = face.bounding_box
      
      // Convert normalized coordinates to pixel values
      const boxX = x * canvas.width
      const boxY = y * canvas.height
      const boxWidth = width * canvas.width
      const boxHeight = height * canvas.height
      
      // Set styles based on attention status
      const color = face.attention_status === "focused" ? '#4CAF50' : '#F44336'
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      
      // Draw the bounding box rectangle
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)
      
      // Draw hand raised indicator if applicable
      if (face.hand_raising_status.is_hand_raised) {
        ctx.fillStyle = 'rgba(255, 193, 7, 0.8)'
        ctx.beginPath()
        ctx.arc(
          boxX + boxWidth - 10, 
          boxY + 10, 
          8, 0, 2 * Math.PI
        )
        ctx.fill()
      }
      
      // Add label background for better visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(boxX, boxY - 25, boxWidth, 20)
      
      // Add label text
      const studentId = face.person_id
      const student = students.find(s => s.id === studentId)
      let label = 'Unknown'
      
      if (face.recognition_status === "known") {
        label = student ? student.name : `Person ${face.person_id}`
      } else if (face.recognition_status === "new") {
        label = `New Face (${Math.round((face.confidence || 0.5) * 100)}%)`
      }
      
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '12px Arial'
      ctx.fillText(label, boxX + 5, boxY - 10)
    })
  }, [faceData, students, isVideoOn, videoRef])

  // Start face detection with the given lecture ID
  const startFaceDetection = useCallback((currentLectureId: string) => {
    if (!isVideoOn) {
      toast.error("Camera must be on to start detection")
      return
    }
    
    console.log("Starting detection with video state:", {
      srcObject: videoRef.current?.srcObject ? "present" : "null",
      paused: videoRef.current?.paused,
      videoWidth: videoRef.current?.videoWidth,
      videoHeight: videoRef.current?.videoHeight
    })
    
    setIsDetecting(true)
    
    // Create an interval to capture frames and send to API
    const interval = setInterval(async () => {
      try {
        console.log("Capture cycle started")
        const frameBlob = await captureVideoFrame()
        console.log(`Captured frame: ${frameBlob.size} bytes`)
        await sendFrameToAPI(frameBlob)
      } catch (error) {
        console.error("Error in detection cycle:", error)
      }
    }, 5000) // Capture every 5 seconds
    
    setDetectionInterval(interval)
    toast.success("Face detection started")
  }, [isVideoOn, videoRef, captureVideoFrame, sendFrameToAPI])

  // Stop face detection
  const stopFaceDetection = useCallback(() => {
    if (detectionInterval) {
      clearInterval(detectionInterval)
      setDetectionInterval(null)
    }
    setIsDetecting(false)
    toast.info("Face detection stopped")
  }, [detectionInterval])

  // Function to save engagement data to the database
  const saveEngagementData = useCallback(async (data: FaceDetectionResponse) => {
    if (!lectureId) return
    
    try {
      const response = await fetch('/api/lectures/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        console.error('Failed to save engagement data:', await response.text())
      }
    } catch (error) {
      console.error('Error saving engagement data:', error)
    }
  }, [lectureId])

  // Simulation function for testing
  const simulateDetection = useCallback(() => {
    if (!lectureId) {
      toast.error("No active lecture. Start a lecture first.")
      return
    }
    
    // Create mock detection data
    const mockData: EnhancedFaceDetectionResponse = {
      lecture_id: lectureId,
      timestamp: new Date().toISOString(),
      total_faces: Math.min(students.length, 5),
      faces: students.slice(0, 5).map((student, index) => ({
        person_id: student.id.toString(),
        recognition_status: Math.random() > 0.2 ? "known" : "new",
        attention_status: Math.random() > 0.3 ? "FOCUSED" : "UNFOCUSED",
        hand_raising_status: {
          is_hand_raised: Math.random() > 0.8,
          confidence: Math.random() * 0.5 + 0.5,
          hand_position: { x: Math.random() * 0.8, y: Math.random() * 0.8 }
        },
        confidence: Math.random() * 0.5 + 0.5,
        bounding_box: {
          x: Math.random() * 0.5,
          y: Math.random() * 0.5,
          width: Math.random() * 0.2 + 0.1,
          height: Math.random() * 0.2 + 0.1
        },
        name: student.name,
        attentionMetrics: {
          focusScore: Math.round(Math.random() * 100),
          focusDuration: Math.round(Math.random() * 60),
          distractionCount: Math.round(Math.random() * 5),
          engagementLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
        }
      })),
      summary: {
        new_faces: Math.floor(Math.random() * 2),
        known_faces: Math.floor(Math.random() * 4) + 1,
        focused_faces: Math.floor(Math.random() * 3) + 2,
        unfocused_faces: Math.floor(Math.random() * 2),
        hands_raised: Math.floor(Math.random() * 2)
      },
      classEngagement: Math.random() * 80 + 20
    }
    
    // Update state with mock data
    setFaceData(mockData)
    
    // Also send to engagement API
    saveEngagementData(mockData)
    
    toast.success("Simulated detection data generated")
  }, [lectureId, students, saveEngagementData])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval)
      }
    }
  }, [detectionInterval])

  // Update canvas when face data changes 
  useEffect(() => {
    // Set up continuous redrawing
    if (isVideoOn) {
      const drawLoop = () => {
        drawFaceBoxes()
        animationRef.current = requestAnimationFrame(drawLoop)
      }
      
      const animationRef = { current: requestAnimationFrame(drawLoop) }
      
      return () => {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [faceData, drawFaceBoxes, isVideoOn])

  return {
    isDetecting,
    faceData,
    startFaceDetection,
    stopFaceDetection,
    simulateDetection,
    captureVideoFrame,
    drawFaceBoxes,
    detectionCanvasRef,
    displayCanvasRef
  }
} 