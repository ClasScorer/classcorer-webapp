export interface Deadzone {
  id: string;
  professorId: string;
  coordinates: { x: number; y: number; width: number; height: number }[]; // Change to an array
  originalImage: string;
  modifiedImage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CameraViewProps {
  isEditing: boolean;
  onSave: (deadzone: Omit<Deadzone, 'id' | 'professorId' | 'createdAt' | 'updatedAt'>) => void;
  currentDeadzone?: Deadzone;
}

// Database types
export type { User, Course, Student, Lecture } from '../lib/data';

// Auth types 
export type { AuthResult, LoginFormData, SignupFormData } from './auth';

// Lecture room types
export type { 
  LectureRoomProps, 
  FaceData, 
  EnhancedFaceData, 
  FaceDetectionResponse, 
  EnhancedFaceDetectionResponse 
} from './lecture-room';

// Student actions types
export type {
  StudentActionType,
  ActionStatus,
  ClickPosition,
  CanvasClickPosition,
  StudentAction,
  ActionMenuState,
  ClickDetectionResult,
  StudentIdentificationPayload,
  ScoreManagementPayload,
  ActionAuditLog,
  PersonStudentMapping,
  ActionConfiguration
} from './student-actions';