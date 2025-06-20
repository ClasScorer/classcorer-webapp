"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Plus, 
  Minus, 
  Award,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { validatePointValue, DEFAULT_ACTION_CONFIG } from "@/lib/utils/student-actions";

interface PointAwardDialogProps {
  isOpen: boolean;
  studentName: string;
  suggestedPoints: number[];
  onConfirm: (points: number, reason: string) => Promise<boolean>;
  onCancel: () => void;
  mode?: 'award' | 'deduct';
}

export function PointAwardDialog({
  isOpen,
  studentName,
  suggestedPoints,
  onConfirm,
  onCancel,
  mode = 'award'
}: PointAwardDialogProps) {
  const [selectedPoints, setSelectedPoints] = useState<number>(0);
  const [customPoints, setCustomPoints] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPoints(0);
      setCustomPoints("");
      setReason("");
      setUseCustom(false);
      setIsSubmitting(false);
      setError("");
    } else {
      // Set default reason based on mode
      setReason(mode === 'award' ? 'Manual point award' : 'Manual point deduction');
      
      // Set first suggested point as default
      const defaultPoints = mode === 'award' 
        ? suggestedPoints.find(p => p > 0) || 5
        : Math.abs(suggestedPoints.find(p => p < 0) || -2);
      setSelectedPoints(defaultPoints);
    }
  }, [isOpen, mode, suggestedPoints]);

  const finalPoints = useCustom && customPoints ? parseInt(customPoints) || 0 : selectedPoints;
  const actualPoints = mode === 'deduct' ? -Math.abs(finalPoints) : Math.abs(finalPoints);

  // Validate points
  const validation = validatePointValue(actualPoints, mode);

  const handleConfirm = async () => {
    if (!validation.isValid) {
      setError(validation.error || 'Invalid point value');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const success = await onConfirm(actualPoints, reason.trim());
      if (success) {
        // Dialog will close via onCancel when parent handles success
      }
    } catch (error) {
      console.error('Error awarding/deducting points:', error);
      setError('Failed to process request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const relevantSuggestedPoints = mode === 'award' 
    ? suggestedPoints.filter(p => p > 0)
    : suggestedPoints.filter(p => p < 0).map(p => Math.abs(p));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'award' ? (
              <Plus className="w-5 h-5 text-green-600" />
            ) : (
              <Minus className="w-5 h-5 text-red-600" />
            )}
            {mode === 'award' ? 'Award Points' : 'Deduct Points'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{studentName}</span>
            </div>
          </div>

          {/* Point Selection */}
          <div className="space-y-3">
            <Label>Select Points</Label>
            
            <RadioGroup
              value={useCustom ? "custom" : selectedPoints.toString()}
              onValueChange={(value) => {
                if (value === "custom") {
                  setUseCustom(true);
                } else {
                  setUseCustom(false);
                  setSelectedPoints(parseInt(value));
                }
              }}
            >
              {/* Suggested Points */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Suggested Values
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {relevantSuggestedPoints.map((points) => (
                    <div key={points} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={points.toString()} 
                        id={`points-${points}`} 
                      />
                      <Label 
                        htmlFor={`points-${points}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-center h-8 px-2 bg-gray-100 rounded border">
                          <span className="text-sm font-medium">
                            {mode === 'award' ? '+' : '-'}{points}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Points */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom-points" />
                  <Label htmlFor="custom-points" className="text-sm font-medium">
                    Custom Amount
                  </Label>
                </div>
                
                {useCustom && (
                  <div className="ml-6">
                    <Input
                      type="number"
                      placeholder="Enter points..."
                      value={customPoints}
                      onChange={(e) => setCustomPoints(e.target.value)}
                      min="1"
                      max={DEFAULT_ACTION_CONFIG.maxCustomPoints}
                      className="w-24"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max: {DEFAULT_ACTION_CONFIG.maxCustomPoints} points
                    </p>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              {reason.length}/200 characters
            </p>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Final Amount:</span>
              <Badge 
                variant={mode === 'award' ? "default" : "destructive"}
                className="text-sm"
              >
                {mode === 'award' ? '+' : ''}{actualPoints} points
              </Badge>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Error</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Validation Warning */}
          {!validation.isValid && !error && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Invalid Input</p>
                <p className="text-xs mt-1">{validation.error}</p>
              </div>
            </div>
          )}
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
            disabled={!validation.isValid || !reason.trim() || isSubmitting}
            variant={mode === 'award' ? "default" : "destructive"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                {mode === 'award' ? (
                  <Plus className="w-4 h-4 mr-2" />
                ) : (
                  <Minus className="w-4 h-4 mr-2" />
                )}
                {mode === 'award' ? 'Award' : 'Deduct'} Points
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 