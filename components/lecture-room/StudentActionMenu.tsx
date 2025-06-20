"use client";

import { useState } from "react";
import { EnhancedFaceData } from "@/types/lecture-room";
import { ClickPosition } from "@/types/student-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Plus, 
  Minus, 
  UserCheck, 
  MessageSquare,
  Award,
  AlertTriangle
} from "lucide-react";
import { getSuggestedPointValues } from "@/lib/utils/student-actions";

interface StudentActionMenuProps {
  isOpen: boolean;
  position: ClickPosition;
  faceData: EnhancedFaceData;
  studentId?: string;
  studentName?: string;
  onIdentifyClick: () => void;
  onAwardPoints: (points: number) => void;
  onDeductPoints: (points: number) => void;
  onMarkAttendance: () => void;
  onAddNote: () => void;
  onClose: () => void;
}

export function StudentActionMenu({
  isOpen,
  position,
  faceData,
  studentId,
  studentName,
  onIdentifyClick,
  onAwardPoints,
  onDeductPoints,
  onMarkAttendance,
  onAddNote,
  onClose
}: StudentActionMenuProps) {
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);

  if (!isOpen) return null;

  const isIdentified = faceData.recognition_status === 'known' && studentId;
  const isHandRaised = faceData.hand_raising_status?.is_hand_raised;
  const isFocused = faceData.attention_status === 'focused';
  const suggestedPoints = getSuggestedPointValues(faceData);

  // Convert normalized coordinates to pixels for positioning
  const menuStyle = {
    position: 'absolute' as const,
    left: `${position.x * 100}%`,
    top: `${position.y * 100}%`,
    zIndex: 50,
    transform: 'translate(-50%, -100%)',
    minWidth: '200px'
  };

  const handlePointAward = (points: number) => {
    setSelectedPoints(points);
    onAwardPoints(points);
    onClose();
  };

  const handlePointDeduct = (points: number) => {
    setSelectedPoints(Math.abs(points) * -1);
    onDeductPoints(Math.abs(points));
    onClose();
  };

  const handleAction = (actionFn: () => void) => {
    actionFn();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
      />
      
      {/* Menu */}
      <Card 
        className="bg-white shadow-lg border border-gray-200"
        style={menuStyle}
        data-context-menu
      >
        <CardContent className="p-3 space-y-3">
          {/* Header with face info */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {isIdentified ? studentName : 'Unknown Person'}
              </p>
              <p className="text-xs text-gray-500">
                ID: {faceData.person_id.substring(0, 8)}...
              </p>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-1">
            <Badge 
              variant={isFocused ? "default" : "secondary"}
              className="text-xs"
            >
              {faceData.attention_status}
            </Badge>
            {isHandRaised && (
              <Badge variant="outline" className="text-xs">
                Hand Raised
              </Badge>
            )}
            <Badge 
              variant={isIdentified ? "default" : "destructive"}
              className="text-xs"
            >
              {faceData.recognition_status}
            </Badge>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            {!isIdentified ? (
              // Identification actions
              <Button
                onClick={() => handleAction(onIdentifyClick)}
                className="w-full justify-start text-sm h-8"
                variant="outline"
              >
                <User className="w-4 h-4 mr-2" />
                Identify Student
              </Button>
            ) : (
              // Student management actions
              <>
                <div className="text-xs font-medium text-gray-700 mb-1">
                  Award Points
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {suggestedPoints.filter(p => p > 0).map((points) => (
                    <Button
                      key={points}
                      onClick={() => handlePointAward(points)}
                      className="h-7 text-xs"
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {points}
                    </Button>
                  ))}
                </div>

                <div className="text-xs font-medium text-gray-700 mb-1 mt-2">
                  Deduct Points
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {suggestedPoints.filter(p => p < 0).map((points) => (
                    <Button
                      key={points}
                      onClick={() => handlePointDeduct(points)}
                      className="h-7 text-xs"
                      variant="outline"
                      size="sm"
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      {Math.abs(points)}
                    </Button>
                  ))}
                </div>

                <Separator className="my-2" />

                <div className="space-y-1">
                  <Button
                    onClick={() => handleAction(onMarkAttendance)}
                    className="w-full justify-start text-sm h-8"
                    variant="outline"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Mark Attendance
                  </Button>

                  <Button
                    onClick={() => handleAction(onAddNote)}
                    className="w-full justify-start text-sm h-8"
                    variant="outline"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Quick info */}
          {faceData.attentionMetrics && (
            <>
              <Separator />
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Focus Score:</span>
                  <span className="font-medium">
                    {faceData.attentionMetrics.focusScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Engagement:</span>
                  <Badge 
                    variant={
                      faceData.attentionMetrics.engagementLevel === 'high' ? 'default' :
                      faceData.attentionMetrics.engagementLevel === 'medium' ? 'secondary' :
                      'destructive'
                    }
                    className="text-xs h-4"
                  >
                    {faceData.attentionMetrics.engagementLevel}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
} 