"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getCanvasStatus } from "@/lib/data";

interface CanvasImportButtonProps {
  courseId: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function CanvasImportButton({ courseId, variant = "outline", size = "default" }: CanvasImportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  
  useEffect(() => {
    // Check if Canvas integration is active
    async function checkCanvasStatus() {
      try {
        const status = await getCanvasStatus();
        setCanvasActive(status.isActive);
      } catch (error) {
        console.error("Error checking Canvas status:", error);
        setCanvasActive(false);
      }
    }
    
    checkCanvasStatus();
  }, []);
  
  // If Canvas is not active, don't render anything
  if (!canvasActive) return null;
  
  const handleImport = async () => {
    setIsLoading(true);
    
    try {
      let endpoint = courseId === "all" 
        ? `/api/canvas/config` 
        : `/api/canvas/courses/${courseId}/sync`;
      
      const method = courseId === "all" ? "PATCH" : "POST";
      const body = courseId === "all" 
        ? JSON.stringify({ action: 'sync' })
        : undefined;
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to import data from Canvas");
      }
      
      toast.success("Successfully imported data from Canvas");
    } catch (error) {
      console.error("Error importing from Canvas:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import data from Canvas");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Customize button text based on courseId
  const buttonText = courseId === "all" 
    ? "Sync All Canvas Data" 
    : "Import from Canvas";
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleImport}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {courseId === "all" ? "Syncing..." : "Importing..."}
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
} 