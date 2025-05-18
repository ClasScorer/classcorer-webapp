import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera } from "lucide-react"
import { EnhancedFaceDetectionResponse } from "@/types/lecture-room"
import { Student } from "@/lib/data"
import { useCallback, useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { CircularDialogWidget } from "./CircularDialogWidget"

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>
  displayCanvasRef: React.RefObject<HTMLCanvasElement>
  detectionCanvasRef: React.RefObject<HTMLCanvasElement>
  isVideoOn: boolean
  faceData: EnhancedFaceDetectionResponse | null
  students: Student[]
  isSimulating?: boolean  // Add flag to indicate simulation mode
}

export function VideoFeed({
  videoRef,
  displayCanvasRef,
  detectionCanvasRef,
  isVideoOn,
  faceData,
  students,
  isSimulating = false
}: VideoFeedProps) {
  // Add state to manage dialog position and clicked face
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clickedFace, setClickedFace] = useState<{
    faceData: any;
    student: Student | null;
  } | null>(null);
  
  // Create ref for the invisible bounding box canvas
  const boundingBoxCanvasRef = useRef<HTMLCanvasElement>(null);

  // Ensure canvas resolution matches video resolution
  useEffect(() => {
    const setupCanvasResolution = () => {
      if (!videoRef.current || !displayCanvasRef.current || !detectionCanvasRef.current || !boundingBoxCanvasRef.current) return;

      const video = videoRef.current;
      const displayCanvas = displayCanvasRef.current;
      const detectionCanvas = detectionCanvasRef.current;
      const boundingBoxCanvas = boundingBoxCanvasRef.current;

      // Get video dimensions
      const videoWidth = isSimulating ? 1280 : (video.videoWidth || 640);
      const videoHeight = isSimulating ? 720 : (video.videoHeight || 480);

      // Set high-resolution canvas dimensions for better quality
      displayCanvas.width = videoWidth;
      displayCanvas.height = videoHeight;
      detectionCanvas.width = videoWidth;
      detectionCanvas.height = videoHeight;
      boundingBoxCanvas.width = videoWidth;
      boundingBoxCanvas.height = videoHeight;
      
      console.log(`Canvas resolution set to: ${videoWidth}x${videoHeight}`);
    };

    // Set initial resolution
    setupCanvasResolution();

    // Update resolution when video plays (for camera feed)
    if (videoRef.current) {
      videoRef.current.addEventListener('playing', setupCanvasResolution);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('playing', setupCanvasResolution);
      }
    };
  }, [videoRef, displayCanvasRef, detectionCanvasRef, isSimulating]);

  // Draw bounding boxes on the invisible canvas
  useEffect(() => {
    const drawBoundingBoxes = () => {
      if (!faceData || !boundingBoxCanvasRef.current) return;

      const canvas = boundingBoxCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw invisible rectangles for each face
      faceData.faces.forEach(face => {
        const { x, y, width, height } = face.bounding_box;
        
        // Convert normalized coordinates to pixel values
        const pixelX = x * canvas.width;
        const pixelY = y * canvas.height;
        const pixelWidth = width * canvas.width;
        const pixelHeight = height * canvas.height;
        
        // Draw an invisible rectangle (using transparent fill)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'; // Nearly invisible
        ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
        
        // Store metadata with the rectangle
        // (This doesn't actually draw anything, but we're conceptually
        // associating this data with the region for our own reference)
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.rect(pixelX, pixelY, pixelWidth, pixelHeight);
        ctx.restore();
      });
    };

    drawBoundingBoxes();
  }, [faceData]);

  // Handle dialog option selection
  const handleOptionSelect = useCallback((optionValue: number) => {
    if (!clickedFace) return;
    
    const { faceData, student } = clickedFace;
    const studentName = student ? student.name : "Unknown Student";
    const studentId = student ? student.id : faceData.person_id;
    const isHandRaised = faceData.hand_raising_status?.is_hand_raised || false;
    const focusScore = faceData.attentionMetrics?.focusScore || 0;
    const attentionStatus = faceData.attention_status || 'unknown';
    
    // Record the action in the database (stub for now)
    const recordStudentAction = async (action: string, points: number, details: string) => {
      // This would be an API call in a real implementation
      try {
        console.log(`Recording action: ${action} for student ${studentId}, points: ${points}, details: ${details}`);
        
        // Simulate API call to record the action
        // await fetch('/api/student-actions', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     studentId,
        //     action,
        //     points,
        //     details,
        //     timestamp: new Date().toISOString()
        //   })
        // });
        
        return true;
      } catch (error) {
        console.error('Error recording student action:', error);
        toast.error('Failed to record action');
        return false;
      }
    };
    
    // Handle the selected option
    switch (optionValue) {
      case 1: // Correct Answer
        toast.success(`${studentName} - Awarded points for correct answer`, {
          description: `Focus: ${focusScore}%, ${isHandRaised ? 'Hand was raised' : 'Hand was not raised'}`,
          duration: 3000,
        });
        recordStudentAction('correct_answer', 10, `Attention: ${attentionStatus}`);
        break;
      case 2: // Attempted Answer
        toast.info(`${studentName} - Awarded points for attempt`, {
          description: `Focus: ${focusScore}%, ${isHandRaised ? 'Hand was raised' : 'Hand was not raised'}`,
          duration: 3000,
        });
        recordStudentAction('attempted_answer', 5, `Attention: ${attentionStatus}`);
        break;
      case 3: // Penalize
        toast.error(`${studentName} - Penalized`, {
          description: `Focus: ${focusScore}%, Attention: ${attentionStatus}`,
          duration: 3000,
        });
        recordStudentAction('penalize', -5, `Low focus: ${focusScore}%`);
        break;
      case 4: // Identify Student
        toast.info(`Student identified: ${studentName}`, {
          description: `ID: ${studentId}, Recognition status: ${faceData.recognition_status}`,
          duration: 4000,
        });
        recordStudentAction('identify', 0, `Manual identification in lecture`);
        break;
      case 5: // Custom Points
        const points = 3; // In a real implementation, this would be from a dialog
        toast.info(`Custom points for ${studentName}: +${points}`, {
          description: `Focus: ${focusScore}%, Attention: ${attentionStatus}`,
          duration: 3000,
        });
        recordStudentAction('custom_points', points, `Manual award during lecture`);
        break;
      case 6: // View Profile
        toast.info(`Viewing profile for ${studentName}`, {
          description: `Opening student profile in a new tab`,
          duration: 3000,
        });
        // In a real implementation, this might open a modal or navigate to the student profile
        recordStudentAction('view_profile', 0, `Profile viewed during lecture`);
        break;
      default:
        break;
    }
  }, [clickedFace]);

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
        // Set dialog position at the click point
        setDialogPosition({ x: event.clientX, y: event.clientY });
        
        // Find student info
        let student = null;
        if (face.recognition_status === "known") {
          // Check if students array exists and is not empty
          if (students && students.length > 0) {
            student = students.find(s => s.id === face.person_id) || null;
          }
        }
        
        // Store the clicked face data
        setClickedFace({ faceData: face, student });
        
        // Open the dialog
        setIsDialogOpen(true);
        return;
      }
    }
  }, [faceData, students, videoRef, displayCanvasRef]);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Camera Feed
            
            {faceData && faceData.faces.length > 0 && (
              <div className="text-xs flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                <span className="animate-pulse">•</span>
                <span>Click on faces for actions</span>
                {isSimulating && (
                  <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-sm text-[10px]">
                    SIM
                  </span>
                )}
              </div>
            )}
          </CardTitle>
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
            
            {/* Invisible bounding box canvas that sits behind avatar SVGs */}
            <canvas
              ref={boundingBoxCanvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ opacity: 0 }} // Make it completely invisible
            />
            
            <canvas
              ref={displayCanvasRef}
              className="absolute top-0 left-0 w-full h-full"
              onClick={handleCanvasClick}
              style={{ cursor: faceData && faceData.faces.length > 0 ? 'crosshair' : 'default' }}
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
            
            {/* Render hint overlay for interactive faces */}
            {faceData?.faces.map((face, idx) => {
              if (!displayCanvasRef.current) return null;
              
              const canvas = displayCanvasRef.current;
              const { x, y, width, height } = face.bounding_box;
              
              // Convert normalized coordinates to pixel values for the overlay
              const rectX = x * canvas.width;
              const rectY = y * canvas.height;
              
              // Calculate position for indicator (relative to canvas dimensions)
              const indicatorPosX = rectX + (width * canvas.width * 0.5); 
              const indicatorPosY = rectY;
              
              // Convert to viewport coordinates
              const rect = canvas.getBoundingClientRect();
              const viewportX = (indicatorPosX / canvas.width) * rect.width;
              const viewportY = (indicatorPosY / canvas.height) * rect.height;
              
              const isHandRaised = face.hand_raising_status?.is_hand_raised;
              const attentionColor = face.attentionMetrics?.focusScore > 70 
                ? 'bg-green-500' 
                : face.attentionMetrics?.focusScore > 40 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500';
              
              return (
                <div 
                  key={`face-indicator-${idx}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${viewportX}px`,
                    top: `${viewportY}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${attentionColor} animate-pulse mb-1`} />
                    {isHandRaised && (
                      <div className="text-xs bg-blue-500 text-white px-1 rounded-sm mb-1">
                        ✋
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Position the dialog trigger at the clicked position */}
      <div 
        style={{ 
          position: 'fixed',
          left: `${dialogPosition.x}px`, 
          top: `${dialogPosition.y}px`,
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          pointerEvents: isDialogOpen ? 'auto' : 'none', 
          opacity: 0  // Hide the trigger button
        }}
      >
        <CircularDialogWidget
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSelect={handleOptionSelect}
          trigger={<div className="w-1 h-1" />}
          boundingBoxRef={boundingBoxCanvasRef}
        />
      </div>
    </>
  )
} 