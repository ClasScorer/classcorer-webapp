"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Camera, Presentation, Mic, MicOff, Video, VideoOff, Share2, MessageSquare, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Course, Student } from "@/lib/data"

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

export function LectureRoom({ course, students }: LectureRoomProps) {
  // State for video/audio controls
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isAudioOn, setIsAudioOn] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState("")

  // Refs for media elements
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Slides state
  const [presentationUrl, setPresentationUrl] = useState<string>("")
  const [embedUrl, setEmbedUrl] = useState<string>("")

  // New state for coordinates
  const [coordinates, setCoordinates] = useState<Coordinate[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Handle presentation URL change
  const handlePresentationUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setPresentationUrl(url)
    
    try {
      const id = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
      if (id) {
        setEmbedUrl(`https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`)
      }
    } catch (error) {
      console.error("Error processing URL:", error)
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
          email: course.instructor || '',
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

  // Function to fetch coordinates
  const fetchCoordinates = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/localize-coords', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Received coordinates:', data)
      
      // Extract bounding boxes from response
      const boxes = data.bounding_boxes || []
      setCoordinates(boxes)
    } catch (error) {
      console.error('Error fetching coordinates:', error)
      setCoordinates([]) // Reset coordinates on error
    }
  }, [])

  // Function to draw bounding boxes
  const drawBoundingBoxes = useCallback(() => {
    if (!canvasRef.current || !coordinates.length || !videoRef.current) {
      return
    }

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    // Get the container dimensions
    const container = canvas.parentElement
    if (!container) return

    // Set canvas dimensions to match container
    const rect = container.getBoundingClientRect()
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    // Clear the entire canvas
    context.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw bounding boxes
    coordinates.forEach(coord => {
      // Save the current context state
      context.save()
      
      // Scale coordinates to match canvas size
      const scaleX = canvas.width / videoRef.current!.videoWidth
      const scaleY = canvas.height / videoRef.current!.videoHeight
      
      const x = coord.x_min * scaleX
      const y = coord.y_min * scaleY
      const width = (coord.x_max - coord.x_min) * scaleX
      const height = (coord.y_max - coord.y_min) * scaleY
      
      // Set styles for box
      context.strokeStyle = 'red'
      context.lineWidth = 4
      
      // Draw box
      context.strokeRect(x, y, width, height)
      
      // Set styles for label
      context.fillStyle = 'red'
      context.font = 'bold 24px Arial'
      
      // Draw label with background
      const label = `Person ${coord.human_id} (${Math.round(coord.score * 100)}%)`
      const labelWidth = context.measureText(label).width
      
      // Draw label background
      context.fillStyle = 'rgba(0, 0, 0, 0.8)'
      context.fillRect(x, y - 30, labelWidth + 10, 30)
      
      // Draw label text
      context.fillStyle = 'red'
      context.fillText(
        label,
        x + 5,
        y - 8
      )
      
      // Restore the context state
      context.restore()
    })
  }, [coordinates])

  // Function to capture and send frame
  const captureAndSendFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isVideoOn) return

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    // Get the container dimensions
    const container = canvas.parentElement
    if (!container) return

    // Set canvas dimensions to match container
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Draw the current frame on canvas
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    try {
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg')
      )

      // Send to backend
      const formData = new FormData()
      formData.append('file', blob)

      await fetch('http://localhost:8000/localize-image/', {
        method: 'POST',
        body: formData,
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      })

      // Fetch coordinates immediately after sending frame
      await fetchCoordinates()
      
      // Draw boxes immediately after getting coordinates
      drawBoundingBoxes()
    } catch (error) {
      console.error('Error sending frame:', error)
    }
  }, [isVideoOn, fetchCoordinates, drawBoundingBoxes])

  // Set up interval for capture and continuous drawing
  useEffect(() => {
    if (!isVideoOn) return

    // Initial capture
    captureAndSendFrame()
    
    // Set up interval for subsequent captures
    const captureInterval = setInterval(captureAndSendFrame, 1000)

    // Set up a more frequent interval for redrawing boxes
    const drawInterval = setInterval(() => {
      if (coordinates.length > 0) {
        drawBoundingBoxes()
      }
    }, 16) // ~60fps for smooth rendering

    return () => {
      clearInterval(captureInterval)
      clearInterval(drawInterval)
    }
  }, [isVideoOn, captureAndSendFrame, drawBoundingBoxes, coordinates])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{course.name}</h2>
          <p className="text-muted-foreground">Live Lecture Session - {course.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleScreenShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {isSharing ? 'Stop Sharing' : 'Share Screen'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button variant="destructive" size="sm">End Session</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Camera Feed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {isSharing ? 'Screen Share' : 'Camera Feed'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant={isVideoOn ? "default" : "ghost"} 
                  size="icon"
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button 
                  variant={isAudioOn ? "default" : "ghost"} 
                  size="icon"
                  onClick={toggleAudio}
                >
                  {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ 
                    display: isVideoOn || isSharing ? 'block' : 'none',
                    transform: 'scaleX(-1)',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    display: isVideoOn ? 'block' : 'none',
                    transform: 'scaleX(-1)',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 2,
                    pointerEvents: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
                {!isVideoOn && !isSharing && (
                  <Camera className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Slides */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Presentation Slides</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Paste Google Slides URL"
                  className="w-[300px]"
                  onChange={handlePresentationUrl}
                  value={presentationUrl}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    width="100%"
                    height="100%"
                    allowFullScreen
                    className="border-0"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Presentation className="h-12 w-12" />
                    <p className="text-sm">Paste a Google Slides URL to begin</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Students</span>
                <Badge variant="secondary">{students.length} Online</Badge>
              </CardTitle>
              <CardDescription>Real-time student tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.status === 'Excellent' ? 'Active' : 
                             student.status === 'Good' ? 'Away' : 'Inactive'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <VideoOff className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MicOff className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat */}
          {isChatOpen && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-medium">Chat</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] mb-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.student.avatar} />
                          <AvatarFallback>
                            {message.student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{message.student.name}</div>
                          <div className="text-sm bg-accent rounded-lg p-2">
                            {message.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>Send</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 