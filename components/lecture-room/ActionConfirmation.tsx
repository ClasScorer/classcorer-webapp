"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { StudentActionType } from "@/types/student-actions";

interface ActionConfirmationProps {
  visible: boolean;
  onClose: () => void;
  actionType: StudentActionType;
  studentName: string;
  details?: any;
  autoCloseDelay?: number;
}

export function ActionConfirmation({
  visible,
  onClose,
  actionType,
  studentName,
  details = {},
  autoCloseDelay = 3000,
}: ActionConfirmationProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Handle visibility changes
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  // Auto-close after delay
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow animation to complete
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [visible, autoCloseDelay, onClose]);

  // Get action-specific content
  const getActionContent = () => {
    const { success = true } = details;
    
    switch (actionType) {
      case "identify":
        return {
          icon: success ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-red-500" />,
          title: success ? "Student Identified" : "Identification Failed",
          description: success 
            ? `Successfully identified ${studentName}` 
            : "Could not identify student. Please try again."
        };
      case "score_award":
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-500" />,
          title: "Points Awarded",
          description: `Successfully awarded points to ${studentName}`
        };
      case "score_deduct":
        return {
          icon: <CheckCircle className="h-6 w-6 text-amber-500" />,
          title: "Points Deducted",
          description: `Points deducted from ${studentName}`
        };
      case "attendance_override":
        return {
          icon: <CheckCircle className="h-6 w-6 text-blue-500" />,
          title: "Attendance Marked",
          description: `Marked ${studentName} as present`
        };
      case "manual_note":
        return {
          icon: <CheckCircle className="h-6 w-6 text-purple-500" />,
          title: "Note Added",
          description: `Added note for ${studentName}`
        };
      default:
        return {
          icon: <AlertCircle className="h-6 w-6 text-gray-500" />,
          title: "Action Complete",
          description: `Action completed for ${studentName}`
        };
    }
  };

  const { icon, title, description } = getActionContent();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-background border rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-md">
            {icon}
            <div>
              <h4 className="font-medium text-sm">{title}</h4>
              <p className="text-muted-foreground text-xs">{description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 