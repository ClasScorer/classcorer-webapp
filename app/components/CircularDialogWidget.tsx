"use client";

import { useState } from "react";
import {
  Dialog,
  DialogPortal,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CircularDialogWidgetProps {
  onSelect?: (segmentIndex: number) => void;
  trigger?: React.ReactNode;
}

export function CircularDialogWidget({ 
  onSelect, 
  trigger = <Button>Open Circular Menu</Button> 
}: CircularDialogWidgetProps) {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSegmentClick = (segmentIndex: number) => {
    setSelectedSegment(segmentIndex);
    if (onSelect) {
      onSelect(segmentIndex);
    }
    // Close the dialog after a segment is selected
    setIsDialogOpen(false);
  };

  const segments = Array.from({ length: 8 }, (_, i) => i);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogPortal>
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setIsDialogOpen(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <svg width="300" height="300" viewBox="0 0 100 100" className="cursor-pointer">
              {/* Outer circle */}
              <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.5" fill="black" />
              
              {/* Inner circle */}
              <circle cx="50" cy="50" r="15" stroke="white" strokeWidth="0.5" fill="black" />
              
              {/* Segments */}
              {segments.map((segment) => {
                const angle = (segment * 45 * Math.PI) / 180;
                const startX = 50 + 15 * Math.cos(angle);
                const startY = 50 + 15 * Math.sin(angle);
                const endX = 50 + 40 * Math.cos(angle);
                const endY = 50 + 40 * Math.sin(angle);
                
                return (
                  <g key={segment}>
                    <line 
                      x1={startX} 
                      y1={startY} 
                      x2={endX} 
                      y2={endY} 
                      stroke="white" 
                      strokeWidth="0.5" 
                    />
                    <path 
                      d={`M ${startX} ${startY} L ${endX} ${endY} A 40 40 0 0 1 ${50 + 40 * Math.cos((segment + 1) * 45 * Math.PI / 180)} ${50 + 40 * Math.sin((segment + 1) * 45 * Math.PI / 180)} L ${50 + 15 * Math.cos((segment + 1) * 45 * Math.PI / 180)} ${50 + 15 * Math.sin((segment + 1) * 45 * Math.PI / 180)} A 15 15 0 0 0 ${startX} ${startY} Z`}
                      fill="black"
                      stroke="transparent"
                      onClick={() => handleSegmentClick(segment)}
                      className="segment-hitbox hover:fill-white hover:fill-opacity-20 transition-all duration-200"
                    />

                    {/* Optional: Add segment number/label */}
                    <text
                      x={50 + 28 * Math.cos(angle + Math.PI/8)}
                      y={50 + 28 * Math.sin(angle + Math.PI/8)}
                      fill="white"
                      fontSize="3"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {segment + 1}
                    </text>
                  </g>
                );
              })}
            </svg>

            {selectedSegment !== null && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-white text-sm mb-1">Selected: {selectedSegment + 1}</p>
              </div>
            )}
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
} 