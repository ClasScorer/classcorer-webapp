"use client";

import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  onSubmit: (note: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function NoteDialog({
  open,
  onOpenChange,
  studentName,
  onSubmit,
  isSubmitting = false,
}: NoteDialogProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    if (error && e.target.value.trim()) {
      setError("");
    }
  };
  
  const handleSubmit = async () => {
    // Validate input
    if (!note.trim()) {
      setError("Please enter a note");
      return;
    }
    
    // Submit the note
    try {
      const success = await onSubmit(note.trim());
      if (success) {
        // Reset form and close dialog
        setNote("");
        setError("");
        onOpenChange(false);
      }
    } catch (err) {
      setError("Failed to save note. Please try again.");
    }
  };
  
  const handleClose = () => {
    // Reset form state on close
    setNote("");
    setError("");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note for {studentName}</DialogTitle>
          <DialogDescription>
            Add a note about this student's participation or behavior during the lecture.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note">
              Note
              {error && <span className="text-red-500 text-xs ml-2">{error}</span>}
            </Label>
            <Textarea
              id="note"
              placeholder="Enter your note here..."
              value={note}
              onChange={handleNoteChange}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !note.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 