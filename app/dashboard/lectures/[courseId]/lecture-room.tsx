"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Camera, Presentation, Mic, MicOff, Video, VideoOff, Share2, MessageSquare, X, Play, Square, Save, ScreenShare, Send, Ghost, Bug } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Course, Student } from "@/lib/data"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Add Google API types
interface GoogleSlide {
  objectId: string
  slideIndex: number
  thumbnailUrl: string
}

interface ChatMessage {
  student: {
    id: string | number
    name: string
    email: string
    avatar: string
    status: string
    courseId: string | number
    score: number
    attendance: number
    level: string
    average: number
    submissions: number
    lastSubmission: string
    grade: string
    trend: string
  }
  text: string
}

interface LectureRoomProps {
  course: Course
  students: Student[]
}

// Add type declarations for Google API
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void
      client: {
        init: (config: {
          apiKey: string
          clientId: string
          discoveryDocs: string[]
          scope: string
        }) => Promise<void>
        slides: {
          presentations: {
            get: (params: { presentationId: string }) => Promise<{
              result: {
                slides: Array<{
                  objectId: string
                  [key: string]: any
                }>
              }
            }>
          }
        }
      }
    }
  }
}

interface Coordinate {
  human_id: number
  x_min: number
  y_min: number
  x_max: number
  y_max: number
  label: string
  score: number
}

// Types for face detection API response
interface HandRaising {
  is_hand_raised: boolean;
  confidence: number;
  hand_position: {
    x: number;
    y: number;
  };
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceData {
  person_id: string;
  recognition_status: "new" | "known";
  attention_status: "focused" | "unfocused";
  hand_raising_status: HandRaising;
  confidence: number;
  bounding_box: BoundingBox;
}

interface FaceDetectionSummary {
  new_faces: number;
  known_faces: number;
  focused_faces: number;
  unfocused_faces: number;
  hands_raised: number;
}

interface FaceDetectionResponse {
  lecture_id: string;
  timestamp: string;
  total_faces: number;
  faces: FaceData[];
  summary: FaceDetectionSummary;
}

// Add enhanced types for slide management
interface SlideData {
  id: string;
  title: string;
  thumbnailUrl: string;
  index: number;
  current: boolean;
}

interface PresentationData {
  id: string;
  title: string;
  slides: SlideData[];
}

// Enhanced face detection types
interface AttentionMetrics {
  focusScore: number;
  focusDuration: number;
  distractionCount: number;
  engagementLevel: 'high' | 'medium' | 'low';
}

interface EnhancedFaceData extends FaceData {
  attentionMetrics?: AttentionMetrics;
  name?: string;
  lastDetectedAt?: string;
  consecutiveFrames?: number;
}

interface EnhancedFaceDetectionResponse extends FaceDetectionResponse {
  classEngagement: number;
  timeSeries?: {
    timestamp: string;
    focusedPercentage: number;
    totalFaces: number;
  }[];
  faces: EnhancedFaceData[];
}

export function LectureRoom({ course, students }: LectureRoomProps) {
  const router = useRouter();
  
  // State for video/audio controls
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isAudioOn, setIsAudioOn] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState("")

