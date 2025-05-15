"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogPortal,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface CircularDialogWidgetProps {
  onSelect?: (segmentIndex: number) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Define classroom action options with minimal labels
const classroomOptions = [
  { id: 0, label: "✓", value: 1, color: "#10b981" }, 
  { id: 1, label: "Try", value: 2, color: "#3b82f6" }, 
  { id: 2, label: "✗", value: 3, color: "#ef4444" }, 
  { id: 3, label: "ID", value: 4, color: "#f59e0b" }, 
  { id: 4, label: "⭐", value: 5, color: "#8b5cf6" },
  { id: 5, label: "Info", value: 6, color: "#6366f1" }
];

// Pre-calculate segment data
const segments = Array.from({ length: 6 }, (_, i) => {
  // For 6 segments, we need 60 degree spacing (360/6)
  const angle = (i * 60 * Math.PI) / 180;
  const nextAngle = ((i + 1) * 60 * Math.PI) / 180;
  
  // Inner and outer radius
  const innerRadius = 20;
  const outerRadius = 45;
  
  const startX = 50 + innerRadius * Math.cos(angle);
  const startY = 50 + innerRadius * Math.sin(angle);
  const endX = 50 + outerRadius * Math.cos(angle);
  const endY = 50 + outerRadius * Math.sin(angle);
  
  // Position text in the center of each segment (30 degrees = Math.PI/6)
  const textAngle = angle + Math.PI/6;
  const textRadius = 32;
  const textX = 50 + textRadius * Math.cos(textAngle);
  const textY = 50 + textRadius * Math.sin(textAngle);
  
  // Pre-calculate path data
  const nextStartX = 50 + innerRadius * Math.cos(nextAngle);
  const nextStartY = 50 + innerRadius * Math.sin(nextAngle);
  const nextEndX = 50 + outerRadius * Math.cos(nextAngle);
  const nextEndY = 50 + outerRadius * Math.sin(nextAngle);
  
  // Use arc command for rounded outer edge
  const pathD = `M ${startX} ${startY} 
                 L ${endX} ${endY} 
                 A ${outerRadius} ${outerRadius} 0 0 1 ${nextEndX} ${nextEndY} 
                 L ${nextStartX} ${nextStartY} 
                 A ${innerRadius} ${innerRadius} 0 0 0 ${startX} ${startY} Z`;
  
  return {
    id: i,
    pathD,
    textX,
    textY,
    option: classroomOptions[i]
  };
});

// Animation constants
const T = 0.2; // Fast timing

export function CircularDialogWidget({ 
  onSelect, 
  trigger = <Button className="bg-purple-600 hover:bg-purple-700">Actions</Button>,
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
  
  // Handle segment click
  const handleSegmentClick = useCallback((segmentIndex: number) => {
    const option = classroomOptions[segmentIndex];
    
    // Show toast with action
    setToastMessage(`${option.label} action applied`);
    setShowToast(true);
    
    // Call callback with the option value
    if (onSelect) {
      onSelect(option.value);
    }
    
    // Close dialog immediately
    setIsDialogOpen(false);
    setTimeout(() => setShowToast(false), 800);
  }, [onSelect]);

  // Handle hover
  const handleSegmentHover = useCallback((segmentIndex: number) => {
    setHoveredSegment(segmentIndex);
  }, []);

  const handleSegmentHoverEnd = useCallback(() => {
    setHoveredSegment(null);
  }, []);

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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: T }}
                onClick={() => setIsDialogOpen(false)}
              >
                <motion.div 
                  className="relative z-[60]"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: T }}
                >
                  <svg width="270" height="270" viewBox="0 0 100 100" className="cursor-pointer">
                    {/* Plain white background */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="white" 
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                    />
                    
                    {/* Center text - minimal */}
                    <text
                      x="50"
                      y="50"
                      fill="#6d28d9"
                      fontSize="4"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      Actions
                    </text>
                    
                    {/* Segments */}
                    {segments.map((segment) => {
                      const isHovered = hoveredSegment === segment.id;
                      const option = segment.option;
                      
                      return (
                        <g key={segment.id}>
                          {/* Clickable segment */}
                          <path 
                            d={segment.pathD}
                            style={{ 
                              fill: isHovered ? `${option.color}20` : "transparent",
                              cursor: 'pointer',
                              transition: "all 0.1s ease",
                              stroke: isHovered ? option.color : "#e5e7eb",
                              strokeWidth: "0.5"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSegmentClick(segment.id);
                            }}
                            onMouseEnter={() => handleSegmentHover(segment.id)}
                            onMouseLeave={handleSegmentHoverEnd}
                          />

                          {/* Minimalist label */}
                          <text
                            x={segment.textX}
                            y={segment.textY}
                            fill={isHovered ? option.color : "#4b5563"}
                            fontSize="5"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{ transition: "fill 0.1s ease" }}
                          >
                            {option.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogPortal>
      </Dialog>

      {/* Minimal Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed bottom-8 right-8 z-50 bg-gray-800 text-white px-4 py-2 rounded-md shadow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 