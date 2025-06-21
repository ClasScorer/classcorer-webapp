import { EnhancedFaceData } from "@/types/lecture-room";
import { ClickPosition, CanvasClickPosition, ClickDetectionResult } from "@/types/student-actions";

/**
 * Converts mouse/touch event coordinates to canvas coordinates
 */
export function convertEventToCanvasCoordinates(
  event: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): CanvasClickPosition {
  const rect = canvas.getBoundingClientRect();
  let clientX: number, clientY: number;

  if ('touches' in event) {
    // Touch event
    clientX = event.touches[0]?.clientX || event.changedTouches[0]?.clientX || 0;
    clientY = event.touches[0]?.clientY || event.changedTouches[0]?.clientY || 0;
  } else {
    // Mouse event
    clientX = event.clientX;
    clientY = event.clientY;
  }

  // Convert to canvas coordinates
  const canvasX = clientX - rect.left;
  const canvasY = clientY - rect.top;

  // Normalize coordinates (0-1 range)
  const normalizedX = canvasX / rect.width;
  const normalizedY = canvasY / rect.height;

  return {
    x: normalizedX,
    y: normalizedY,
    canvasX,
    canvasY,
    timestamp: Date.now()
  };
}

/**
 * Checks if a point is within a bounding box
 */
export function isPointInBoundingBox(
  point: ClickPosition,
  boundingBox: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= boundingBox.x &&
    point.x <= boundingBox.x + boundingBox.width &&
    point.y >= boundingBox.y &&
    point.y <= boundingBox.y + boundingBox.height
  );
}

/**
 * Finds the face that was clicked based on coordinates
 */
export function findClickedFace(
  clickPosition: ClickPosition,
  detectedFaces: EnhancedFaceData[]
): EnhancedFaceData | null {
  // Find faces that contain the click position
  const candidateFaces = detectedFaces.filter(face =>
    isPointInBoundingBox(clickPosition, face.bounding_box)
  );

  if (candidateFaces.length === 0) {
    return null;
  }

  // If multiple faces overlap, return the smallest one (most specific)
  return candidateFaces.reduce((smallest, current) => {
    const smallestArea = smallest.bounding_box.width * smallest.bounding_box.height;
    const currentArea = current.bounding_box.width * current.bounding_box.height;
    return currentArea < smallestArea ? current : smallest;
  });
}

/**
 * Validates if a click is within acceptable bounds
 */
export function validateClickPosition(position: CanvasClickPosition): boolean {
  return (
    position.x >= 0 &&
    position.x <= 1 &&
    position.y >= 0 &&
    position.y <= 1 &&
    position.canvasX >= 0 &&
    position.canvasY >= 0
  );
}

/**
 * Calculates the center point of a bounding box
 */
export function getBoundingBoxCenter(
  boundingBox: { x: number; y: number; width: number; height: number }
): ClickPosition {
  return {
    x: boundingBox.x + boundingBox.width / 2,
    y: boundingBox.y + boundingBox.height / 2
  };
}

/**
 * Calculates the distance between two points
 */
export function calculateDistance(point1: ClickPosition, point2: ClickPosition): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Main click detection function that combines all validation
 */
export function detectClickedFace(
  event: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement,
  detectedFaces: EnhancedFaceData[]
): ClickDetectionResult {
  const position = convertEventToCanvasCoordinates(event, canvas);
  const isValid = validateClickPosition(position);
  
  if (!isValid) {
    return {
      face: null,
      position,
      isValidClick: false
    };
  }

  const clickedFace = findClickedFace(position, detectedFaces);

  return {
    face: clickedFace,
    position,
    isValidClick: clickedFace !== null
  };
} 