import { useEffect, useRef, useCallback } from 'react';
import { EnhancedFaceDetectionResponse } from '@/types/lecture-room';
import { Student } from '@/lib/data';
import { toast } from 'sonner';

interface UseGamificationProcessorProps {
  lectureId: string | null;
  faceData: EnhancedFaceDetectionResponse | null;
  students: Student[];
  isLectureActive: boolean;
  processingInterval?: number; // milliseconds, default 60000 (1 minute)
}

interface GamificationResult {
  pointsAwarded: number;
  bonusAwarded: number;
  messages: string[];
}

export function useGamificationProcessor({
  lectureId,
  faceData,
  students,
  isLectureActive,
  processingInterval = 60000 // Process every minute
}: UseGamificationProcessorProps) {
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessingTime = useRef<number>(Date.now());
  const studentAttentionHistory = useRef<Map<string, Array<{
    timestamp: number;
    attentive: boolean;
    handRaised: boolean;
  }>>>(new Map());

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []);

  // Update student attention history
  const updateAttentionHistory = useCallback(() => {
    if (!faceData || !faceData.faces) return;

    const currentTime = Date.now();
    
    faceData.faces.forEach(face => {
      if (face.recognition_status === 'known' && face.person_id) {
        const studentId = face.person_id;
        const isAttentive = face.attention_status === 'focused' || 
                           (face.attentionMetrics?.focusScore || 0) > 60;
        const isHandRaised = face.hand_raising_status?.is_hand_raised || false;

        // Get or create history for this student
        if (!studentAttentionHistory.current.has(studentId)) {
          studentAttentionHistory.current.set(studentId, []);
        }

        const history = studentAttentionHistory.current.get(studentId)!;
        
        // Add current status to history
        history.push({
          timestamp: currentTime,
          attentive: isAttentive,
          handRaised: isHandRaised
        });

        // Keep only last 10 minutes of history
        const tenMinutesAgo = currentTime - (10 * 60 * 1000);
        const filteredHistory = history.filter(entry => entry.timestamp > tenMinutesAgo);
        studentAttentionHistory.current.set(studentId, filteredHistory);
      }
    });
  }, [faceData]);

  // Process gamification for all students
  const processGamification = useCallback(async () => {
    if (!lectureId || !isLectureActive) return;

    console.log('Processing gamification for lecture:', lectureId);

    // Collect student data for batch processing
    const studentData: Array<{
      studentId: string;
      attentionStatus: 'focused' | 'unfocused';
      handRaised: boolean;
      consecutiveMinutes: number;
    }> = [];

    // Process each student's attention history
    studentAttentionHistory.current.forEach((history, studentId) => {
      if (history.length === 0) return;

      // Calculate metrics from history
      const recentHistory = history.slice(-5); // Last 5 entries
      const attentiveCount = recentHistory.filter(entry => entry.attentive).length;
      const isCurrentlyAttentive = recentHistory[recentHistory.length - 1]?.attentive || false;
      const isHandRaised = recentHistory.some(entry => entry.handRaised);

      // Calculate consecutive attentive minutes
      let consecutiveMinutes = 0;
      for (let i = recentHistory.length - 1; i >= 0; i--) {
        if (recentHistory[i].attentive) {
          consecutiveMinutes++;
        } else {
          break;
        }
      }

      studentData.push({
        studentId,
        attentionStatus: isCurrentlyAttentive ? 'focused' : 'unfocused',
        handRaised: isHandRaised,
        consecutiveMinutes
      });
    });

    if (studentData.length === 0) {
      console.log('No student data available for gamification processing');
      return;
    }

    try {
      // Call batch gamification API
      const response = await fetch(`/api/lectures/${lectureId}/gamification`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process gamification');
      }

      const result = await response.json();
      
      if (result.success) {
        const { successful, summary } = result;
        
        console.log(`Gamification processed: ${successful} students, ${summary.totalPointsAwarded} points awarded`);
        
        // Show toast notification for significant point awards
        if (summary.totalPointsAwarded > 0) {
          toast.success(`Auto-gamification: ${summary.totalPointsAwarded} points awarded to ${successful} students`, {
            description: `${summary.totalBonusAwarded} bonus points included`,
            duration: 4000
          });
        }

        // Log individual successes for debugging
        result.results.filter((r: any) => r.success && r.pointsAwarded > 0).forEach((r: any) => {
          console.log(`Student ${r.studentId}: +${r.pointsAwarded} points (${r.messages.join(', ')})`);
        });
      }

    } catch (error) {
      console.error('Error processing gamification:', error);
      toast.error(`Gamification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [lectureId, isLectureActive]);

  // Set up automatic processing
  useEffect(() => {
    if (!lectureId || !isLectureActive) {
      // Clear interval if lecture is not active
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      return;
    }

    // Start automatic gamification processing
    processingIntervalRef.current = setInterval(() => {
      processGamification();
    }, processingInterval);

    // Initial processing after a delay
    setTimeout(() => {
      processGamification();
    }, 5000);

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [lectureId, isLectureActive, processingInterval, processGamification]);

  // Update attention history when face data changes
  useEffect(() => {
    if (isLectureActive) {
      updateAttentionHistory();
    }
  }, [faceData, isLectureActive, updateAttentionHistory]);

  // Manual processing function for immediate use
  const processImmediately = useCallback(async () => {
    updateAttentionHistory();
    await processGamification();
  }, [updateAttentionHistory, processGamification]);

  // Function to get current attention metrics for debugging
  const getAttentionMetrics = useCallback(() => {
    const metrics: Record<string, {
      totalEntries: number;
      attentiveCount: number;
      attentionRate: number;
      consecutiveAttentive: number;
      handRaisedCount: number;
    }> = {};

    studentAttentionHistory.current.forEach((history, studentId) => {
      const attentiveEntries = history.filter(entry => entry.attentive);
      const handRaisedEntries = history.filter(entry => entry.handRaised);
      
      // Calculate consecutive attentive periods
      let consecutiveAttentive = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].attentive) {
          consecutiveAttentive++;
        } else {
          break;
        }
      }

      metrics[studentId] = {
        totalEntries: history.length,
        attentiveCount: attentiveEntries.length,
        attentionRate: history.length > 0 ? (attentiveEntries.length / history.length) * 100 : 0,
        consecutiveAttentive,
        handRaisedCount: handRaisedEntries.length
      };
    });

    return metrics;
  }, []);

  return {
    processImmediately,
    getAttentionMetrics
  };
} 