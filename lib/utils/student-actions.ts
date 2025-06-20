import { 
  StudentActionType, 
  ScoreManagementPayload, 
  StudentIdentificationPayload,
  ActionConfiguration 
} from "@/types/student-actions";
import { EnhancedFaceData } from "@/types/lecture-room";

/**
 * Default action configuration values
 */
export const DEFAULT_ACTION_CONFIG: ActionConfiguration = {
  pointValues: {
    correctAnswer: 10,
    participation: 5,
    attention: 3,
    penalty: -5
  },
  allowCustomPoints: true,
  maxCustomPoints: 20,
  requireConfirmation: true
};

/**
 * Validates points for score management
 */
export function validatePointValue(
  points: number, 
  actionType: 'award' | 'deduct',
  config: ActionConfiguration = DEFAULT_ACTION_CONFIG
): { isValid: boolean; error?: string } {
  if (actionType === 'award' && points <= 0) {
    return { isValid: false, error: "Award points must be positive" };
  }
  
  if (actionType === 'deduct' && points >= 0) {
    return { isValid: false, error: "Deduct points must be negative" };
  }
  
  const absolutePoints = Math.abs(points);
  if (absolutePoints > config.maxCustomPoints) {
    return { 
      isValid: false, 
      error: `Points cannot exceed ${config.maxCustomPoints}` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validates student identification payload
 */
export function validateIdentificationPayload(
  payload: StudentIdentificationPayload
): { isValid: boolean; error?: string } {
  if (!payload.personId || payload.personId.trim() === '') {
    return { isValid: false, error: "Person ID is required" };
  }
  
  if (!payload.studentId || payload.studentId.trim() === '') {
    return { isValid: false, error: "Student ID is required" };
  }
  
  if (!payload.lectureId || payload.lectureId.trim() === '') {
    return { isValid: false, error: "Lecture ID is required" };
  }
  
  if (payload.confidence < 0 || payload.confidence > 1) {
    return { isValid: false, error: "Confidence must be between 0 and 1" };
  }
  
  const { boundingBox } = payload;
  if (!boundingBox || 
      boundingBox.x < 0 || boundingBox.x > 1 ||
      boundingBox.y < 0 || boundingBox.y > 1 ||
      boundingBox.width <= 0 || boundingBox.width > 1 ||
      boundingBox.height <= 0 || boundingBox.height > 1) {
    return { isValid: false, error: "Invalid bounding box coordinates" };
  }
  
  return { isValid: true };
}

/**
 * Generates action reason based on face data and action type
 */
export function generateActionReason(
  actionType: StudentActionType,
  faceData: EnhancedFaceData,
  customReason?: string
): string {
  if (customReason) {
    return customReason;
  }
  
  switch (actionType) {
    case 'score_award':
      const isHandRaised = faceData.hand_raising_status?.is_hand_raised;
      const attentionStatus = faceData.attention_status;
      return `Manual award - ${attentionStatus} attention${isHandRaised ? ', hand raised' : ''}`;
    
    case 'score_deduct':
      return `Manual penalty - ${faceData.attention_status} attention`;
    
    case 'identify':
      return `Manual identification - ${faceData.recognition_status} face`;
    
    case 'attendance_override':
      return `Manual attendance override`;
    
    case 'manual_note':
      return `Instructor note during lecture`;
    
    default:
      return `Manual action: ${actionType}`;
  }
}

/**
 * Formats action details for storage
 */
export function formatActionDetails(
  actionType: StudentActionType,
  faceData: EnhancedFaceData,
  additionalData?: Record<string, any>
): Record<string, any> {
  const baseDetails = {
    actionType,
    timestamp: new Date().toISOString(),
    faceData: {
      personId: faceData.person_id,
      recognitionStatus: faceData.recognition_status,
      attentionStatus: faceData.attention_status,
      boundingBox: faceData.bounding_box,
      confidence: faceData.confidence
    }
  };
  
  // Add hand raising info if available
  if (faceData.hand_raising_status) {
    baseDetails.faceData.handRaising = {
      isRaised: faceData.hand_raising_status.is_hand_raised,
      confidence: faceData.hand_raising_status.confidence
    };
  }
  
  // Add attention metrics if available
  if (faceData.attentionMetrics) {
    baseDetails.faceData.attentionMetrics = faceData.attentionMetrics;
  }
  
  // Merge with additional data
  return { ...baseDetails, ...additionalData };
}

/**
 * Determines if an action requires confirmation
 */
export function requiresConfirmation(
  actionType: StudentActionType,
  points?: number,
  config: ActionConfiguration = DEFAULT_ACTION_CONFIG
): boolean {
  if (!config.requireConfirmation) {
    return false;
  }
  
  // High point awards always require confirmation
  if (points && Math.abs(points) >= 10) {
    return true;
  }
  
  // Penalties always require confirmation
  if (actionType === 'score_deduct') {
    return true;
  }
  
  // Identification requires confirmation
  if (actionType === 'identify') {
    return true;
  }
  
  return false;
}

/**
 * Gets suggested point values based on action context
 */
export function getSuggestedPointValues(
  faceData: EnhancedFaceData,
  config: ActionConfiguration = DEFAULT_ACTION_CONFIG
): number[] {
  const isHandRaised = faceData.hand_raising_status?.is_hand_raised;
  const isFocused = faceData.attention_status === 'focused';
  
  if (isHandRaised && isFocused) {
    return [config.pointValues.correctAnswer, config.pointValues.participation, 3];
  } else if (isHandRaised) {
    return [config.pointValues.participation, 3, 1];
  } else if (isFocused) {
    return [config.pointValues.attention, 2, 1];
  } else {
    return [2, 1, config.pointValues.penalty];
  }
}

/**
 * Creates a score management payload
 */
export function createScorePayload(
  studentId: string,
  lectureId: string,
  points: number,
  reason: string
): ScoreManagementPayload {
  return {
    studentId,
    lectureId,
    points,
    actionType: points > 0 ? 'award' : 'deduct',
    reason,
    timestamp: new Date()
  };
}

/**
 * Creates a student identification payload
 */
export function createIdentificationPayload(
  faceData: EnhancedFaceData,
  studentId: string,
  lectureId: string,
  frameData?: string
): StudentIdentificationPayload {
  return {
    personId: faceData.person_id,
    studentId,
    lectureId,
    frameData,
    boundingBox: faceData.bounding_box,
    confidence: faceData.confidence
  };
} 