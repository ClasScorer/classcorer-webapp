import { useState, useCallback, useEffect } from "react";
import { EnhancedFaceData } from "@/types/lecture-room";
import { ClickPosition, ActionMenuState } from "@/types/student-actions";

interface UseContextMenuProps {
  containerRef?: React.RefObject<HTMLElement>;
}

interface UseContextMenuReturn {
  menuState: ActionMenuState;
  openMenu: (face: EnhancedFaceData, position: ClickPosition, studentId?: string) => void;
  closeMenu: () => void;
  updateMenuPosition: (position: ClickPosition) => void;
  isMenuOpen: boolean;
}

export function useContextMenu({
  containerRef
}: UseContextMenuProps = {}): UseContextMenuReturn {
  const [menuState, setMenuState] = useState<ActionMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    targetFace: null,
    targetStudentId: undefined
  });

  const calculateOptimalPosition = useCallback((
    requestedPosition: ClickPosition
  ): ClickPosition => {
    if (!containerRef?.current) {
      return requestedPosition;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Menu dimensions (estimated)
    const menuWidth = 200;
    const menuHeight = 250;
    
    // Calculate optimal position to avoid edges
    let { x, y } = requestedPosition;
    
    // Convert normalized coordinates to pixel coordinates
    const pixelX = x * containerRect.width;
    const pixelY = y * containerRect.height;
    
    // Adjust if menu would go off right edge
    if (pixelX + menuWidth > containerRect.width) {
      x = (containerRect.width - menuWidth) / containerRect.width;
    }
    
    // Adjust if menu would go off bottom edge
    if (pixelY + menuHeight > containerRect.height) {
      y = (containerRect.height - menuHeight) / containerRect.height;
    }
    
    // Ensure minimum distance from edges
    const minMargin = 10;
    x = Math.max(minMargin / containerRect.width, x);
    y = Math.max(minMargin / containerRect.height, y);
    
    return { x, y };
  }, [containerRef]);

  const openMenu = useCallback((
    face: EnhancedFaceData, 
    position: ClickPosition,
    studentId?: string
  ) => {
    const optimalPosition = calculateOptimalPosition(position);
    
    setMenuState({
      isOpen: true,
      position: optimalPosition,
      targetFace: face,
      targetStudentId: studentId
    });
    
    console.log('Context menu opened:', {
      faceId: face.person_id,
      position: optimalPosition,
      studentId
    });
  }, [calculateOptimalPosition]);

  const closeMenu = useCallback(() => {
    setMenuState(prev => ({
      ...prev,
      isOpen: false,
      targetFace: null,
      targetStudentId: undefined
    }));
    
    console.log('Context menu closed');
  }, []);

  const updateMenuPosition = useCallback((position: ClickPosition) => {
    const optimalPosition = calculateOptimalPosition(position);
    
    setMenuState(prev => ({
      ...prev,
      position: optimalPosition
    }));
  }, [calculateOptimalPosition]);

  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuState.isOpen) {
        closeMenu();
      }
    };

    if (menuState.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [menuState.isOpen, closeMenu]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuState.isOpen && containerRef?.current) {
        const target = event.target as Element;
        const menuElement = document.querySelector('[data-context-menu]');
        
        if (menuElement && !menuElement.contains(target)) {
          closeMenu();
        }
      }
    };

    if (menuState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuState.isOpen, closeMenu, containerRef]);

  return {
    menuState,
    openMenu,
    closeMenu,
    updateMenuPosition,
    isMenuOpen: menuState.isOpen
  };
} 