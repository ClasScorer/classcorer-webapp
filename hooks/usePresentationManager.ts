import { useState, useCallback } from "react"
import { toast } from "sonner"
import { PresentationData, SlideData } from "@/types/lecture-room"

interface UsePresentationManagerResult {
  presentationUrl: string
  embedUrl: string
  currentSlide: string | null
  isLoadingSlides: boolean
  isSharing: boolean
  presentationData: PresentationData | null
  activeSlideIndex: number
  slideThumbnails: string[]
  handlePresentationUrl: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSlideUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  changeSlide: (index: number) => void
  toggleScreenShare: () => Promise<void>
  openPresentationDisplay: (lectureId: string | null) => void
}

export function usePresentationManager(): UsePresentationManagerResult {
  // Presentation state
  const [presentationUrl, setPresentationUrl] = useState<string>("")
  const [embedUrl, setEmbedUrl] = useState<string>("")
  const [currentSlide, setCurrentSlide] = useState<string | null>(null)
  const [isLoadingSlides, setIsLoadingSlides] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  
  // Enhanced slides state
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [slideThumbnails, setSlideThumbnails] = useState<string[]>([])

  // Enhanced function to handle Google Slides integration
  const handlePresentationUrl = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [])

  // Function to change slides
  const changeSlide = useCallback((index: number) => {
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
  }, [presentationData])

  // Handle screen sharing
  const toggleScreenShare = useCallback(async () => {
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
        
        // Listen for when user stops sharing through browser controls
        stream.getVideoTracks()[0].onended = () => {
          setIsSharing(false)
        }
        
        setIsSharing(true)
        toast.success("Screen sharing started")
      } else {
        setIsSharing(false)
        toast.info("Screen sharing stopped")
      }
    } catch (error) {
      console.error('Error sharing screen:', error)
      toast.error(`Failed to share screen: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsSharing(false)
    }
  }, [isSharing])

  // Handle slide upload
  const handleSlideUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentSlide(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Function to open presentation in a new window
  const openPresentationDisplay = useCallback((lectureId: string | null) => {
    // Generate a unique session ID for this presentation window
    const sessionId = Date.now().toString()
    
    // Construct URL with presentation data
    let url = `/presentation?`
    if (presentationData) {
      url += `presentationId=${presentationData.id}&`
    }
    if (embedUrl) {
      url += `embedUrl=${encodeURIComponent(embedUrl)}&`
    }
    if (lectureId) {
      url += `lectureId=${lectureId}&`
    }
    url += `sessionId=${sessionId}`
    
    // Open in a new window
    window.open(
      url, 
      'presentationWindow', 
      'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800'
    )
    
    toast.success("Presentation opened in new window")
  }, [presentationData, embedUrl])

  return {
    presentationUrl,
    embedUrl,
    currentSlide,
    isLoadingSlides,
    isSharing,
    presentationData,
    activeSlideIndex,
    slideThumbnails,
    handlePresentationUrl,
    handleSlideUpload,
    changeSlide,
    toggleScreenShare,
    openPresentationDisplay
  }
} 