"use client";

import { useState, useEffect } from "react";
import { EnhancedFaceData } from "@/types/lecture-room";
import { Student } from "@/lib/data";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  User, 
  Eye, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { useCourseStudents } from "@/hooks/dashboard/useCourseStudents";

interface StudentIdentificationDialogProps {
  isOpen: boolean;
  faceData: EnhancedFaceData | null;
  courseId: string;
  onConfirm: (studentId: string) => Promise<boolean>;
  onCancel: () => void;
}

export function StudentIdentificationDialog({
  isOpen,
  faceData,
  courseId,
  onConfirm,
  onCancel
}: StudentIdentificationDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    filteredStudents,
    isLoading,
    searchQuery,
    setSearchQuery,
    getStudentById
  } = useCourseStudents({ 
    courseId, 
    enabled: isOpen 
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedStudentId("");
      setIsSubmitting(false);
      setSearchQuery("");
    }
  }, [isOpen, setSearchQuery]);

  const selectedStudent = selectedStudentId ? getStudentById(selectedStudentId) : null;

  const handleConfirm = async () => {
    if (!selectedStudentId || !faceData) return;

    setIsSubmitting(true);
    try {
      const success = await onConfirm(selectedStudentId);
      if (success) {
        // Dialog will close via onCancel when parent handles success
      }
    } catch (error) {
      console.error('Error identifying student:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHandRaised = faceData?.hand_raising_status?.is_hand_raised;
  const isFocused = faceData?.attention_status === 'focused';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Identify Student
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Face Information */}
          {faceData && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Detected Person</p>
                  <p className="text-xs text-gray-500">
                    ID: {faceData.person_id.substring(0, 12)}...
                  </p>
                </div>
              </div>

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
                <Badge variant="secondary" className="text-xs">
                  Confidence: {Math.round(faceData.confidence * 100)}%
                </Badge>
              </div>

              {faceData.attentionMetrics && (
                <div className="text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Focus Score:</span>
                    <span className="font-medium">
                      {faceData.attentionMetrics.focusScore}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Student Search */}
          <div className="space-y-2">
            <Label htmlFor="student-search">Search Students</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="student-search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student-select">Select Student</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Loading students...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                {searchQuery ? 'No students found matching search' : 'No students available'}
              </div>
            ) : (
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback className="text-xs">
                            {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-xs text-gray-500">{student.email}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Student Preview */}
          {selectedStudent && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedStudent.avatar} />
                  <AvatarFallback>
                    {selectedStudent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedStudent.name}</p>
                  <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Please verify carefully</p>
              <p className="text-xs mt-1">
                This will link the detected face to the selected student for this lecture session.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStudentId || isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Identifying...
              </>
            ) : (
              'Confirm Identity'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 