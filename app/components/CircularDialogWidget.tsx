"use client";

import { useState, useEffect, useRef } from "react";
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
}

export function CircularDialogWidget({ 
  onSelect, 
  trigger = <Button className="bg-purple-600 hover:bg-purple-700">Open Circular Menu</Button> 
}: CircularDialogWidgetProps) {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rotationInterval: NodeJS.Timeout | null = null;
    
    if (isDialogOpen) {
      // Subtle continuous rotation animation - more lightweight
      rotationInterval = setInterval(() => {
        controls.start({
          rotate: [0, 0.3, 0, -0.3, 0],
          transition: { duration: T * 0.8, ease: "easeInOut" }
        });
      }, 3000);
    }
    
    return () => {
      if (rotationInterval) clearInterval(rotationInterval);
    };
  }, [isDialogOpen, controls]);

  // Optimized segment click handler
  const handleSegmentClick = (segmentIndex: number) => {
    console.log("Segment clicked:", segmentIndex + 1);
    
    // Batch state updates together
    setSelectedSegment(segmentIndex);
    setToastMessage(`Selected option ${segmentIndex + 1}`);
    setShowToast(true);
    
    // Call callback immediately
    if (onSelect) {
      onSelect(segmentIndex);
    }
    
    // Immediate feedback with minimal animation
    controls.start({
      scale: [1, 1.03, 1],
      transition: { duration: 0.2, times: [0, 0.5, 1] }
    });
    
    // Close dialog much faster - 300ms is still perceivable but feels snappier
    setTimeout(() => {
      setIsDialogOpen(false);
      // Auto-hide toast shortly after
      setTimeout(() => setShowToast(false), 800);
    }, 300);
  };

  // Optimized hover handling without delay timer
  const handleSegmentHover = (segmentIndex: number) => {
    setHoveredSegment(segmentIndex);
  };

  const handleSegmentHoverEnd = () => {
    setHoveredSegment(null);
  };

  const segments = Array.from({ length: 8 }, (_, i) => i);
  const T = 0.4; // Reduced timing constant for snappier feel

  const circleVariants = {
    hidden: { 
      scale: 0,
      opacity: 0,
      rotate: -45
    },
    visible: { 
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { 
        duration: T * 0.6, // Faster appearance
        ease: "backOut",
        when: "beforeChildren",
        staggerChildren: 0.01 // Faster staggering
      }
    },
    exit: { 
      scale: 0,
      opacity: 0,
      rotate: 45,
      transition: { 
        duration: T * 0.4, // Faster exit
        ease: "backIn" 
      }
    }
  };

  const segmentVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400, // Stiffer spring for faster motion
        damping: 25  
      }
    },
  };

  const pulseAnimation = {
    scale: [1, 1.02, 1],
    transition: { 
      duration: 1.5, 
      repeat: Infinity, 
      repeatType: "mirror" as const
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        console.log("Dialog state changed:", open);
        setIsDialogOpen(open);
      }}>
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
              >
                <motion.div 
                  className="relative z-[60]"
                  onClick={(e) => e.stopPropagation()}
                  variants={circleVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ originX: 0.5, originY: 0.5 }}
                  ref={(el) => {
                    if (el && isDialogOpen) {
                      controls.start({
                        rotate: [0, 0.3, 0, -0.3, 0],
                        transition: { duration: T * 0.8, ease: "easeInOut" }
                      });
                    }
                    containerRef.current = el;
                  }}
                >
                  <motion.svg width="300" height="300" viewBox="0 0 100 100" className="cursor-pointer drop-shadow-lg">
                    {/* Decorative ring pulse */}
                    <motion.circle 
                      cx="50" 
                      cy="50" 
                      r="44" 
                      stroke="rgba(139, 92, 246, 0.2)" 
                      strokeWidth="1" 
                      fill="transparent"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ 
                        scale: [0.95, 1.05, 0.95], 
                        opacity: [0, 0.7, 0],
                        transition: { 
                          duration: 2, 
                          repeat: Infinity,
                          repeatType: "loop" 
                        }
                      }}
                    />
                    
                    {/* Outer circle */}
                    <motion.circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="#8b5cf6" 
                      strokeWidth="0.8" 
                      fill="white" 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: T * 0.7, delay: T * 0.1 }}
                    />
                    
                    {/* Inner circle */}
                    <motion.circle 
                      cx="50" 
                      cy="50" 
                      r="15" 
                      stroke="#8b5cf6" 
                      strokeWidth="0.8" 
                      fill="white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        delay: T * 0.2 
                      }}
                    />
                    
                    {/* Add explicit line between segments 1 and 8 */}
                    <motion.line 
                      x1="50" 
                      y1="10" 
                      x2="50" 
                      y2="35" 
                      stroke="#8b5cf6" 
                      strokeWidth="0.8"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: T * 0.7, delay: T * 0.3 }}
                    />
                    
                    {/* Segments */}
                    {segments.map((segment) => {
                      const angle = (segment * 45 * Math.PI) / 180;
                      const startX = 50 + 15 * Math.cos(angle);
                      const startY = 50 + 15 * Math.sin(angle);
                      const endX = 50 + 40 * Math.cos(angle);
                      const endY = 50 + 40 * Math.sin(angle);
                      const isHovered = hoveredSegment === segment;
                      
                      return (
                        <motion.g 
                          key={segment}
                          variants={segmentVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: 0.1 + segment * 0.03 }}
                        >
                          <motion.line 
                            x1={startX} 
                            y1={startY} 
                            x2={endX} 
                            y2={endY} 
                            stroke="#8b5cf6" 
                            strokeWidth={isHovered ? "1.2" : "0.8"}
                            initial={{ pathLength: 0 }}
                            animate={{ 
                              pathLength: 1,
                              strokeWidth: isHovered ? 1.2 : 0.8
                            }}
                            transition={{ 
                              pathLength: { delay: T * 0.3 + segment * 0.03, duration: T * 0.5 },
                              strokeWidth: { duration: 0.2 }
                            }}
                          />
                          
                          {/* Use path for clickable areas instead of rect */}
                          <motion.path 
                            d={`M ${startX} ${startY} L ${endX} ${endY} A 40 40 0 0 1 ${50 + 40 * Math.cos((segment + 1) * 45 * Math.PI / 180)} ${50 + 40 * Math.sin((segment + 1) * 45 * Math.PI / 180)} L ${50 + 15 * Math.cos((segment + 1) * 45 * Math.PI / 180)} ${50 + 15 * Math.sin((segment + 1) * 45 * Math.PI / 180)} A 15 15 0 0 0 ${startX} ${startY} Z`}
                            style={{ 
                              fill: isHovered ? "#c4b5fd" : "white",
                              cursor: 'pointer' 
                            }}
                            stroke="transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSegmentClick(segment);
                            }}
                            onMouseEnter={() => handleSegmentHover(segment)}
                            onMouseLeave={handleSegmentHoverEnd}
                            whileHover={{ 
                              scale: 1.01, // Reduce scale for faster response
                              transition: { duration: 0.1 } // Faster hover transition
                            }}
                            whileTap={{ 
                              scale: 0.98,
                              transition: { duration: 0.05 } // Very fast tap response
                            }}
                          />

                          {/* Glow effect with simpler implementation */}
                          {isHovered && (
                            <motion.path 
                              d={`M ${startX} ${startY} L ${endX} ${endY} A 40 40 0 0 1 ${50 + 40 * Math.cos((segment + 1) * 45 * Math.PI / 180)} ${50 + 40 * Math.sin((segment + 1) * 45 * Math.PI / 180)} L ${50 + 15 * Math.cos((segment + 1) * 45 * Math.PI / 180)} ${50 + 15 * Math.sin((segment + 1) * 45 * Math.PI / 180)} A 15 15 0 0 0 ${startX} ${startY} Z`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.5 }}
                              exit={{ opacity: 0 }}
                              stroke="#a78bfa"
                              strokeWidth="0.8"
                              fill="transparent"
                              filter="drop-shadow(0 0 2px #c4b5fd)"
                            />
                          )}

                          {/* Segment number/label */}
                          <motion.text
                            x={50 + 28 * Math.cos(angle + Math.PI/8)}
                            y={50 + 28 * Math.sin(angle + Math.PI/8)}
                            fill={isHovered ? "#6d28d9" : "#8b5cf6"}
                            fontSize="3.5"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            initial={{ opacity: 0, y: 3 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              scale: isHovered ? 1.15 : 1,
                            }}
                            transition={{ 
                              opacity: { delay: T * 0.7 + segment * 0.04, duration: T * 0.3 },
                              scale: { duration: 0.2 }
                            }}
                          >
                            {segment + 1}
                          </motion.text>
                        </motion.g>
                      );
                    })}
                  </motion.svg>

                  {selectedSegment !== null && (
                    <motion.div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-100 rounded-full p-4 shadow-lg"
                      initial={{ scale: 0, rotate: -10 }} // Less extreme rotation
                      animate={{ 
                        scale: 1, 
                        rotate: 0,
                        boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)"
                      }}
                      exit={{ scale: 0, rotate: 10 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 500, // Increased stiffness
                        damping: 20 
                      }}
                    >
                      <motion.p 
                        className="text-purple-800 font-bold"
                        initial={{ opacity: 0 }}
                        animate={pulseAnimation}
                      >
                        {selectedSegment + 1}
                      </motion.p>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogPortal>
      </Dialog>

      {/* Feedback Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed bottom-8 right-8 z-50 bg-purple-800 text-white px-6 py-3 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 20 }} // Reduced initial offset
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }} // Reduced exit distance
            transition={{ type: "spring", damping: 25, stiffness: 400 }} // Snappier animation
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