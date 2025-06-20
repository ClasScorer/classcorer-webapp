import { EnhancedFaceData } from "./lecture-room";

// Core action types
export type StudentActionType = 
  | 'identify' 
  | 'score_award' 
  | 'score_deduct' 
  | 'attendance_override'
  | 'manual_note';

export type ActionStatus = 'pending' | 'completed' | 'failed';

// Click position interface
export interface ClickPosition {
  x: number;
  y: number;
}

// Enhanced click position with canvas coordinates
export interface CanvasClickPosition extends ClickPosition {
  canvasX: number;
  canvasY: number;
  timestamp: number;
}

// Student action record for database
export interface StudentAction {
  id: string;
  type: StudentActionType;
  studentId: string;
  lectureId: string;
  points?: number;
  reason?: string;
  details: Record<string, any>;
  timestamp: Date;
  instructorId: string;
  status: ActionStatus;
}

// Action menu state
export interface ActionMenuState {
  isOpen: boolean;
  position: ClickPosition;
  targetFace: EnhancedFaceData | null;
  targetStudentId?: string;
}

// Click detection result
export interface ClickDetectionResult {
  face: EnhancedFaceData | null;
  position: CanvasClickPosition;
  isValidClick: boolean;
}

// Student identification payload
export interface StudentIdentificationPayload {
  personId: string;
  studentId: string;
  lectureId: string;
  frameData?: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

// Score management payload
export interface ScoreManagementPayload {
  studentId: string;
  lectureId: string;
  points: number;
  actionType: 'award' | 'deduct';
  reason: string;
  timestamp: Date;
}

// Action audit log entry
export interface ActionAuditLog {
  id: string;
  lectureId: string;
  action: StudentActionType;
  studentId: string;
  instructorId: string;
  details: Record<string, any>;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

// Person-to-student mapping
export interface PersonStudentMapping {
  id: string;
  personId: string;
  studentId: string;
  lectureId: string;
  confidence: number;
  frameData?: string;
  createdAt: Date;
  verified: boolean;
}

// Action configuration
export interface ActionConfiguration {
  pointValues: {
    correctAnswer: number;
    participation: number;
    attention: number;
    penalty: number;
  };
  allowCustomPoints: boolean;
  maxCustomPoints: number;
  requireConfirmation: boolean;
} 