"use client";

import { CircularDialogWidget } from "@/app/components/CircularDialogWidget";
import { Button } from "@/components/ui/button";

export default function TestPage() {
  const handleSelectSegment = (segmentIndex: number) => {
    console.log(`Selected segment: ${segmentIndex + 1}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-white text-purple-900">
      
      <div className="p-8 border border-purple-200 rounded-lg bg-white/70 shadow-xl flex flex-col items-center">
        <h2 className="text-lg mb-6">Test the menu</h2>
        
        <CircularDialogWidget 
          onSelect={handleSelectSegment} 
          trigger={
            <Button className="px-6 py-4 text-lg bg-purple-600 hover:bg-purple-700">
              Open Circular Menu
            </Button>
          }
        />
      </div>
    </div>
  );
}
