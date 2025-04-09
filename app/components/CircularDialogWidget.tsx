"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  Dialog,
  DialogPortal,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

interface CircularDialogWidgetProps {
  onSelect?: (segmentIndex: number) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Define classroom action options outside component to prevent recreation
const classroomOptions = [
  { id: 0, label: "Correct Answer", value: 1 },
  { id: 1, label: "Attempted Answer", value: 2 },
  { id: 2, label: "Penalize", value: 3 },
  { id: 3, label: "Identify Student", value: 4 },
  { id: 4, label: "Custom Points", value: 5 },
  { id: 5, label: "View Profile", value: 6 }
];

// Pre-calculate segment data
const segments = Array.from({ length: 6 }, (_, i) => {
  // For 6 segments, we need 60 degree spacing (360/6)
  const angle = (i * 60 * Math.PI) / 180;
  const nextAngle = ((i + 1) * 60 * Math.PI) / 180;
  const startX = 50 + 15 * Math.cos(angle);
  const startY = 50 + 15 * Math.sin(angle);
  const endX = 50 + 40 * Math.cos(angle);
  const endY = 50 + 40 * Math.sin(angle);
  
  // Position text in the center of each segment (30 degrees = Math.PI/6)
  const textAngle = angle + Math.PI/6;
  const textRadius = 28;
  const textX = 50 + textRadius * Math.cos(textAngle);
  const textY = 50 + textRadius * Math.sin(textAngle);
  
  // Pre-calculate path data
  const nextStartX = 50 + 15 * Math.cos(nextAngle);
  const nextStartY = 50 + 15 * Math.sin(nextAngle);
  const nextEndX = 50 + 40 * Math.cos(nextAngle);
  const nextEndY = 50 + 40 * Math.sin(nextAngle);
  
  const pathD = `M ${startX} ${startY} L ${endX} ${endY} A 40 40 0 0 1 ${nextEndX} ${nextEndY} L ${nextStartX} ${nextStartY} A 15 15 0 0 0 ${startX} ${startY} Z`;
  
  return {
    id: i,
    startX,
    startY,
    endX,
    endY,
    textX,
    textY,
    pathD,
    option: classroomOptions[i]
  };
});

// Simplified animation constants
const T = 0.3; // Faster timing

export function CircularDialogWidget({ 
  onSelect, 
  trigger = <Button className="bg-purple-600 hover:bg-purple-700">Choose Action</Button>,
  isOpen,
  onOpenChange
}: CircularDialogWidgetProps) {
  const [isInternalDialogOpen, setIsInternalDialogOpen] = useState(false);
  
  // Determine if dialog is controlled externally or internally
  const isDialogOpen = isOpen !== undefined ? isOpen : isInternalDialogOpen;
  const setIsDialogOpen = (open: boolean) => {
    setIsInternalDialogOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };
  
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const controls = useAnimation();
  
  // Skip the continuous rotation animation - it adds to lag
  
  // Optimized with useCallback to prevent recreation on renders
  const handleSegmentClick = useCallback((segmentIndex: number) => {
    const option = classroomOptions[segmentIndex];
    
    // Show toast with classroom action and value
    setToastMessage(`${option.label} (${option.value})`);
    setShowToast(true);
    
    // Call callback with the option value instead of segment index
    if (onSelect) {
      onSelect(option.value);
    }
    
    // Skip the feedback animation for better performance
    
    // Close dialog immediately
    setIsDialogOpen(false);
    setTimeout(() => setShowToast(false), 800);
  }, [onSelect]);

  // Optimized hover handling
  const handleSegmentHover = useCallback((segmentIndex: number) => {
    setHoveredSegment(segmentIndex);
  }, []);

  const handleSegmentHoverEnd = useCallback(() => {
    setHoveredSegment(null);
  }, []);

  // Optimized variants with simpler animations
  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1,
      opacity: 1,
      transition: { 
        duration: T,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.005 // Faster staggering
      }
    },
    exit: { 
      scale: 0,
      opacity: 0,
      transition: { duration: T * 0.8 }
    }
  };

  const segmentVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: T * 0.5 }
    },
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogPortal>
          <AnimatePresence>
            {isDialogOpen && (
              <motion.div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: T * 0.5 }}
                onClick={() => setIsDialogOpen(false)}
              >
                <motion.div 
                  className="relative z-[60]"
                  onClick={(e) => e.stopPropagation()}
                  variants={circleVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <svg width="300" height="300" viewBox="0 0 100 100" className="cursor-pointer">
                    {/* Outer circle - static (not animated) for better performance */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="#8b5cf6" 
                      strokeWidth="0.8" 
                      fill="white" 
                    />
                    
                    {/* Inner circle - static */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="15" 
                      stroke="#8b5cf6" 
                      strokeWidth="0.8" 
                      fill="white"
                    />
                    
                    {/* Center text */}
                    <text
                      x="50"
                      y="50"
                      fill="#6d28d9"
                      fontSize="3.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      Choose Action
                    </text>
                    
                    {/* Division lines - static */}
                    <line 
                      x1="50" 
                      y1="10" 
                      x2="50" 
                      y2="35" 
                      stroke="#8b5cf6" 
                      strokeWidth="0.8"
                    />
                    <line 
                      x1="50" 
                      y1="90" 
                      x2="50" 
                      y2="65" 
                      stroke="#8b5cf6" 
                      strokeWidth="0.8"
                    />
                    
                    {/* Pre-calculated segments */}
                    {segments.map((segment) => {
                      const isHovered = hoveredSegment === segment.id;
                      
                      return (
                        <motion.g 
                          key={segment.id}
                          variants={segmentVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {/* Division line */}
                          <line 
                            x1={segment.startX} 
                            y1={segment.startY} 
                            x2={segment.endX} 
                            y2={segment.endY} 
                            stroke="#8b5cf6" 
                            strokeWidth="0.8"
                          />
                          
                          {/* Clickable segment */}
                          <path 
                            d={segment.pathD}
                            style={{ 
                              fill: isHovered ? "#c4b5fd" : "white",
                              cursor: 'pointer',
                              transition: "fill 0.1s ease"
                            }}
                            stroke="transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSegmentClick(segment.id);
                            }}
                            onMouseEnter={() => handleSegmentHover(segment.id)}
                            onMouseLeave={handleSegmentHoverEnd}
                          />

                          {/* Option text */}
                          <text
                            x={segment.textX}
                            y={segment.textY}
                            fill={isHovered ? "#6d28d9" : "#8b5cf6"}
                            fontSize="3.0"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{ transition: "fill 0.1s ease" }}
                          >
                            {segment.option.label}
                          </text>
                        </motion.g>
                      );
                    })}
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogPortal>
      </Dialog>

      {/* Simplified Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed bottom-8 right-8 z-50 bg-purple-800 text-white px-6 py-3 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 