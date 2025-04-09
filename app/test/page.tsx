"use client";

import { CircularDialogWidget } from "@/app/components/CircularDialogWidget";
import { Button } from "@/components/ui/button";

export default function TestPage() {
  const handleSelectSegment = (segmentIndex: number) => {
    console.log(`Selected segment: ${segmentIndex + 1}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-white">
      <h1 className="text-2xl font-bold mb-8">Circular Dialog Widget</h1>
      
      <div className="p-8 border border-gray-700 rounded-lg bg-gray-900/50 flex flex-col items-center">
        <h2 className="text-lg mb-6">Click the button to open the circular menu</h2>
        
        <CircularDialogWidget 
          onSelect={handleSelectSegment} 
          trigger={
            <Button className="px-6 py-4 text-lg">
              Open Circular Menu
            </Button>
          }
        />
        
        <p className="mt-6 text-gray-400 text-sm">
          When the circular menu appears, click on any segment to select it
        </p>
      </div>
    </div>
  );
}
