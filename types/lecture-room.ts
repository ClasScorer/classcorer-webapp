import { Course, Student } from "@/lib/data"

// Google API types
export interface GoogleSlide {
  objectId: string
  slideIndex: number
  thumbnailUrl: string
}

export interface ChatMessage {
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

export interface LectureRoomProps {
  course: Course
  students: Student[]
}

// Add global type declarations for Google API
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

export interface Coordinate {
  human_id: number
  x_min: number
  y_min: number
  x_max: number
  y_max: number
  label: string
  score: number
}

// Types for face detection API response
export interface HandRaising {
  is_hand_raised: boolean;
  confidence: number;
  hand_position: {
    x: number;
    y: number;
  };
}

export interface BoundingBox {
  x: number;
  y: number
  width: number
  height: number
}

export interface FaceData {
  person_id: string
  recognition_status: "new" | "known" | "found" | "unknown"
  // Allow both uppercase and lowercase versions
  attention_status: "focused" | "unfocused" | "FOCUSED" | "UNFOCUSED"
  hand_raising_status: HandRaising
  confidence: number
  bounding_box: BoundingBox
}

export interface FaceDetectionSummary {
  new_faces: number
  known_faces: number
  focused_faces: number
  unfocused_faces: number
  hands_raised: number
}

export interface FaceDetectionResponse {
  lecture_id: string
  timestamp: string
  total_faces: number
  faces: FaceData[]
  summary: FaceDetectionSummary
}

// Enhanced types for slide management
export interface SlideData {
  id: string
  title: string
  thumbnailUrl: string
  index: number
  current: boolean
}

export interface PresentationData {
  id: string
  title: string
  slides: SlideData[]
}

// Enhanced face detection types
export interface AttentionMetrics {
  focusScore: number
  focusDuration: number
  distractionCount: number
  engagementLevel: 'high' | 'medium' | 'low'
}

export interface EnhancedFaceData extends FaceData {
  attentionMetrics?: AttentionMetrics
  name?: string
  lastDetectedAt?: string
  consecutiveFrames?: number
}

export interface EnhancedFaceDetectionResponse extends FaceDetectionResponse {
  classEngagement: number
  timeSeries?: {
    timestamp: string
    focusedPercentage: number
    totalFaces: number
  }[]
  faces: EnhancedFaceData[]
} 