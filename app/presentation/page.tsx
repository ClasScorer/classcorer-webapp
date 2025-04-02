"use client"

import SlidesPopup from "@/app/components/slides-popup"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function PresentationContent() {
  // Always show the slides content since this is a dedicated display page
  const [isOpen, setIsOpen] = useState(true)
  const searchParams = useSearchParams()
  
  // Get parameters from URL
  const lectureId = searchParams.get('lectureId')
  const presentationId = searchParams.get('presentationId')
  const embedUrl = searchParams.get('embedUrl')
  const sessionId = searchParams.get('sessionId')
  
  // Handle window close (mainly for development/testing)
  const handleClose = () => {
    if (window.opener) {
      window.close()
    } else {
      setIsOpen(false)
    }
  }
  
  // Set up fullscreen capability for presentation mode
  useEffect(() => {
    // Function to toggle fullscreen
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    };

    // Listen for F11 or Ctrl+F to toggle fullscreen
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11' || (event.key === 'f' && event.ctrlKey)) {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    // Auto-fullscreen option
    setTimeout(() => {
      try {
        toggleFullscreen();
      } catch (err) {
        console.log("Could not auto-enter fullscreen mode");
      }
    }, 1000);

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {/* Use the SlidesPopup component but modify it to be a full page rather than a modal */}
      <SlidesPopup 
        isOpen={isOpen}
        onClose={handleClose}
        className="!bg-transparent !backdrop-blur-none" // Remove modal styling
        // Pass presentation parameters if your SlidesPopup supports them
        presentationId={presentationId || undefined}
        lectureId={lectureId || undefined}
        embedUrl={embedUrl || undefined}
      />
      
      {/* Only show if closed (should rarely happen) */}
      {!isOpen && (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-4">Presentation Display</h1>
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            onClick={() => setIsOpen(true)}
          >
            Show Presentation
          </button>
        </div>
      )}
    </div>
  )
}

export default function PresentationPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background">Loading presentation...</div>}>
      <PresentationContent />
    </Suspense>
  )
}
