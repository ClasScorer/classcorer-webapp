import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera } from "lucide-react"
import { EnhancedFaceDetectionResponse } from "@/types/lecture-room"
import { Student } from "@/lib/data"
import { useCallback } from "react"
import { toast } from "sonner"

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>
  displayCanvasRef: React.RefObject<HTMLCanvasElement>
  detectionCanvasRef: React.RefObject<HTMLCanvasElement>
  isVideoOn: boolean
  faceData: EnhancedFaceDetectionResponse | null
  students: Student[]
}

export function VideoFeed({
  videoRef,
  displayCanvasRef,
  detectionCanvasRef,
  isVideoOn,
  faceData,
  students
}: VideoFeedProps) {
  // Add this function to handle canvas clicks on face boxes
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!faceData || !displayCanvasRef.current || !videoRef.current) return
    
    const canvas = displayCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    // Calculate the clicked position relative to the canvas
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Scale the coordinates to match the canvas's internal dimensions
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = x * scaleX
    const clickY = y * scaleY
    
    // Check if click is within any face bounding box
    for (const face of faceData.faces) {
      const { x: boxX, y: boxY, width: boxWidth, height: boxHeight } = face.bounding_box
      
      // Convert normalized coordinates to pixel values
      const pixelX = boxX * canvas.width
      const pixelY = boxY * canvas.height
      const pixelWidth = boxWidth * canvas.width
      const pixelHeight = boxHeight * canvas.height
      
      // Check if click is inside this box
      if (
        clickX >= pixelX && 
        clickX <= pixelX + pixelWidth && 
        clickY >= pixelY && 
        clickY <= pixelY + pixelHeight
      ) {
        // Find student info
        if (face.recognition_status === "known") {
          // Check if students array exists and is not empty
          if (students && students.length > 0) {
            const student = students.find(s => s.id === face.person_id)
            if (student) {
              toast.info(`${student.name} - ${face.attention_status}`, {
                description: face.hand_raising_status.is_hand_raised ? 
                  "Hand is raised" : 
                  `Focus score: ${face.attentionMetrics?.focusScore || 0}%`
              })
              return
            }
          }
          // If student not found or no students array
          toast.info(`Student ID: ${face.person_id}`, {
            description: face.hand_raising_status.is_hand_raised ? 
              "Hand is raised" : 
              `Focus score: ${face.attentionMetrics?.focusScore || 0}%`
          })
          return
        } else {
          toast.info("Unrecognized Student", {
            description: "This student hasn't been identified yet"
          })
          return
        }
      }
    }
  }, [faceData, students, videoRef, displayCanvasRef])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Camera Feed</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-md bg-gray-100 aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          <canvas
            ref={displayCanvasRef}
            className="absolute top-0 left-0 w-full h-full"
            onClick={handleCanvasClick}
          />
          
          {/* Hidden canvas for processing */}
          <canvas
            ref={detectionCanvasRef}
            className="hidden"
          />
          
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Enable camera to start</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 