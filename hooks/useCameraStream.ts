import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"

interface UseCameraStreamResult {
  isVideoOn: boolean
  toggleVideo: () => Promise<void>
  videoRef: React.RefObject<HTMLVideoElement>
  streamRef: React.RefObject<MediaStream | null>
}

export function useCameraStream(): UseCameraStreamResult {
  const [isVideoOn, setIsVideoOn] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Clean up the stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Handle camera toggle
  const toggleVideo = async () => {
    try {
      if (!isVideoOn) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 },
          audio: false
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream
          videoRef.current.play()
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
      toast.error(`Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsVideoOn(false)
    }
  }

  return {
    isVideoOn,
    toggleVideo,
    videoRef,
    streamRef
  }
} 