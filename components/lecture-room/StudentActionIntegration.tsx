"use client";

import { useState, useCallback, useRef } from "react";
import { EnhancedFaceData } from "@/types/lecture-room";
import { Student } from "@/lib/data";
import { StudentActionMenu } from "./StudentActionMenu";
import { StudentIdentificationDialog } from "./StudentIdentificationDialog";
import { PointAwardDialog } from "./PointAwardDialog";
import { ActionConfirmation } from "./ActionConfirmation";
import { NoteDialog } from "./NoteDialog";
import { useClickDetection } from "@/hooks/lecture-room/useClickDetection";
import { useContextMenu } from "@/hooks/lecture-room/useContextMenu";
import { useStudentActions } from "@/hooks/lecture-room/useStudentActions";
import { useCourseStudents } from "@/hooks/dashboard/useCourseStudents";
import { getSuggestedPointValues } from "@/lib/utils/student-actions";
import { StudentActionType, ClickDetectionResult } from "@/types/student-actions";

interface StudentActionIntegrationProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  detectedFaces: EnhancedFaceData[];
  courseId: string;
  lectureId: string;
  students: Student[];
  children?: React.ReactNode;
}

export function StudentActionIntegration({
  canvasRef,
  detectedFaces,
  courseId,
  lectureId,
  students,
  children
}: StudentActionIntegrationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dialog state
  const [identificationDialogOpen, setIdentificationDialogOpen] = useState(false);
  const [pointDialogOpen, setPointDialogOpen] = useState(false);
  const [pointDialogMode, setPointDialogMode] = useState<'award' | 'deduct'>('award');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedFace, setSelectedFace] = useState<EnhancedFaceData | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>();
  
  // Confirmation state
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState<{
    actionType: StudentActionType;
    studentName: string;
    details?: any;
  } | null>(null);

  // Hooks
  const { menuState, openMenu, closeMenu } = useContextMenu({ containerRef });
  
  const { 
    handleCanvasClick, 
    isProcessingClick 
  } = useClickDetection({
    canvasRef,
    detectedFaces,
    isEnabled: !menuState.isOpen
  });

  const {
    identifyStudent,
    awardPoints,
    deductPoints,
    markAttendance,
    addNote,
    isProcessing
  } = useStudentActions({
    lectureId,
    onActionComplete: (actionType, success) => {
      if (success) {
        const student = getStudentById(selectedStudentId || '') || 
                      { name: 'Unknown Student' } as Student;
        
        setConfirmationDetails({
          actionType,
          studentName: student.name,
          details: { success }
        });
        setConfirmationVisible(true);
      }
      closeAllDialogs();
    }
  });

  const { getStudentById } = useCourseStudents({ courseId });

  // Canvas click handler
  const onCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isProcessing || isProcessingClick) return;

    const result = handleCanvasClick(event.nativeEvent);
    
    if (result && result.face) {
      const face = result.face;
      const studentId = getStudentIdForFace(face);
      const student = studentId ? getStudentById(studentId) : undefined;
      
      setSelectedFace(face);
      setSelectedStudentId(studentId);
      
      openMenu(face, result.position, studentId);
    }
  }, [handleCanvasClick, isProcessing, isProcessingClick, getStudentById, openMenu]);

  // Helper functions
  const getStudentIdForFace = (face: EnhancedFaceData): string | undefined => {
    if (face.recognition_status === 'known') {
      // In a real implementation, this would come from the face data
      // For now, try to match with existing students by some logic
      return students.find(s => s.id === face.person_id)?.id;
    }
    return undefined;
  };

  const getStudentName = (studentId?: string): string => {
    if (!studentId) return 'Unknown Person';
    const student = getStudentById(studentId);
    return student?.name || 'Unknown Student';
  };

  const closeAllDialogs = () => {
    setIdentificationDialogOpen(false);
    setPointDialogOpen(false);
    setNoteDialogOpen(false);
    closeMenu();
    setSelectedFace(null);
    setSelectedStudentId(undefined);
  };

  // Action handlers
  const handleIdentifyClick = useCallback(() => {
    setIdentificationDialogOpen(true);
    closeMenu();
  }, [closeMenu]);

  const handleIdentifyConfirm = useCallback(async (studentId: string): Promise<boolean> => {
    if (!selectedFace) return false;
    
    const success = await identifyStudent(selectedFace, studentId);
    if (success) {
      setSelectedStudentId(studentId);
    }
    return success;
  }, [selectedFace, identifyStudent]);

  const handleAwardPoints = useCallback((points: number) => {
    if (points <= 5) {
      // Quick award for small amounts
      if (selectedStudentId) {
        awardPoints(selectedStudentId, points, selectedFace);
      }
    } else {
      // Open dialog for larger amounts
      setPointDialogMode('award');
      setPointDialogOpen(true);
    }
    closeMenu();
  }, [selectedStudentId, selectedFace, awardPoints, closeMenu]);

  const handleDeductPoints = useCallback((points: number) => {
    setPointDialogMode('deduct');
    setPointDialogOpen(true);
    closeMenu();
  }, [closeMenu]);

  const handlePointDialogConfirm = useCallback(async (points: number, reason: string): Promise<boolean> => {
    if (!selectedStudentId) return false;
    
    if (pointDialogMode === 'award') {
      return await awardPoints(selectedStudentId, points, selectedFace, reason);
    } else {
      return await deductPoints(selectedStudentId, points, selectedFace, reason);
    }
  }, [selectedStudentId, selectedFace, pointDialogMode, awardPoints, deductPoints]);

  const handleMarkAttendance = useCallback(() => {
    if (selectedStudentId) {
      markAttendance(selectedStudentId, 'present', selectedFace);
    }
    closeMenu();
  }, [selectedStudentId, selectedFace, markAttendance, closeMenu]);

  const handleAddNote = useCallback(() => {
    setNoteDialogOpen(true);
    closeMenu();
  }, [closeMenu]);

  const handleNoteSubmit = useCallback(async (note: string): Promise<boolean> => {
    if (!selectedStudentId) return false;
    return await addNote(selectedStudentId, note, selectedFace);
  }, [selectedStudentId, selectedFace, addNote]);

  const handleConfirmationClose = useCallback(() => {
    setConfirmationVisible(false);
    setConfirmationDetails(null);
  }, []);

  const suggestedPoints = selectedFace ? getSuggestedPointValues(selectedFace) : [];

  return (
    <div ref={containerRef} className="relative">
      {/* Render children (VideoFeed canvas) with canvas click handler */}
      {children}
      
      {/* Context Menu */}
      {menuState.isOpen && menuState.targetFace && (
        <StudentActionMenu
          isOpen={menuState.isOpen}
          position={menuState.position}
          faceData={menuState.targetFace}
          studentId={menuState.targetStudentId}
          studentName={getStudentName(menuState.targetStudentId)}
          suggestedPoints={suggestedPoints}
          onClose={closeMenu}
          onIdentifyClick={handleIdentifyClick}
          onAwardPoints={handleAwardPoints}
          onDeductPoints={handleDeductPoints}
          onMarkAttendance={handleMarkAttendance}
          onAddNote={handleAddNote}
        />
      )}
      
      {/* Identification Dialog */}
      <StudentIdentificationDialog
        isOpen={identificationDialogOpen}
        onOpenChange={setIdentificationDialogOpen}
        courseId={courseId}
        faceData={selectedFace}
        onConfirm={handleIdentifyConfirm}
        onCancel={() => setIdentificationDialogOpen(false)}
        isSubmitting={isProcessing}
      />
      
      {/* Point Award/Deduct Dialog */}
      <PointAwardDialog
        isOpen={pointDialogOpen}
        onOpenChange={setPointDialogOpen}
        studentName={getStudentName(selectedStudentId)}
        suggestedPoints={suggestedPoints}
        mode={pointDialogMode}
        onConfirm={handlePointDialogConfirm}
        onCancel={() => setPointDialogOpen(false)}
        isSubmitting={isProcessing}
      />
      
      {/* Note Dialog */}
      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        studentName={getStudentName(selectedStudentId)}
        onSubmit={handleNoteSubmit}
        isSubmitting={isProcessing}
      />
      
      {/* Action Confirmation */}
      {confirmationDetails && (
        <ActionConfirmation
          visible={confirmationVisible}
          onClose={handleConfirmationClose}
          actionType={confirmationDetails.actionType}
          studentName={confirmationDetails.studentName}
          details={confirmationDetails.details}
        />
      )}
    </div>
  );
} 