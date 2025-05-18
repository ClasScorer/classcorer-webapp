"use client"

import { useState } from "react"
import { LectureRoomProps } from "@/types/lecture-room"
import { useCameraStream } from "@/hooks/lecture-room/useCameraStream"
import { useFaceDetection } from "@/hooks/lecture-room/useFaceDetection"
import { useLectureManagement } from "@/hooks/lecture-room/useLectureManagement"
import { usePresentationManager } from "@/hooks/lecture-room/usePresentationManager"
import { useChatManager } from "@/hooks/lecture-room/useChatManager"
import { useLectureEvents } from "@/hooks/lecture-room/useLectureEvents"
import { ControlPanel } from "./ControlPanel"
import { VideoFeed } from "./VideoFeed"
import { DetectionAnalysis } from "./DetectionAnalysis"
import { PresentationPanel } from "./PresentationPanel"
import { ChatPanel } from "./ChatPanel"
import { DeleteLectureDialog } from "./DeleteLectureDialog"
import { useEffect } from "react"

export function LectureRoom({ course, students }: LectureRoomProps) {
  // Use camera stream hook
  const {
    isVideoOn,
    toggleVideo,
    videoRef,
    streamRef
  } = useCameraStream()
  
  // Audio state
  const [isAudioOn, setIsAudioOn] = useState(false)
  
  // Handle audio toggle
  const toggleAudio = async () => {
    try {
      if (!isAudioOn) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // We need to merge with the existing stream if it exists
        if (streamRef.current) {
          stream.getTracks().forEach(track => {
            if (streamRef.current) {
              streamRef.current.addTrack(track)
            }
          })
        }
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
  
  // Use lecture management hook
  const lecture = useLectureManagement({
    courseId: course.id
  })
  
  // Use face detection hook
  const detection = useFaceDetection({
    videoRef,
    isVideoOn,
    lectureId: lecture.lectureId,
    students
  })
  
  // Use presentation manager hook
  const presentation = usePresentationManager()
  
  // Use chat manager hook
  const chat = useChatManager({
    course
  })
  
  // Use lecture events hook
  const events = useLectureEvents({
    lectureId: lecture.lectureId,
    students
  })
  
  // Process face detection results to generate events
  useEffect(() => {
    if (detection.faceData && detection.faceData.faces) {
      events.processFaceDetectionUpdate(detection.faceData.faces)
    }
  }, [detection.faceData, events])
  
  // Send events to the backend to be shared with presentation viewers
  useEffect(() => {
    async function sendEventsToBackend() {
      if (!lecture.lectureId || events.events.length === 0) return
      
      try {
        // Take only the 10 most recent events that haven't been sent yet
        const recentEvents = events.events.slice(0, 10)
        
        // Send events one by one to the backend
        for (const event of recentEvents) {
          await fetch(`/api/lectures/${lecture.lectureId}/events`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ event })
          })
        }
      } catch (error) {
        console.error('Error sending events to backend:', error)
      }
    }
    
    // Set up an interval to send events periodically
    const interval = setInterval(sendEventsToBackend, 2000)
    
    return () => clearInterval(interval)
  }, [lecture.lectureId, events.events])
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
        {/* Left panel - Controls */}
        <div className="lg:col-span-2 space-y-4">
          <ControlPanel
            lectureStarted={lecture.lectureStarted}
            lectureStartTime={lecture.lectureStartTime}
            elapsedSeconds={lecture.elapsedSeconds}
            durationMinutes={lecture.durationMinutes}
            isPaused={lecture.isPaused}
            isVideoOn={isVideoOn}
            isAudioOn={isAudioOn}
            isDetecting={detection.isDetecting}
            isLoading={lecture.isLoading}
            isDeletingLecture={lecture.isDeletingLecture}
            lectureId={lecture.lectureId}
            scheduleTime={lecture.scheduleTime}
            useScheduledTime={lecture.useScheduledTime}
            toggleVideo={toggleVideo}
            toggleAudio={toggleAudio}
            startFaceDetection={detection.startFaceDetection}
            stopFaceDetection={detection.stopFaceDetection}
            simulateDetection={detection.simulateDetection}
            startNewLecture={lecture.startNewLecture}
            endLecture={lecture.endLecture}
            confirmDeleteLecture={lecture.confirmDeleteLecture}
            toggleStopwatch={lecture.toggleStopwatch}
            setDurationMinutes={lecture.setDurationMinutes}
            setScheduleTime={lecture.setScheduleTime}
            setUseScheduledTime={lecture.setUseScheduledTime}
          />
        </div>
        
        {/* Video and Detection Results */}
        <div className="lg:col-span-10">
          <VideoFeed
            videoRef={videoRef}
            displayCanvasRef={detection.displayCanvasRef}
            detectionCanvasRef={detection.detectionCanvasRef}
            isVideoOn={isVideoOn}
            faceData={detection.faceData}
            students={students}
          />
        </div>
      </div>
      
      {/* Enhanced Detection Section */}
      <div className="p-4">
        <DetectionAnalysis
          faceData={detection.faceData}
          lectureStarted={lecture.lectureStarted}
          students={students}
        />
      </div>
      
      {/* Enhanced Slides Section */}
      <div className="p-4">
        <PresentationPanel
          presentationUrl={presentation.presentationUrl}
          embedUrl={presentation.embedUrl}
          currentSlide={presentation.currentSlide}
          isLoadingSlides={presentation.isLoadingSlides}
          isSharing={presentation.isSharing}
          presentationData={presentation.presentationData}
          activeSlideIndex={presentation.activeSlideIndex}
          lectureId={lecture.lectureId}
          activityEvents={events.events}
          handlePresentationUrl={presentation.handlePresentationUrl}
          handleSlideUpload={presentation.handleSlideUpload}
          changeSlide={presentation.changeSlide}
          openPresentationDisplay={presentation.openPresentationDisplay}
        />
      </div>
      
      {/* Chat Panel */}
      <div className="p-4">
        <ChatPanel
          isChatOpen={chat.isChatOpen}
          messages={chat.messages}
          messageInput={chat.messageInput}
          setIsChatOpen={chat.setIsChatOpen}
          setMessageInput={chat.setMessageInput}
          handleSendMessage={chat.handleSendMessage}
        />
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DeleteLectureDialog
        isOpen={lecture.isDeleteDialogOpen}
        onOpenChange={lecture.setIsDeleteDialogOpen}
        onDelete={() => lecture.lectureId && lecture.deleteLecture(lecture.lectureId)}
        isDeleting={lecture.isDeletingLecture}
      />
    </div>
  )
}

// Export as default for easier import
export default LectureRoom; 