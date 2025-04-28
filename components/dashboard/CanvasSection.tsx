import { Suspense } from "react";
import { CanvasIntegration } from "@/components/dashboard/canvas-integration";

interface CanvasSectionProps {
  isActive: boolean;
}

export function CanvasSection({ isActive }: CanvasSectionProps) {
  if (!isActive) return null;
  
  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Integrations</h3>
      </div>
      <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading Canvas integration...</div>}>
        <CanvasIntegration />
      </Suspense>
    </div>
  );
} 