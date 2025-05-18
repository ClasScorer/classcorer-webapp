'use client';

import { useState, useRef, useEffect } from 'react';
import { WebSocketProvider, useWebSocket } from '@/contexts/WebSocketContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Bug, Presentation, MonitorIcon } from "lucide-react";
import { toast } from "sonner";

// Add interface for slide management
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

function CameraCanvas() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [faces, setFaces] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSendingFrames, setIsSendingFrames] = useState(false);
  const frameInterval = useRef<NodeJS.Timeout | null>(null);
  const { sendImageToAPI, isConnected } = useCustomWebSocket();
  const [mockLectureId, setMockLectureId] = useState('mock-lecture-123');

  // Add slides state
  const [presentationUrl, setPresentationUrl] = useState<string>("");
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const [currentSlide, setCurrentSlide] = useState<string | null>(null);
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideThumbnails, setSlideThumbnails] = useState<string[]>([]);
  const [isLoadingSlides, setIsLoadingSlides] = useState(false);

  // Start the webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error starting webcam:', err);
      setError('Failed to access webcam. Please check permissions.');
    }
  };

  // Stop the webcam
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      stopSendingFrames();
    }
  };

  // Toggle sending frames to the gateway
  const toggleSendFrames = () => {
    if (isSendingFrames) {
      stopSendingFrames();
    } else {
      startSendingFrames();
    }
  };

  // Start sending frames to gateway
  const startSendingFrames = () => {
    if (!isStreaming) return;
    
    setIsSendingFrames(true);
    
    // Send frames at 5 FPS (200ms interval)
    frameInterval.current = setInterval(() => {
      captureAndSendFrame();
    }, 200);
  };

  // Stop sending frames
  const stopSendingFrames = () => {
    if (frameInterval.current) {
      clearInterval(frameInterval.current);
      frameInterval.current = null;
    }
    setIsSendingFrames(false);
  };

  // Capture frame and send via API
  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Draw the current video frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to base64 image
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Send the image data to the API
      const response = await sendImageToAPI(imageData, mockLectureId);
      
      if (response) {
        // Update state with faces from response
        setFaces(response.faces || []);
        setSummary(response.summary || null);
      }
    } catch (err) {
      console.error('Error capturing or sending frame:', err);
      stopSendingFrames();
    }
  };

  // Draw faces on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !isStreaming) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const drawFaces = () => {
      // Always redraw the video first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        videoRef.current as HTMLVideoElement,
        0, 0,
        canvas.width, canvas.height
      );
      
      // Draw bounding boxes and labels for faces
      faces.forEach(face => {
        const { bounding_box: bbox, person_id, recognition_status, confidence, attention_status, hand_raising_status } = face;
        
        if (bbox) {
          // Color based on attention status
          const color = attention_status === "FOCUSED" ? '#00FF00' : '#FF0000';
          
          // Draw bounding box
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            bbox.x * canvas.width,
            bbox.y * canvas.height,
            bbox.width * canvas.width,
            bbox.height * canvas.height
          );
          
          // Draw hand raising indicator if hand is raised
          if (hand_raising_status && hand_raising_status.is_hand_raised) {
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(
              (bbox.x + bbox.width) * canvas.width - 10,
              bbox.y * canvas.height + 10,
              8,
              0,
              2 * Math.PI
            );
            ctx.fill();
          }
          
          // Draw label
          ctx.fillStyle = color;
          ctx.font = '14px Arial';
          
          const label = recognition_status === "known" 
            ? `Person ${person_id} (${Math.round(confidence * 100)}%)`
            : `New (${Math.round(confidence * 100)}%)`;
            
          ctx.fillText(
            label,
            bbox.x * canvas.width,
            bbox.y * canvas.height - 5
          );
        }
      });
      
      requestAnimationFrame(drawFaces);
    };
    
    const animationFrame = requestAnimationFrame(drawFaces);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [faces, isStreaming, isSendingFrames]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  // Handle presentation URL
  const handlePresentationUrl = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPresentationUrl(url);
    
    try {
      const id = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (id) {
        setIsLoadingSlides(true);
        setEmbedUrl(`https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`);
        
        // Generate mock slide thumbnails
        const mockThumbnails = Array.from({ length: 5 }, (_, i) => 
          `https://picsum.photos/id/${i + 10}/400/300`
        );
        setSlideThumbnails(mockThumbnails);
        
        // Mock presentation data
        setPresentationData({
          id,
          title: "Debug Presentation",
          slides: mockThumbnails.map((url, index) => ({
            id: `slide-${index}`,
            title: `Slide ${index + 1}`,
            thumbnailUrl: url,
            index,
            current: index === 0
          }))
        });
        
        setIsLoadingSlides(false);
      }
    } catch (error) {
      console.error("Error processing URL:", error);
      setIsLoadingSlides(false);
    }
  };

  // Function to change slides
  const changeSlide = (index: number) => {
    if (presentationData && index >= 0 && index < presentationData.slides.length) {
      setActiveSlideIndex(index);
      // Update current status in slides
      setPresentationData({
        ...presentationData,
        slides: presentationData.slides.map((slide, i) => ({
          ...slide,
          current: i === index
        }))
      });
    }
  };

  // Handle slide upload
  const handleSlideUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentSlide(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to open presentation in a new window
  const openPresentationDisplay = () => {
    // Generate a unique session ID for this presentation window
    const sessionId = Date.now().toString();
    
    // Construct URL with presentation data
    let url = `/presentation?`;
    if (presentationData) {
      url += `presentationId=${presentationData.id}&`;
    }
    if (embedUrl) {
      url += `embedUrl=${encodeURIComponent(embedUrl)}&`;
    }
    if (mockLectureId) {
      url += `lectureId=${mockLectureId}&`;
    }
    url += `sessionId=${sessionId}`;
    
    // Open in a new window
    window.open(
      url, 
      'presentationWindow', 
      'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800'
    );
    
    toast.success("Presentation opened in new window");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
        {/* Left panel - Controls */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Controls</CardTitle>
              <CardDescription className="text-xs">
                Configure test settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="w-full max-w-xl">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mock Lecture ID:
                </label>
                <Input
                  type="text"
                  value={mockLectureId}
                  onChange={(e) => setMockLectureId(e.target.value)}
                  className="p-2 border border-gray-300 rounded w-full mb-4"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant={isStreaming ? "destructive" : "default"}
                  onClick={isStreaming ? stopWebcam : startWebcam}
                  className="w-full"
                >
                  {isStreaming ? "Stop Camera" : "Start Camera"}
                </Button>
                
                <Button
                  variant={isSendingFrames ? "destructive" : "default"}
                  onClick={toggleSendFrames}
                  disabled={!isStreaming}
                  className="w-full"
                >
                  {isSendingFrames ? "Stop Sending" : "Start Sending"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    if (summary) {
                      toast.success("Summary data copied to clipboard");
                      navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
                    } else {
                      toast.error("No summary data available");
                    }
                  }}
                  disabled={!summary}
                  className="w-full"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Copy Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Video and Detection Results */}
        <Card className="lg:col-span-10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Camera Feed</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative overflow-hidden rounded-md bg-gray-100 aspect-video">
              <video 
                ref={videoRef}
                className="hidden"
                width="640"
                height="480"
              />
              <canvas 
                ref={canvasRef}
                width="640"
                height="480"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                {isSendingFrames ? (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Sending
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                    Idle
                  </span>
                )}
              </div>
              
              {!isStreaming && (
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
      </div>
      
      {/* Detection Results */}
      <div className="p-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Detection Analysis</CardTitle>
            <CardDescription className="text-xs">
              Real-time face detection results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!summary ? (
              <div className="text-center py-8">
                <Camera className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-500">Start sending frames to see detection results</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-5 gap-2 w-full max-w-3xl">
                  <div className="bg-blue-100 p-3 rounded text-center">
                    <div className="text-xl font-bold">{summary.total_faces || 0}</div>
                    <div className="text-sm">Total Faces</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded text-center">
                    <div className="text-xl font-bold">{summary.known_faces || 0}</div>
                    <div className="text-sm">Known</div>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded text-center">
                    <div className="text-xl font-bold">{summary.new_faces || 0}</div>
                    <div className="text-sm">New</div>
                  </div>
                  <div className="bg-purple-100 p-3 rounded text-center">
                    <div className="text-xl font-bold">{summary.focused_faces || 0}</div>
                    <div className="text-sm">Focused</div>
                  </div>
                  <div className="bg-orange-100 p-3 rounded text-center">
                    <div className="text-xl font-bold">{summary.hands_raised || 0}</div>
                    <div className="text-sm">Hands Raised</div>
                  </div>
                </div>
                
                {/* Detection Results JSON */}
                <div className="mt-4 w-full max-w-3xl">
                  <h2 className="text-xl font-semibold">Detection Results</h2>
                  <div className="bg-gray-100 p-2 rounded mt-2 max-h-60 overflow-auto text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(faces, null, 2) || "No faces detected yet"}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Slides and Presentation Section */}
      <Card className="m-4">
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
            {!embedUrl && !currentSlide && !presentationData && (
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
                {!embedUrl && !currentSlide && !presentationData && (
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
                        key={`slide-${slide.id}-${index}`}
                        className={`rounded-md overflow-hidden border-2 cursor-pointer transition-all ${index === activeSlideIndex ? 'border-primary' : 'border-transparent'}`}
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
            
            {/* Open presentation in new window */}
            <Button 
              onClick={openPresentationDisplay}
              variant="outline"
              className="flex items-center gap-2 mt-4"
              disabled={!presentationData && !embedUrl}
            >
              <MonitorIcon className="h-4 w-4" />
              Open on Second Screen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DebugIntegration() {
  return (
    <WebSocketProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Debug Integration</h1>
        <CameraCanvas />
      </div>
    </WebSocketProvider>
  );
}

// Add actual implementation of WebSocket context
export function useCustomWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketUrl, setSocketUrl] = useState("wss://api.classcorer.io/ws");
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(socketUrl);
        socket.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connection established");
          setIsConnected(true);
        };

        ws.onclose = () => {
          console.log("WebSocket connection closed");
          setIsConnected(false);
          // Try to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          ws.close();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Received WebSocket message:", data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [socketUrl]);

  // Function to send image data to API
  const sendImageToAPI = async (imageData: string, lectureId: string) => {
    try {
      // Remove data URL prefix to get the base64 string
      const base64Data = imageData.split(',')[1];
      
      // Create payload
      const payload = {
        type: 'frame',
        lecture_id: lectureId,
        image_data: base64Data,
        timestamp: new Date().toISOString()
      };
      
      // Send via WebSocket if connected
      if (socket.current && isConnected) {
        socket.current.send(JSON.stringify(payload));
      }
      
      // Also send via REST API as fallback
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending image to API:', error);
      // Return mock data for testing purposes
      return {
        faces: [
          {
            person_id: "student-123",
            recognition_status: "known",
            confidence: 0.92,
            bounding_box: { x: 0.2, y: 0.2, width: 0.2, height: 0.2 },
            attention_status: "FOCUSED",
            hand_raising_status: { is_hand_raised: Math.random() > 0.7 }
          }
        ],
        summary: {
          total_faces: 1,
          known_faces: 1,
          new_faces: 0,
          focused_faces: 1,
          hands_raised: Math.random() > 0.7 ? 1 : 0
        }
      };
    }
  };

  return { isConnected, sendImageToAPI };
}

export default DebugIntegration;