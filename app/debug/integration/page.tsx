'use client';

import { useState, useRef, useEffect } from 'react';
import { WebSocketProvider, useWebSocket } from '@/contexts/WebSocketContext';

function CameraCanvas() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [faces, setFaces] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSendingFrames, setIsSendingFrames] = useState(false);
  const frameInterval = useRef<NodeJS.Timeout | null>(null);
  const { sendImageToAPI, isConnected } = useWebSocket();
  const [mockLectureId, setMockLectureId] = useState('mock-lecture-123');

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

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-xl">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mock Lecture ID:
        </label>
        <input
          type="text"
          value={mockLectureId}
          onChange={(e) => setMockLectureId(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full mb-4"
        />
      </div>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={startWebcam}
          disabled={isStreaming}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Start Camera
        </button>
        <button
          onClick={stopWebcam}
          disabled={!isStreaming}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          Stop Camera
        </button>
        <button
          onClick={toggleSendFrames}
          disabled={!isStreaming}
          className={`px-4 py-2 text-white rounded disabled:bg-gray-400 ${
            isSendingFrames ? 'bg-yellow-500' : 'bg-green-500'
          }`}
        >
          {isSendingFrames ? 'Stop Sending' : 'Start Sending'}
        </button>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      
      <div className="relative">
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
          className="border border-gray-300"
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
      </div>
      
      {summary && (
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
      )}
      
      <div className="mt-4 w-full max-w-3xl">
        <h2 className="text-xl font-semibold">Detection Results</h2>
        <pre className="bg-gray-100 p-2 rounded mt-2 max-h-60 overflow-auto text-xs">
          {JSON.stringify(faces, null, 2) || "No faces detected yet"}
        </pre>
      </div>
    </div>
  );
}

export default function DebugIntegration() {
  return (
    <WebSocketProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Debug Integration</h1>
        <CameraCanvas />
      </div>
    </WebSocketProvider>
  );
}