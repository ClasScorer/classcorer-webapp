import { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Sample activity log item type
type ActivityLogItem = {
  id: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'warning' | 'error' | 'success';
};

interface SlidesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  presentationId?: string;
  lectureId?: string;
  embedUrl?: string;
}

export default function SlidesPopup({ 
  isOpen, 
  onClose,
  className,
  presentationId,
  lectureId,
  embedUrl
}: SlidesPopupProps) {
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Toggle fullscreen function
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullScreen(true))
        .catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullScreen(false))
          .catch(err => {
            console.error(`Error attempting to exit fullscreen: ${err.message}`);
          });
      }
    }
  };

  // Example useEffect for demonstration - could fetch or subscribe to real-time events
  useEffect(() => {
    if (isOpen) {
      // Demo data, in a real app would be replaced with actual data source
      const demoActivities: ActivityLogItem[] = [
        { id: '1', message: 'Session started', timestamp: new Date(), type: 'info' },
        { id: '2', message: 'Slide 1 loaded', timestamp: new Date(), type: 'success' },
      ];
      
      setActivityLog(demoActivities);
      
      // Simulate receiving new activities
      const interval = setInterval(() => {
        const types: ActivityLogItem['type'][] = ['info', 'warning', 'error', 'success'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        const newActivity = {
          id: Math.random().toString(36).substring(2, 9),
          message: `Activity ${new Date().toLocaleTimeString()}`,
          timestamp: new Date(),
          type: randomType
        };
        
        setActivityLog(prev => [...prev, newActivity]);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Listen for fullscreen changes initiated by browser (e.g., Escape key)
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center",
      className
    )}>
      <div className="bg-background rounded-lg border shadow-lg w-full h-[95vh] max-w-[95vw] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-semibold">Presentation Slides</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleFullScreen}
              title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content area (70%) */}
          <div className="w-[70%] h-full p-4 overflow-auto">
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full p-6">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title="Presentation"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-xl text-muted-foreground">Slides content will appear here</p>
                    <p className="text-sm text-muted-foreground">This area will display presentation slides</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Activity log (30%) */}
          <div className="w-[30%] h-full border-l overflow-hidden flex flex-col">
            <div className="bg-muted/50 p-3">
              <h3 className="font-medium">Activity Log</h3>
            </div>
            <Separator />
            
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {activityLog.length === 0 ? (
                  <p className="text-muted-foreground text-center p-4">No activity yet</p>
                ) : (
                  activityLog.map((activity) => (
                    <ActivityLogEntry key={activity.id} activity={activity} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityLogEntry({ activity }: { activity: ActivityLogItem }) {
  const typeStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-300",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-300",
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-300"
  };

  return (
    <div className={cn(
      "p-3 rounded-md border",
      activity.type ? typeStyles[activity.type] : "bg-card border-border"
    )}>
      <p className="text-sm font-medium">{activity.message}</p>
      <p className="text-xs opacity-70 mt-1">
        {activity.timestamp.toLocaleTimeString()}
      </p>
    </div>
  );
}