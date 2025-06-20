import { useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  StudentIdentificationPayload, 
  ScoreManagementPayload,
  StudentActionType,
  ActionStatus
} from "@/types/student-actions";
import { EnhancedFaceData } from "@/types/lecture-room";
import { 
  validateIdentificationPayload,
  validatePointValue,
  createScorePayload,
  createIdentificationPayload,
  generateActionReason,
  formatActionDetails
} from "@/lib/utils/student-actions";

interface UseStudentActionsProps {
  lectureId: string;
  onActionComplete?: (actionType: StudentActionType, success: boolean) => void;
}

interface UseStudentActionsReturn {
  identifyStudent: (faceData: EnhancedFaceData, studentId: string, frameData?: string) => Promise<boolean>;
  awardPoints: (studentId: string, points: number, faceData?: EnhancedFaceData, reason?: string) => Promise<boolean>;
  deductPoints: (studentId: string, points: number, faceData?: EnhancedFaceData, reason?: string) => Promise<boolean>;
  markAttendance: (studentId: string, status: 'present' | 'absent', faceData?: EnhancedFaceData) => Promise<boolean>;
  addNote: (studentId: string, note: string, faceData?: EnhancedFaceData) => Promise<boolean>;
  isProcessing: boolean;
  lastAction: { type: StudentActionType; status: ActionStatus } | null;
  error: string | null;
}

export function useStudentActions({
  lectureId,
  onActionComplete
}: UseStudentActionsProps): UseStudentActionsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<{ type: StudentActionType; status: ActionStatus } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeAction = useCallback(async <T>(
    actionType: StudentActionType,
    actionFn: () => Promise<T>
  ): Promise<T | null> => {
    if (isProcessing) {
      toast.error("Another action is in progress");
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setLastAction({ type: actionType, status: 'pending' });

    try {
      const result = await actionFn();
      setLastAction({ type: actionType, status: 'completed' });
      onActionComplete?.(actionType, true);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLastAction({ type: actionType, status: 'failed' });
      onActionComplete?.(actionType, false);
      console.error(`Error in ${actionType}:`, err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onActionComplete]);

  const identifyStudent = useCallback(async (
    faceData: EnhancedFaceData,
    studentId: string,
    frameData?: string
  ): Promise<boolean> => {
    const result = await executeAction('identify', async () => {
      const payload = createIdentificationPayload(faceData, studentId, lectureId, frameData);
      
      const validation = validateIdentificationPayload(payload);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const response = await fetch('/api/students/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to identify student: ${response.status}`);
      }

      const data = await response.json();
      
      toast.success(`Student identified successfully`, {
        description: `Person ID ${faceData.person_id} linked to student ${studentId}`,
        duration: 3000,
      });

      // Log the action
      await logAction('identify', studentId, faceData, { 
        identifiedStudentId: studentId,
        personId: faceData.person_id 
      });

      return data;
    });

    return result !== null;
  }, [executeAction, lectureId]);

  const awardPoints = useCallback(async (
    studentId: string,
    points: number,
    faceData?: EnhancedFaceData,
    customReason?: string
  ): Promise<boolean> => {
    const result = await executeAction('score_award', async () => {
      const validation = validatePointValue(points, 'award');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const reason = customReason || (faceData ? 
        generateActionReason('score_award', faceData) : 
        'Manual point award'
      );

      const payload = createScorePayload(studentId, lectureId, points, reason);

      const response = await fetch(`/api/students/${studentId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to award points: ${response.status}`);
      }

      const data = await response.json();
      
      toast.success(`Points awarded successfully`, {
        description: `+${points} points awarded to student`,
        duration: 3000,
      });

      // Log the action
      await logAction('score_award', studentId, faceData, { 
        points, 
        reason 
      });

      return data;
    });

    return result !== null;
  }, [executeAction, lectureId]);

  const deductPoints = useCallback(async (
    studentId: string,
    points: number,
    faceData?: EnhancedFaceData,
    customReason?: string
  ): Promise<boolean> => {
    const result = await executeAction('score_deduct', async () => {
      const negativePoints = Math.abs(points) * -1;
      
      const validation = validatePointValue(negativePoints, 'deduct');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const reason = customReason || (faceData ? 
        generateActionReason('score_deduct', faceData) : 
        'Manual point deduction'
      );

      const payload = createScorePayload(studentId, lectureId, negativePoints, reason);

      const response = await fetch(`/api/students/${studentId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to deduct points: ${response.status}`);
      }

      const data = await response.json();
      
      toast.error(`Points deducted`, {
        description: `${negativePoints} points deducted from student`,
        duration: 3000,
      });

      // Log the action
      await logAction('score_deduct', studentId, faceData, { 
        points: negativePoints, 
        reason 
      });

      return data;
    });

    return result !== null;
  }, [executeAction, lectureId]);

  const markAttendance = useCallback(async (
    studentId: string,
    status: 'present' | 'absent',
    faceData?: EnhancedFaceData
  ): Promise<boolean> => {
    const result = await executeAction('attendance_override', async () => {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          lectureId,
          status,
          manual: true,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to mark attendance: ${response.status}`);
      }

      const data = await response.json();
      
      toast.info(`Attendance marked`, {
        description: `Student marked as ${status}`,
        duration: 3000,
      });

      // Log the action
      await logAction('attendance_override', studentId, faceData, { 
        status,
        manual: true 
      });

      return data;
    });

    return result !== null;
  }, [executeAction, lectureId]);

  const addNote = useCallback(async (
    studentId: string,
    note: string,
    faceData?: EnhancedFaceData
  ): Promise<boolean> => {
    const result = await executeAction('manual_note', async () => {
      if (!note.trim()) {
        throw new Error('Note cannot be empty');
      }

      // Log the action (notes are stored in the action log)
      await logAction('manual_note', studentId, faceData, { 
        note: note.trim(),
        timestamp: new Date().toISOString()
      });
      
      toast.info(`Note added`, {
        description: `Note recorded for student`,
        duration: 3000,
      });

      return { success: true };
    });

    return result !== null;
  }, [executeAction, lectureId]);

  const logAction = useCallback(async (
    actionType: StudentActionType,
    studentId: string,
    faceData?: EnhancedFaceData,
    additionalDetails?: Record<string, any>
  ) => {
    try {
      const details = faceData ? 
        formatActionDetails(actionType, faceData, additionalDetails) : 
        { actionType, ...additionalDetails };

      await fetch(`/api/lectures/${lectureId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: actionType,
          studentId,
          details,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.warn('Failed to log action:', error);
      // Don't throw here, as logging failures shouldn't break the main action
    }
  }, [lectureId]);

  return {
    identifyStudent,
    awardPoints,
    deductPoints,
    markAttendance,
    addNote,
    isProcessing,
    lastAction,
    error
  };
} 