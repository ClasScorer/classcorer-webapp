import { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ActivityEvent } from '@/hooks/lecture-room/useLectureEvents';

interface SlidesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  presentationId?: string;
  lectureId?: string;
  embedUrl?: string;
  activityEvents?: ActivityEvent[];
}

export default function SlidesPopup({ 
  isOpen, 
  onClose,
  className,
  presentationId,
  lectureId,
  embedUrl,
  activityEvents = []
}: SlidesPopupProps) {
  const [liveActivityEvents, setLiveActivityEvents] = useState<ActivityEvent[]>(activityEvents);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
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

  // Fetch activity log from API when lectureId is available
  useEffect(() => {
    if (!lectureId || !isOpen) return;

    const fetchActivityLog = async () => {
      try {
        setIsLoadingEvents(true);
        const response = await fetch(`/api/lectures/${lectureId}/activity-log?limit=100`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.activityLog) {
            // Transform API data to ActivityEvent format
            const transformedEvents: ActivityEvent[] = data.activityLog.map((log: any) => ({
              id: log.id,
              type: log.type === 'action' ? 'info' : log.type,
              message: log.message,
              timestamp: new Date(log.timestamp),
              student: log.student
            }));
            
            setLiveActivityEvents(transformedEvents);
          }
        }
      } catch (error) {
        console.error('Error fetching activity log:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    // Initial fetch
    fetchActivityLog();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchActivityLog, 3000);
    
    return () => clearInterval(interval);
  }, [lectureId, isOpen]);

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
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Activity Log</h3>
                <div className="flex items-center gap-2">
                  {lectureId && (
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-muted-foreground">Live</span>
                    </div>
                  )}
                  {liveActivityEvents.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {liveActivityEvents.length} events
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Separator />
            
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {isLoadingEvents && liveActivityEvents.length === 0 ? (
                  <div className="text-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground text-sm">Loading activity...</p>
                  </div>
                ) : liveActivityEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center p-4">No activity yet</p>
                ) : (
                  liveActivityEvents.map((activity) => (
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

function ActivityLogEntry({ activity }: { activity: ActivityEvent }) {
  const typeStyles = {
    attention: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300",
    "hand-raising": "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-300",
    system: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950 dark:border-purple-900 dark:text-purple-300",
    info: "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950 dark:border-gray-900 dark:text-gray-300",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-300",
    engagement: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300",
    action: "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-900 dark:text-orange-300"
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attention': return '👁️';
      case 'hand-raising': return '✋';
      case 'engagement': return '🎯';
      case 'action': return '⭐';
      case 'system': return '⚙️';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  // Check if timestamp is recent (within last 10 seconds)
  const isRecent = activity.timestamp && 
    (Date.now() - activity.timestamp.getTime()) < 10000;

  return (
    <div className={cn(
      "p-3 rounded-md border transition-all duration-300",
      activity.type ? typeStyles[activity.type] : "bg-card border-border",
      isRecent && "ring-2 ring-primary/20 shadow-md"
    )}>
      <div className="flex items-start gap-2">
        <span className="text-sm">{getActivityIcon(activity.type || 'info')}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{activity.message}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs opacity-70">
              {activity.timestamp.toLocaleTimeString()}
            </p>
            {isRecent && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}