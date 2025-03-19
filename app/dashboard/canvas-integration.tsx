"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CanvasConfig {
  id?: string;
  apiUrl: string;
  apiToken: string;
  isActive: boolean;
  lastSyncedAt?: string | null;
}

export function CanvasIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [error, setError] = useState("");
  const [useCanvas, setUseCanvas] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  
  // Load Canvas config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/canvas/config');
        if (response.ok) {
          const config: CanvasConfig = await response.json();
          if (config.id) {
            setApiUrl(config.apiUrl || "");
            setApiToken(config.apiToken || "");
            setIsConnected(true);
            setUseCanvas(config.isActive);
            
            if (config.lastSyncedAt) {
              setLastSynced(new Date(config.lastSyncedAt).toLocaleString());
            }
          }
        }
      } catch (error) {
        console.error('Error loading Canvas config:', error);
      }
    }
    
    loadConfig();
  }, []);

  const handleConnect = async () => {
    if (!apiUrl || !apiToken) {
      setError("Please enter both Canvas API URL and API token");
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      // Save Canvas configuration using API
      const response = await fetch('/api/canvas/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiUrl, apiToken })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect to Canvas');
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting to Canvas:', error);
      setError(error instanceof Error ? error.message : "Failed to connect to Canvas");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggleCanvas = async (checked: boolean) => {
    // If enabling Canvas, ensure we're connected first
    if (checked && !isConnected) {
      setError("Please connect to Canvas first");
      return;
    }
    
    try {
      const response = await fetch('/api/canvas/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'setActive', isActive: checked })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update Canvas integration settings');
      }
      
      setUseCanvas(checked);
      setError("");
    } catch (error) {
      console.error('Error toggling Canvas integration:', error);
      setError(error instanceof Error ? error.message : "Failed to update Canvas integration settings");
    }
  };
  
  const handleSyncData = async () => {
    if (!isConnected) {
      setError("Please connect to Canvas first");
      return;
    }
    
    setIsSyncing(true);
    setError("");
    
    try {
      const response = await fetch('/api/canvas/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'sync' })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to synchronize data from Canvas');
      }
      
      const config: CanvasConfig = await response.json();
      if (config.lastSyncedAt) {
        setLastSynced(new Date(config.lastSyncedAt).toLocaleString());
      }
    } catch (error) {
      console.error('Error syncing Canvas data:', error);
      setError(error instanceof Error ? error.message : "Failed to synchronize data from Canvas");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Canvas LMS Integration</CardTitle>
        <CardDescription>
          Connect your dashboard to Canvas LMS to import courses, students, and assignments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            <span>
              {isConnected ? "Connected to Canvas LMS" : "Not connected to Canvas LMS"}
            </span>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                {isConnected ? "Update Connection" : "Connect to Canvas"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Canvas LMS Integration</DialogTitle>
                <DialogDescription>
                  Enter your Canvas LMS API details to connect your dashboard.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apiUrl" className="text-right">
                    API URL
                  </Label>
                  <Input
                    id="apiUrl"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://canvas.instructure.com/api/v1"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apiToken" className="text-right">
                    API Token
                  </Label>
                  <Input
                    id="apiToken"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    type="password"
                    placeholder="Canvas API token"
                    className="col-span-3"
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm mt-2">{error}</div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {isConnected && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="use-canvas" 
                checked={useCanvas}
                onCheckedChange={handleToggleCanvas}
              />
              <Label htmlFor="use-canvas">Use Canvas data instead of internal data</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              When enabled, the dashboard will display data from Canvas LMS instead of the internal database.
            </p>
            
            <div className="pt-4 border-t mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Data Synchronization</h4>
                  <p className="text-sm text-muted-foreground">
                    Manually sync data from Canvas LMS
                    {lastSynced && <span> (Last synced: {lastSynced})</span>}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSyncData}
                  disabled={isSyncing || !isConnected}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 