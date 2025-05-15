"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogPortal,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CircularDialogWidgetProps {
  onSelect?: (segmentIndex: number) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  boundingBoxRef?: React.RefObject<HTMLCanvasElement>; // Canvas reference for bounding box data
}

// Define classroom action options with enhanced labels and descriptions
const classroomOptions = [
  { id: 0, label: "✓", description: "Correct", value: 1, color: "#10b981", icon: "✓" }, 
  { id: 1, label: "Try", description: "Try Again", value: 2, color: "#3b82f6", icon: "↻" }, 
  { id: 2, label: "✗", description: "Incorrect", value: 3, color: "#ef4444", icon: "✗" }, 
  { id: 3, label: "ID", description: "Verify", value: 4, color: "#f59e0b", icon: "ID" }, 
  { id: 4, label: "⭐", description: "Award", value: 5, color: "#8b5cf6", icon: "⭐" },
  { id: 5, label: "Info", description: "Details", value: 6, color: "#6366f1", icon: "ℹ" },
  { id: 6, label: "Assoc", description: "Associate", value: 7, color: "#14b8a6", icon: "🔗" },
  { id: 7, label: "Add", description: "Add", value: 8, color: "#ec4899", icon: "+" }
];

// Pre-calculate segment data with enhanced visual properties
const segments = Array.from({ length: 8 }, (_, i) => {
  // For 8 segments, we need 45 degree spacing (360/8)
  const angle = (i * 45 * Math.PI) / 180;
  const nextAngle = ((i + 1) * 45 * Math.PI) / 180;
  
  // Enhanced inner and outer radius for better proportions
  const innerRadius = 22;
  const outerRadius = 48;
  
  const startX = 50 + innerRadius * Math.cos(angle);
  const startY = 50 + innerRadius * Math.sin(angle);
  const endX = 50 + outerRadius * Math.cos(angle);
  const endY = 50 + outerRadius * Math.sin(angle);
  
  // Position text in the center of each segment (22.5 degrees = Math.PI/8)
  const textAngle = angle + Math.PI/8;
  const textRadius = 35;
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
  trigger = <Button className="bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg transition-all">Actions</Button>,
  isOpen,
  onOpenChange,
  boundingBoxRef
}: CircularDialogWidgetProps) {
  const [isInternalDialogOpen, setIsInternalDialogOpen] = useState(false);
  const [activeAnimation, setActiveAnimation] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for the associate dialog
  const [isAssociateDialogOpen, setIsAssociateDialogOpen] = useState(false);
  const [personId, setPersonId] = useState("");
  const [isAssociateLoading, setIsAssociateLoading] = useState(false);
  const [boundingBoxData, setBoundingBoxData] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Determine if dialog is controlled externally or internally
  const isDialogOpen = isOpen !== undefined ? isOpen : isInternalDialogOpen;
  const setIsDialogOpen = (open: boolean) => {
    setIsInternalDialogOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }

    // Start entrance animation
    if (open) {
      setActiveAnimation(true);
    }
  };
  
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Clean up animation timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Function to get bounding box data from canvas
  const getBoundingBoxFromCanvas = useCallback(() => {
    if (!boundingBoxRef?.current) return null;
    
    // In a real implementation, this would get the actual bounding box data from the canvas
    // For now, we'll use a placeholder example with the canvas dimensions
    const canvas = boundingBoxRef.current;
    return {
      x: Math.round(canvas.width * 0.25),
      y: Math.round(canvas.height * 0.25),
      width: Math.round(canvas.width * 0.5),
      height: Math.round(canvas.height * 0.5),
    };
  }, [boundingBoxRef]);

  // Function to handle associate request
  const handleAssociateRequest = useCallback(async () => {
    if (!personId.trim() || !boundingBoxData) {
      toast.error("Person ID and bounding box are required");
      return;
    }

    setIsAssociateLoading(true);
    
    try {
      // Prepare data for the API request
      const formData = new FormData();
      formData.append('person_id', personId);
      formData.append('x', boundingBoxData.x.toString());
      formData.append('y', boundingBoxData.y.toString());
      formData.append('width', boundingBoxData.width.toString());
      formData.append('height', boundingBoxData.height.toString());
      
      // Make the API request
      const response = await fetch("/api/register-face", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Face registration result:", result);
      
      toast.success(`Successfully associated face with ID: ${personId}`);
      setIsAssociateDialogOpen(false);
      setPersonId("");
    } catch (error) {
      console.error("Error registering face:", error);
      toast.error(`Failed to register face: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAssociateLoading(false);
    }
  }, [personId, boundingBoxData]);

  // Handle segment click with animation
  const handleSegmentClick = useCallback((segmentIndex: number) => {
    const option = classroomOptions[segmentIndex];
    
    // Set selected segment for animation
    setSelectedSegment(segmentIndex);
    
    // Special handling for Associate action
    if (segmentIndex === 6) { // Associate
      // Get bounding box data from canvas
      const boxData = getBoundingBoxFromCanvas();
      if (boxData) {
        setBoundingBoxData(boxData);
        
        // Close the wheel dialog and open the associate dialog
        setIsDialogOpen(false);
        setSelectedSegment(null);
        
        // Slight delay to allow the wheel dialog to close
        setTimeout(() => {
          setIsAssociateDialogOpen(true);
        }, 300);
      } else {
        toast.error("No canvas or bounding box available");
        setSelectedSegment(null);
      }
      return;
    }
    
    // For other actions, continue with standard flow
    // Delay dialog close to show the selection animation
    timeoutRef.current = setTimeout(() => {
      // Show toast with action
      setToastMessage(`${option.description} action applied`);
      setShowToast(true);
      
      // Call callback with the option value
      if (onSelect) {
        onSelect(option.value);
      }
      
      // Close dialog
      setIsDialogOpen(false);
      setSelectedSegment(null);
      
      // Hide toast after delay
      timeoutRef.current = setTimeout(() => setShowToast(false), 1500);
    }, 300);
  }, [onSelect, setIsDialogOpen, getBoundingBoxFromCanvas]);

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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: T }}
                onClick={() => setIsDialogOpen(false)}
              >
                <motion.div 
                  className="relative z-[60]"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1, 
                    rotate: 0,
                    transition: { 
                      type: "spring", 
                      stiffness: 260, 
                      damping: 20 
                    }
                  }}
                  exit={{ scale: 0.8, opacity: 0, rotate: 15 }}
                  transition={{ duration: T }}
                >
                  <svg width="300" height="300" viewBox="0 0 100 100" className="cursor-pointer drop-shadow-xl">
                    {/* Enhanced background with subtle gradient */}
                    <defs>
                      <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#f9fafb" />
                      </radialGradient>
                    </defs>
                    
                    {/* Main circle with subtle shadow */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="48" 
                      fill="url(#centerGradient)" 
                      stroke="#e5e7eb"
                      strokeWidth="0.8"
                      filter="drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))"
                    />
                    
                    {/* Center inner circle */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="20" 
                      fill="white" 
                      stroke="#f3f4f6"
                      strokeWidth="1.5"
                      filter="drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.05))"
                    />
                    
                    {/* Center text with enhanced styling */}
                    <text
                      x="50"
                      y="50"
                      fill="#6d28d9"
                      fontSize="5"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      filter="drop-shadow(0px 1px 1px rgba(109, 40, 217, 0.2))"
                    >
                      Actions
                    </text>
                    
                    {/* Segments with enhanced styling */}
                    {segments.map((segment) => {
                      const isHovered = hoveredSegment === segment.id;
                      const isSelected = selectedSegment === segment.id;
                      const option = segment.option;
                      
                      return (
                        <g key={segment.id}>
                          {/* Clickable segment */}
                          <path 
                            d={segment.pathD}
                            style={{ 
                              fill: isSelected 
                                ? option.color
                                : isHovered 
                                  ? `${option.color}20` 
                                  : "white",
                              cursor: 'pointer',
                              transition: "all 0.15s ease-in-out",
                              stroke: isHovered || isSelected ? option.color : "#e5e7eb",
                              strokeWidth: isHovered || isSelected ? "1" : "0.5",
                              opacity: isSelected ? 0.9 : 1,
                              filter: isHovered ? `drop-shadow(0px 2px 4px ${option.color}40)` : "none"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSegmentClick(segment.id);
                            }}
                            onMouseEnter={() => handleSegmentHover(segment.id)}
                            onMouseLeave={handleSegmentHoverEnd}
                          />

                          {/* Improved label */}
                          <text
                            x={segment.textX}
                            y={segment.textY}
                            fill={isSelected ? "white" : isHovered ? option.color : "#4b5563"}
                            fontSize="6"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{ 
                              transition: "all 0.15s ease",
                              filter: isHovered ? `drop-shadow(0px 1px 1px ${option.color}80)` : "none",
                              transform: isHovered ? "scale(1.05)" : "scale(1)",
                              transformOrigin: "center"
                            }}
                          >
                            {option.icon}
                          </text>
                          
                          {/* Small description that appears on hover */}
                          {isHovered && (
                            <text
                              x={segment.textX}
                              y={segment.textY + 6}
                              fill={option.color}
                              fontSize="2.5"
                              fontWeight="medium"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              style={{ 
                                transition: "opacity 0.15s ease",
                                opacity: isHovered ? 1 : 0
                              }}
                            >
                              {option.description}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Animated rings on opening (purely decorative) */}
                    {activeAnimation && segments.map((segment, i) => (
                      <motion.circle
                        key={`ring-${i}`}
                        cx="50"
                        cy="50"
                        r="20"
                        fill="none"
                        stroke={segment.option.color}
                        strokeWidth="0.3"
                        strokeOpacity="0.3"
                        initial={{ r: 20, opacity: 0.8 }}
                        animate={{ 
                          r: 49, 
                          opacity: 0,
                          transition: { 
                            delay: i * 0.05,
                            duration: 0.8 + i * 0.1,
                            ease: "easeOut" 
                          }
                        }}
                        onAnimationComplete={() => {
                          if (i === segments.length - 1) {
                            setActiveAnimation(false);
                          }
                        }}
                      />
                    ))}
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogPortal>
      </Dialog>

      {/* Associate Dialog */}
      <Dialog open={isAssociateDialogOpen} onOpenChange={setIsAssociateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Associate Face</DialogTitle>
            <DialogDescription>
              Enter a person ID to associate with the selected face.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="person-id">Person ID</Label>
              <Input 
                id="person-id" 
                value={personId} 
                onChange={(e) => setPersonId(e.target.value)}
                placeholder="Enter an ID (e.g., student_123)"
                className="col-span-3"
              />
            </div>
            
            {boundingBoxData && (
              <div className="text-xs text-gray-500 border rounded p-2 bg-gray-50">
                <p>Position: X={boundingBoxData.x}, Y={boundingBoxData.y}</p>
                <p>Size: {boundingBoxData.width}×{boundingBoxData.height}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssociateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssociateRequest}
              disabled={isAssociateLoading || !personId.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isAssociateLoading ? "Processing..." : "Associate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed bottom-8 right-8 z-50 bg-gray-800 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30 
            }}
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 