  // State for face detection
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null)
  const [faceData, setFaceData] = useState<EnhancedFaceDetectionResponse | null>(null)
  const [lectureStarted, setLectureStarted] = useState(false)
  const [lectureId, setLectureId] = useState<string | null>(null)
  const [attendanceData, setAttendanceData] = useState<{[studentId: string]: {status: string, joinTime: Date, lastSeen: Date}}>({})
  const [isLoading, setIsLoading] = useState(false)

  // Refs for media elements
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null)
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)

  // Slides state
  const [presentationUrl, setPresentationUrl] = useState<string>("")
  const [embedUrl, setEmbedUrl] = useState<string>("")

  // New state for coordinates
  const [coordinates, setCoordinates] = useState<Coordinate[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [displayCoords, setDisplayCoords] = useState<{ [key: number]: { x: number, y: number, width: number, height: number } }>({})

  // Enhanced state for slides and presentations
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [slideThumbnails, setSlideThumbnails] = useState<string[]>([])
  const [isLoadingSlides, setIsLoadingSlides] = useState(false)
  
  // Enhanced state for face detection
  const [detectionHistory, setDetectionHistory] = useState<EnhancedFaceDetectionResponse[]>([])
  const [historyView, setHistoryView] = useState(false)

  // Modified function to start a new lecture and activate detection
  const startNewLecture = async () => {
    try {
      setIsLoading(true);
      // Create the lecture record in the database
      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Live Lecture - ${new Date().toLocaleString()}`,
          description: "Automatically created from live lecture session",
          date: new Date().toISOString(),
          duration: 60, // Default duration in minutes
          courseId: course.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.error || "Failed to create lecture record");
      }

      const data = await response.json();
      setLectureId(data.id);
      setLectureStarted(true); // Set lecture started to true
      
      toast.success("Lecture started successfully");
      
      // Start detection if video is on
      if (isVideoOn) {
        startFaceDetection(data.id);
      }
      
      return data.id;
    } catch (error) {
      console.error("Error creating lecture:", error);
      toast.error(`Failed to create lecture: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save attendance records
  const saveAttendanceRecords = async () => {
    if (!lectureId) return;
    
    try {
      const records = Object.entries(attendanceData).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        joinTime: data.joinTime,
        leaveTime: new Date()
      }));
      
      const response = await fetch("/api/attendance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lectureId,
          records
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save attendance records");
      }
      
      toast.success("Attendance records saved successfully");
      return true;
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance records");
      return false;
    }
  };

  // Enhanced function to handle Google Slides integration
  const handlePresentationUrl = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setPresentationUrl(url)
    
    try {
      const id = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
      if (id) {
        setIsLoadingSlides(true)
        setEmbedUrl(`https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`)
        
        // Generate mock slide thumbnails (in a real app, this would use the Google Slides API)
        const mockThumbnails = Array.from({ length: 5 }, (_, i) => 
          `https://picsum.photos/id/${i + 10}/400/300`
        )
        setSlideThumbnails(mockThumbnails)
        
        // Mock presentation data
        setPresentationData({
          id,
          title: "Lecture Presentation",
          slides: mockThumbnails.map((url, index) => ({
            id: `slide-${index}`,
            title: `Slide ${index + 1}`,
            thumbnailUrl: url,
            index,
            current: index === 0
          }))
        })
        
        setIsLoadingSlides(false)
      }
    } catch (error) {
      console.error("Error processing URL:", error)
      setIsLoadingSlides(false)
    }
  }

  // Function to change slides
  const changeSlide = (index: number) => {
    if (presentationData && index >= 0 && index < presentationData.slides.length) {
      setActiveSlideIndex(index)
      // Update current status in slides
      setPresentationData({
        ...presentationData,
        slides: presentationData.slides.map((slide, i) => ({
          ...slide,
          current: i === index
        }))
      })
    }
  }

  // Handle camera toggle
  const toggleVideo = async () => {
    try {
      if (!isVideoOn) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,  // Simplified constraints for testing
          audio: false
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream
          await videoRef.current.play()
        }
        setIsVideoOn(true)
      } else {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
        streamRef.current = null
        setIsVideoOn(false)
        
        // If we're also detecting faces, stop that too
        if (isDetecting) {
          stopFaceDetection();
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setIsVideoOn(false)
    }
  }

  // Handle audio toggle
  const toggleAudio = async () => {
    try {
      if (!isAudioOn) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
      } else {
        streamRef.current?.getTracks().forEach(track => {
          if (track.kind === 'audio') track.stop()
        })
      }
      setIsAudioOn(!isAudioOn)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  // Function to capture a video frame and convert to blob
  const captureVideoFrame = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !isVideoOn) {
        reject(new Error("Video is not available"));
        return;
      }

      const canvas = detectionCanvasRef.current;
      if (!canvas) {
        reject(new Error("Canvas is not available"));
        return;
      }

      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      
      // Draw the current video frame to the hidden canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert the canvas to a blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob from canvas"));
        }
      }, 'image/jpeg', 0.8); // JPEG at 80% quality
    });
  };

  // Function to send frame to API and get face detection results
  const sendFrameToAPI = async (frameBlob: Blob) => {
    if (!lectureId) return null;
    
    const formData = new FormData();
    formData.append('image', frameBlob);
    formData.append('lecture_id', lectureId);
    
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/face-detection', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: FaceDetectionResponse = await response.json();
      
      // Update the face data state
      setFaceData(data as EnhancedFaceDetectionResponse);
      
      // Also send the data to our engagement API to store in the database
      saveEngagementData(data);
      
      return data;
    } catch (error) {
      console.error('Error sending frame to API:', error);
      return null;
    }
  };

  // Function to save engagement data to the database
  const saveEngagementData = async (data: FaceDetectionResponse) => {
    if (!lectureId) return;
    
    try {
      const response = await fetch('/api/lectures/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        console.error('Failed to save engagement data:', await response.text());
      }
    } catch (error) {
      console.error('Error saving engagement data:', error);
    }
  };

  // Enhanced function to process face detection with more metrics
  const processFaceDetectionResults = (data: FaceDetectionResponse) => {
    if (!data || !data.faces || data.faces.length === 0) return;
    
    // Add enhanced metrics to face data
    const enhancedFaces: EnhancedFaceData[] = data.faces.map(face => {
      const student = students.find(s => s.id === face.person_id);
      
      // Generate random engagement metrics for demo purposes
      // In a real app, this would come from actual analysis
      const attentionMetrics: AttentionMetrics = {
        focusScore: Math.round(Math.random() * 100),
        focusDuration: Math.round(Math.random() * 60),
        distractionCount: Math.round(Math.random() * 5),
        engagementLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
      };
      
      return {
        ...face,
        name: student?.name || "Unknown",
        attentionMetrics,
        lastDetectedAt: new Date().toISOString(),
        consecutiveFrames: Math.floor(Math.random() * 10) + 1
      };
    });
    
    // Create enhanced response with overall class engagement score
    const enhancedData: EnhancedFaceDetectionResponse = {
      ...data,
      faces: enhancedFaces,
      classEngagement: Math.round(
        (data.summary.focused_faces / Math.max(data.total_faces, 1)) * 100
      ),
      timeSeries: detectionHistory.slice(-10).map((history, index) => ({
        timestamp: new Date(Date.now() - (10 - index) * 5000).toISOString(),
        focusedPercentage: history?.summary?.focused_faces / Math.max(history?.total_faces, 1) * 100 || 0,
        totalFaces: history?.total_faces || 0
      }))
    };
    
    // Update the UI with enhanced face detection data
    setFaceData(enhancedData);
    setDetectionHistory(prev => [...prev, enhancedData].slice(-20)); // Keep last 20 records
    
    // Process faces for attendance
    const now = new Date();
    const updatedAttendance = {...attendanceData};
    
    enhancedData.faces.forEach(face => {
      if (face.recognition_status === "known") {
        const studentId = face.person_id;
        
        // Find the corresponding student
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        
        if (updatedAttendance[studentId]) {
          // Update existing record
          updatedAttendance[studentId].lastSeen = now;
        } else {
          // Create new record
          updatedAttendance[studentId] = {
            status: "PRESENT",
            joinTime: now,
            lastSeen: now
          };
        }
      }
    });
    
    setAttendanceData(updatedAttendance);
  };

  // Start face detection with the given lecture ID
  const startFaceDetection = (lectureId: string) => {
    if (!isVideoOn) {
      toast.error("Camera must be on to start detection");
      return;
    }
    
    setIsDetecting(true);
    
    // Create an interval to capture frames and send to API
    const interval = setInterval(async () => {
      try {
        const frameBlob = await captureVideoFrame();
        await sendFrameToAPI(frameBlob);
      } catch (error) {
        console.error("Error in detection cycle:", error);
      }
    }, 5000); // Capture every 5 seconds
    
    setDetectionInterval(interval);
    toast.success("Face detection started");
  };
  
  // Stop face detection
  const stopFaceDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
    setIsDetecting(false);
    toast.info("Face detection stopped");
  };

  // Function to end lecture
  const endLecture = async () => {
    // Stop detection
    stopFaceDetection();
    
    // Save attendance records
    if (lectureId) {
      await saveAttendanceRecords();
      
      // Navigate to the lecture details page
      router.push(`/dashboard/lectures/${course.id}/${lectureId}`);
    }
    
    // Clean up
    setLectureStarted(false);
    setLectureId(null);
    setAttendanceData({});
    setFaceData(null);
  };

  // Draw face boxes on the display canvas
  const drawFaceBoxes = useCallback(() => {
    if (!faceData || !faceData.faces || !displayCanvasRef.current || !videoRef.current) return;
    
    const canvas = displayCanvasRef.current;
    const video = videoRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each face box
    faceData.faces.forEach(face => {
      const { x, y, width, height } = face.bounding_box;
      
      // Convert normalized coordinates to pixel values if needed
      const boxX = x * canvas.width;
      const boxY = y * canvas.height;
      const boxWidth = width * canvas.width;
      const boxHeight = height * canvas.height;
      
      // Set styles based on attention status
      ctx.strokeStyle = face.attention_status === "focused" ? '#4CAF50' : '#F44336';
      ctx.lineWidth = 3;
      
      // Draw rectangle
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      // Draw hand raised indicator if applicable
      if (face.hand_raising_status.is_hand_raised) {
        ctx.fillStyle = 'rgba(255, 193, 7, 0.8)';
        ctx.beginPath();
        ctx.arc(
          boxX + boxWidth, 
          boxY, 
          10, 0, 2 * Math.PI
        );
        ctx.fill();
      }
      
      // Add label
      const status = face.recognition_status === "known" ? "Known" : "New";
      const studentId = face.person_id;
      const student = students.find(s => s.id === studentId);
      const label = student ? student.name : `${status} Person`;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(boxX, boxY - 20, boxWidth, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText(label, boxX + 5, boxY - 5);
    });
  }, [faceData, students]);

  // Update canvas when face data changes
  useEffect(() => {
    if (faceData) {
      drawFaceBoxes();
    }
  }, [faceData, drawFaceBoxes]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [detectionInterval]);

  // Handle screen sharing
  const toggleScreenShare = async () => {
    try {
      if (!isSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: false
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream

          // Listen for when user stops sharing through browser controls
          stream.getVideoTracks()[0].onended = () => {
            setIsSharing(false)
            if (videoRef.current) {
              videoRef.current.srcObject = null
            }
          }
        }
        setIsSharing(true)
      } else {
        streamRef.current?.getTracks().forEach(track => track.stop())
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
        setIsSharing(false)
      }
    } catch (error) {
      console.error('Error sharing screen:', error)
      setIsSharing(false)
    }
  }

  // Handle slide upload
  const handleSlideUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentSlide(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle chat message
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const professorMessage: ChatMessage = {
        student: {
          id: 'professor',
          name: 'Professor',
          email: course.instructor.email || '',
          avatar: '/avatars/professor.jpg',
          status: 'Excellent',
          courseId: course.id,
          score: 100,
          attendance: 100,
          level: 'Professor',
          average: 100,
          submissions: 0,
          lastSubmission: new Date().toISOString(),
          grade: 'A+',
          trend: 'up'
        },
        text: messageInput
      }
      setMessages(prev => [...prev, professorMessage])
      setMessageInput("")
    }
  }

  // Add simulation function for debugging
  const simulateDetection = () => {
    if (!lectureId) {
      toast.error("No active lecture. Start a lecture first.");
      return;
    }
    
    // Create mock detection data
    const mockData: EnhancedFaceDetectionResponse = {
      lecture_id: lectureId,
      timestamp: new Date().toISOString(),
      total_faces: Math.min(students.length, 5),
      faces: students.slice(0, 5).map((student, index) => ({
        person_id: student.id.toString(),
        recognition_status: Math.random() > 0.2 ? "known" : "new",
        attention_status: Math.random() > 0.3 ? "focused" : "unfocused",
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
    };
    
    // Update state with mock data
    setFaceData(mockData);
    
    // Also send to engagement API
    saveEngagementData(mockData);
    
    toast.success("Simulated detection data generated");
  };

  // Return JSX for the component with enhanced slides and detection info
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {/* Left panel - Controls and video */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lecture Controls</CardTitle>
              <CardDescription>
                {lectureStarted 
                  ? "Lecture in progress. Control your media and detection settings."
                  : "Start a lecture to begin tracking attendance and engagement."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!lectureStarted ? (
                <Button 
                  onClick={startNewLecture} 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Starting..." : "Start Lecture"}
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={isVideoOn ? "default" : "secondary"} 
                      onClick={toggleVideo}
                      className="flex-1"
                    >
                      {isVideoOn ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
                      {isVideoOn ? "Turn Off Camera" : "Turn On Camera"}
                    </Button>
                    
                    <Button 
                      variant={isAudioOn ? "default" : "secondary"} 
                      onClick={toggleAudio}
                      className="flex-1"
                    >
                      {isAudioOn ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                      {isAudioOn ? "Mute" : "Unmute"}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {isVideoOn && (
                      <Button
                        variant={isDetecting ? "destructive" : "default"}
                        onClick={isDetecting ? stopFaceDetection : () => startFaceDetection(lectureId!)}
                        className="flex-1"
                      >
                        {isDetecting ? "Stop Detection" : "Start Detection"}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={simulateDetection}
                      className="flex-1"
                    >
                      <Bug className="mr-2 h-4 w-4" />
                      Simulate Detection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Video and Detection Results */}
        <Card>
          <CardHeader>
            <CardTitle>Camera Feed</CardTitle>
          </CardHeader>
          <CardContent>
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
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
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
        
        {/* Enhanced Detection Info */}
        <Card>
          <CardHeader>
            <CardTitle>Face Detection</CardTitle>
            <CardDescription>
              Student engagement and attendance tracking
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
              <div className="space-y-4">
                {/* Enhanced Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 p-3 rounded-md text-center">
                    <p className="text-2xl font-bold text-blue-700">{faceData.total_faces}</p>
                    <p className="text-sm text-gray-600">Total Faces</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md text-center">
                    <p className="text-2xl font-bold text-green-700">{faceData.summary.focused_faces}</p>
                    <p className="text-sm text-gray-600">Focused</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-md text-center">
                    <div className="text-2xl font-bold text-yellow-700">{faceData.classEngagement}%</div>
                    <p className="text-sm text-gray-600">Engagement</p>
                  </div>
                </div>
                
                {/* Engagement Trend */}
                {faceData.timeSeries && faceData.timeSeries.length > 0 && (
                  <div className="rounded-md border p-3">
                    <div className="text-sm font-medium mb-2">Engagement Trend (Last 10 Checks)</div>
                    <div className="h-20 flex items-end space-x-1">
                      {faceData.timeSeries.map((point, i) => (
                        <div 
                          key={i} 
                          className="bg-blue-500 w-full rounded-t" 
                          style={{ 
                            height: `${Math.max(5, point.focusedPercentage)}%`,
                            opacity: 0.3 + (i / faceData.timeSeries!.length * 0.7)
                          }}
                          title={`${new Date(point.timestamp).toLocaleTimeString()}: ${Math.round(point.focusedPercentage)}% focused`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Enhanced Student List */}
                <div className="rounded-md border">
                  <div className="py-2 px-4 bg-gray-50 font-medium text-sm">
                    Detected Students
                  </div>
                  <div className="divide-y max-h-60 overflow-y-auto">
                    {faceData.faces.filter(face => face.recognition_status === "known").map((face) => {
                      const student = students.find(s => s.id === face.person_id);
                      if (!student) return null;
                      
                      return (
                        <div key={face.person_id} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={student.avatar || ""} alt={student.name} />
                                <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.email}</p>
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
                          {(face as EnhancedFaceData).attentionMetrics && (
                            <div className="grid grid-cols-4 gap-2 mt-1 text-xs">
                              <div className="bg-gray-50 p-1 rounded text-center">
                                <div className="font-medium">{(face as EnhancedFaceData).attentionMetrics?.focusScore}%</div>
                                <div className="text-gray-500">Focus</div>
                              </div>
                              <div className="bg-gray-50 p-1 rounded text-center">
                                <div className="font-medium">{(face as EnhancedFaceData).attentionMetrics?.focusDuration}s</div>
                                <div className="text-gray-500">Duration</div>
                              </div>
                              <div className="bg-gray-50 p-1 rounded text-center">
                                <div className="font-medium">{(face as EnhancedFaceData).attentionMetrics?.distractionCount}</div>
                                <div className="text-gray-500">Distractions</div>
                              </div>
                              <div className="bg-gray-50 p-1 rounded text-center">
                                <div className="font-medium capitalize">{(face as EnhancedFaceData).attentionMetrics?.engagementLevel}</div>
                                <div className="text-gray-500">Engagement</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {faceData.faces.filter(face => face.recognition_status === "known").length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        No known students detected
                      </div>
                    )}
                  </div>
                </div>
                
                {/* New Faces */}
                {faceData.summary.new_faces > 0 && (
                  <div className="rounded-md border">
                    <div className="py-2 px-4 bg-gray-50 font-medium text-sm">
                      Unrecognized Faces
                    </div>
                    <div className="p-4 text-center text-gray-500">
                      {faceData.summary.new_faces} unrecognized {faceData.summary.new_faces === 1 ? 'person' : 'people'} detected
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Enhanced Slides Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Presentation</CardTitle>
          <div className="flex items-center gap-2">
            {presentationData && (
              <Badge variant="outline" className="font-normal">
                Slide {activeSlideIndex + 1} of {presentationData.slides.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isSharing && !embedUrl && !currentSlide && !presentationData && (
              <div className="flex flex-col gap-4">
                <Input
                  placeholder="Enter Google Slides URL"
                  value={presentationUrl}
                  onChange={handlePresentationUrl}
                />
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 mr-2">Or upload slides:</p>
                  <input
                    type="file"
                    onChange={handleSlideUpload}
                    accept="image/png, image/jpeg, application/pdf"
                    className="text-sm text-gray-500"
                  />
                </div>
              </div>
            )}
            
            {isLoadingSlides && (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            
            {/* Display the presentation */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Main slide view */}
              <div className="md:col-span-3 aspect-video bg-black flex items-center justify-center rounded-md overflow-hidden">
                {embedUrl && (
                  <iframe
                    src={embedUrl}
                    title="Presentation"
                    className="w-full h-full border-0"
                    allowFullScreen
                  ></iframe>
                )}
                
                {currentSlide && !embedUrl && (
                  <img
                    src={currentSlide}
                    alt="Slide"
                    className="max-h-full max-w-full"
                  />
                )}
                
                {presentationData && !embedUrl && !currentSlide && (
                  <img
                    src={presentationData.slides[activeSlideIndex].thumbnailUrl}
                    alt={`Slide ${activeSlideIndex + 1}`}
                    className="max-h-full max-w-full"
                  />
                )}
                
                {isSharing && !embedUrl && !currentSlide && !presentationData && (
                  <div className="text-white">Screen sharing active...</div>
                )}
                
                {!isSharing && !embedUrl && !currentSlide && !presentationData && (
                  <div className="text-white opacity-50 flex flex-col items-center">
                    <Presentation className="h-12 w-12 mb-2" />
                    <p>No presentation active</p>
                  </div>
                )}
              </div>
              
              {/* Thumbnails navigation */}
              {presentationData && presentationData.slides.length > 0 && (
                <div className="md:col-span-1">
                  <div className="text-sm font-medium mb-2">Slides</div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {presentationData.slides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={`rounded-md overflow-hidden border-2 cursor-pointer transition-all ${
                          index === activeSlideIndex ? 'border-primary' : 'border-transparent'
                        }`}
                        onClick={() => changeSlide(index)}
                      >
                        <div className="relative">
                          <img
                            src={slide.thumbnailUrl}
                            alt={`Slide ${index + 1}`}
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation buttons for presentation */}
            {presentationData && presentationData.slides.length > 0 && (
              <div className="flex justify-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeSlide(activeSlideIndex - 1)}
                  disabled={activeSlideIndex <= 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeSlide(activeSlideIndex + 1)}
                  disabled={activeSlideIndex >= presentationData.slides.length - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Chat Panel (Shown conditionally) */}
      {isChatOpen && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Class Chat</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${
                          message.student.id === 'professor' ? 'justify-end' : ''
                        }`}
                      >
                        {message.student.id !== 'professor' && (
                          <Avatar>
                            <AvatarImage
                              src={message.student.avatar || ""}
                              alt={message.student.name}
                            />
                            <AvatarFallback>
                              {message.student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[75%] ${
                            message.student.id === 'professor'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-2 mb-1">
                            <p className="text-xs font-medium">
                              {message.student.name}
                            </p>
                          </div>
                          <p>{message.text}</p>
                        </div>
                        {message.student.id === 'professor' && (
                          <Avatar>
                            <AvatarImage
                              src={message.student.avatar || ""}
                              alt={message.student.name}
                            />
                            <AvatarFallback>
                              {message.student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSendMessage()
                    }
                  }}
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 