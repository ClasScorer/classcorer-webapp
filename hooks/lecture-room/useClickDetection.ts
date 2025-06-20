import { useState, useCallback } from "react";
import { EnhancedFaceData } from "@/types/lecture-room";
import { 
  ClickDetectionResult, 
  CanvasClickPosition 
} from "@/types/student-actions";
import { detectClickedFace } from "@/lib/utils/click-detection";

interface UseClickDetectionProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  detectedFaces: EnhancedFaceData[];
  isEnabled?: boolean;
}

interface UseClickDetectionReturn {
  handleCanvasClick: (event: MouseEvent | TouchEvent) => ClickDetectionResult | null;
  lastClickResult: ClickDetectionResult | null;
  clearLastClick: () => void;
  isProcessingClick: boolean;
}

export function useClickDetection({
  canvasRef,
  detectedFaces,
  isEnabled = true
}: UseClickDetectionProps): UseClickDetectionReturn {
  const [lastClickResult, setLastClickResult] = useState<ClickDetectionResult | null>(null);
  const [isProcessingClick, setIsProcessingClick] = useState(false);

  const handleCanvasClick = useCallback((
    event: MouseEvent | TouchEvent
  ): ClickDetectionResult | null => {
    if (!isEnabled || !canvasRef.current || detectedFaces.length === 0) {
      return null;
    }

    setIsProcessingClick(true);

    try {
      // Prevent event bubbling
      event.preventDefault();
      event.stopPropagation();

      const canvas = canvasRef.current;
      const result = detectClickedFace(event, canvas, detectedFaces);
      
      setLastClickResult(result);
      
      console.log('Click detection result:', {
        position: result.position,
        faceFound: !!result.face,
        isValid: result.isValidClick,
        faceId: result.face?.person_id
      });

      return result;
    } catch (error) {
      console.error('Error in click detection:', error);
      return null;
    } finally {
      setIsProcessingClick(false);
    }
  }, [isEnabled, canvasRef, detectedFaces]);

  const clearLastClick = useCallback(() => {
    setLastClickResult(null);
  }, []);

  return {
    handleCanvasClick,
    lastClickResult,
    clearLastClick,
    isProcessingClick
  };
} 