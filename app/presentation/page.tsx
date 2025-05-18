"use client"

import SlidesPopup from "@/app/components/slides-popup"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ActivityEvent } from "@/hooks/lecture-room/useLectureEvents"

function PresentationContent() {
  // Always show the slides content since this is a dedicated display page
  const [isOpen, setIsOpen] = useState(true)
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([])
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
  
  // Poll for lecture events
  useEffect(() => {
    if (!lectureId) return;
    
    // Function to fetch the latest events
    async function fetchEvents() {
      try {
        const response = await fetch(`/api/lectures/${lectureId}/events?since=${new Date().toISOString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.events && data.events.length > 0) {
            // Add new events to our list
            setActivityEvents(prev => {
              // Combine events, ensuring they're unique by ID
              const newEvents = [...data.events.map((event: any) => ({
                ...event,
                timestamp: new Date(event.timestamp)
              })), ...prev];
              
              // Filter duplicates by ID and sort by timestamp (newest first)
              const uniqueEvents = Array.from(
                new Map(newEvents.map(event => [event.id, event])).values()
              ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
              
              // Limit to 100 events to prevent excessive memory usage
              return uniqueEvents.slice(0, 100);
            });
          }
        }
      } catch (error) {
        console.error("Error fetching lecture events:", error);
      }
    }
    
    // Poll for events every 2 seconds
    const interval = setInterval(fetchEvents, 2000);
    
    // Initial fetch
    fetchEvents();
    
    return () => clearInterval(interval);
  }, [lectureId]);
  
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
    <div className="min-h-screen">
      <SlidesPopup 
        isOpen={isOpen} 
        onClose={handleClose}
        presentationId={presentationId || undefined}
        lectureId={lectureId || undefined}
        embedUrl={embedUrl || undefined}
        activityEvents={activityEvents}
      />
    </div>
  );
}

export default function PresentationPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background">Loading presentation...</div>}>
      <PresentationContent />
    </Suspense>
  )
}
