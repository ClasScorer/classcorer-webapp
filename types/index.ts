export interface Deadzone {
  id: string;
  professorId: string;
  coordinates: { x: number; y: number; width: number; height: number }[]; // Change to an array
  originalImage: string;
  modifiedImage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CameraViewProps {
  isEditing: boolean;
  onSave: (deadzone: Omit<Deadzone, 'id' | 'professorId' | 'createdAt' | 'updatedAt'>) => void;
  currentDeadzone?: Deadzone;
}