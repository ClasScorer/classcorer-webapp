import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteLectureDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  isDeleting: boolean
}

export function DeleteLectureDialog({
  isOpen,
  onOpenChange,
  onDelete,
  isDeleting
}: DeleteLectureDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Lecture</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this lecture? This action cannot be undone.
            All associated attendance, engagement data, and student metrics will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Lecture"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 