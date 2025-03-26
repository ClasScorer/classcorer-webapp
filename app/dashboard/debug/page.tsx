"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Globe, Database, Terminal, Shield, Cpu, RefreshCw, History, Sparkles, Wifi, Smartphone, Palette, Zap, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function DebugPage() {
  const { data: session, status, update } = useSession();
  const { theme, setTheme } = useTheme();
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [jwtDecoded, setJwtDecoded] = useState<any>(null);
  const [networkRequests, setNetworkRequests] = useState<any[]>([]);
  const [localStorageItems, setLocalStorageItems] = useState<any[]>([]);
  const [apiTestResults, setApiTestResults] = useState<any[]>([]);
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [errorBoundaryTest, setErrorBoundaryTest] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [networkSpeed, setNetworkSpeed] = useState<{ download: number; upload: number } | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [browserCompatibility, setBrowserCompatibility] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  useEffect(() => {
    // Get browser info
    const browser = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
      cookieEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
      doNotTrack: navigator.doNotTrack,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio,
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    setBrowserInfo(browser);

    // Get performance metrics
    if ('performance' in window) {
      const perf = {
        navigation: window.performance.timing ? {
          loadTime: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
          domReadyTime: window.performance.timing.domInteractive - window.performance.timing.navigationStart,
          readyStart: window.performance.timing.fetchStart - window.performance.timing.navigationStart,
          redirectTime: window.performance.timing.redirectEnd - window.performance.timing.redirectStart,
          appcacheTime: window.performance.timing.domainLookupStart - window.performance.timing.fetchStart,
          connectTime: window.performance.timing.connectEnd - window.performance.timing.connectStart,
        } : {},
        memory: (window.performance as any).memory ? {
          jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit,
          totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
          usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
        } : {},
      };
      setPerformanceMetrics(perf);
    }

    // Decode JWT if present in session
    if (session) {
      const token = localStorage.getItem('next-auth.session-token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          setJwtDecoded(JSON.parse(jsonPayload));
        } catch (e) {
          console.error('Failed to decode JWT', e);
        }
      }
    }

    // Get localStorage items
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          items.push({
            key,
            value: localStorage.getItem(key),
            size: new Blob([localStorage.getItem(key) || '']).size
          });
        } catch (e) {
          items.push({ key, value: '[Error reading value]', size: 0 });
        }
      }
    }
    setLocalStorageItems(items);

    // Get cache status
    if ('caches' in window) {
      caches.keys().then(keys => {
        setCacheStatus({
          available: true,
          keys: keys,
          total: keys.length
        });
      });
    } else {
      setCacheStatus({
        available: false,
        keys: [],
        total: 0
      });
    }

    // Monitor network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const request = {
          url: args[0] instanceof Request ? args[0].url : args[0],
          method: args[0] instanceof Request ? args[0].method : 'GET',
          status: response.status,
          duration: Math.round(endTime - startTime),
          timestamp: new Date().toISOString()
        };
        setNetworkRequests(prev => [...prev.slice(-9), request]);
        return response;
      } catch (error) {
        const endTime = performance.now();
        const request = {
          url: args[0] instanceof Request ? args[0].url : args[0],
          method: args[0] instanceof Request ? args[0].method : 'GET',
          status: 'error',
          error: error.message,
          duration: Math.round(endTime - startTime),
          timestamp: new Date().toISOString()
        };
        setNetworkRequests(prev => [...prev.slice(-9), request]);
        throw error;
      }
    };

    // Get device information
    const device = {
      type: /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      platform: navigator.platform,
      vendor: navigator.vendor,
      maxTouchPoints: navigator.maxTouchPoints,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      battery: (navigator as any).getBattery ? 'available' : 'not available',
      connection: (navigator as any).connection ? {
        type: (navigator as any).connection.type,
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
      } : 'not available',
    };
    setDeviceInfo(device);

    // Check browser compatibility
    const compatibility = {
      webGL: (() => {
        try {
          return !!document.createElement('canvas').getContext('webgl');
        } catch (e) {
          return false;
        }
      })(),
      webRTC: !!window.RTCPeerConnection,
      webSocket: 'WebSocket' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      webShare: 'share' in navigator,
      webAssembly: typeof WebAssembly === 'object',
      webGL2: (() => {
        try {
          return !!document.createElement('canvas').getContext('webgl2');
        } catch (e) {
          return false;
        }
      })(),
    };
    setBrowserCompatibility(compatibility);

    // Monitor system metrics
    const updateSystemMetrics = () => {
      if ('performance' in window) {
        const metrics = {
          memory: (window.performance as any).memory ? {
            jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit,
            totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
            usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
          } : null,
          timing: window.performance.timing ? {
            loadTime: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
            domReadyTime: window.performance.timing.domInteractive - window.performance.timing.navigationStart,
            readyStart: window.performance.timing.fetchStart - window.performance.timing.navigationStart,
            redirectTime: window.performance.timing.redirectEnd - window.performance.timing.redirectStart,
            appcacheTime: window.performance.timing.domainLookupStart - window.performance.timing.fetchStart,
            connectTime: window.performance.timing.connectEnd - window.performance.timing.connectStart,
          } : null,
          navigation: window.performance.navigation ? {
            type: window.performance.navigation.type,
            redirectCount: window.performance.navigation.redirectCount,
          } : null,
        };
        setSystemMetrics(metrics);
      }
    };

    const metricsInterval = setInterval(updateSystemMetrics, 1000);
    updateSystemMetrics();

    return () => {
      clearInterval(metricsInterval);
      window.fetch = originalFetch;
    };
  }, [session]);

  // Get server info
  useEffect(() => {
    const getServerInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/debug/server-info');
        if (response.ok) {
          const data = await response.json();
          setServerInfo(data);
          addLogEntry(`Server info updated: ${data.nodeEnv} environment`);
        } else {
          console.error('Failed to fetch server info');
          addLogEntry('Failed to fetch server info');
        }
      } catch (error) {
        console.error('Error fetching server info:', error);
        addLogEntry(`Error fetching server info: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    getServerInfo();
  }, []);

  const refreshSession = async () => {
    try {
      addLogEntry('Refreshing session...');
      await update();
      toast.success("Session refreshed successfully");
      addLogEntry('Session refreshed successfully');
    } catch (error) {
      toast.error("Failed to refresh session");
      addLogEntry(`Failed to refresh session: ${error}`);
    }
  };

  const addLogEntry = (entry: string) => {
    const timestamp = new Date().toISOString();
    setLogEntries(prev => [...prev, `[${timestamp}] ${entry}`]);
  };

  const clearAllCookies = () => {
    try {
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      toast.success("Cookies cleared (client-side only)");
      addLogEntry('Cleared all cookies');
    } catch (error) {
      toast.error("Failed to clear cookies");
      addLogEntry(`Failed to clear cookies: ${error}`);
    }
  };

  const getMemoryUsagePercentage = () => {
    if (performanceMetrics?.memory?.totalJSHeapSize && performanceMetrics?.memory?.jsHeapSizeLimit) {
      return Math.round((performanceMetrics.memory.totalJSHeapSize / performanceMetrics.memory.jsHeapSizeLimit) * 100);
    }
    return 0;
  };

  // Calculate memory usage for display
  const memoryUsagePercent = getMemoryUsagePercentage();
  
  const testApiEndpoint = async (endpoint: string) => {
    try {
      const startTime = performance.now();
      const response = await fetch(endpoint);
      const endTime = performance.now();
      const result = {
        endpoint,
        status: response.status,
        duration: Math.round(endTime - startTime),
        timestamp: new Date().toISOString(),
        success: response.ok
      };
      setApiTestResults(prev => [...prev.slice(-4), result]);
      addLogEntry(`API test for ${endpoint}: ${response.ok ? 'Success' : 'Failed'}`);
    } catch (error) {
      const result = {
        endpoint,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      };
      setApiTestResults(prev => [...prev.slice(-4), result]);
      addLogEntry(`API test for ${endpoint} failed: ${error}`);
    }
  };

  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      setLocalStorageItems([]);
      toast.success("Local storage cleared");
      addLogEntry('Local storage cleared');
    } catch (error) {
      toast.error("Failed to clear local storage");
      addLogEntry(`Failed to clear local storage: ${error}`);
    }
  };

  const clearCache = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        setCacheStatus(prev => ({ ...prev, keys: [], total: 0 }));
        toast.success("Cache cleared");
        addLogEntry('Cache cleared');
      }
    } catch (error) {
      toast.error("Failed to clear cache");
      addLogEntry(`Failed to clear cache: ${error}`);
    }
  };

  const triggerErrorBoundary = () => {
    setErrorBoundaryTest(true);
    throw new Error('Test error for error boundary');
  };

  const testNetworkSpeed = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      const response = await fetch('https://speed.cloudflare.com/__down');
      const endTime = performance.now();
      const duration = endTime - startTime;
      const fileSize = 25 * 1024 * 1024; // 25MB test file
      const speedMbps = (fileSize * 8) / (duration * 1000000);
      setNetworkSpeed({ download: speedMbps, upload: 0 }); // Upload test would require a different endpoint
      addLogEntry(`Network speed test completed: ${speedMbps.toFixed(2)} Mbps`);
    } catch (error) {
      addLogEntry(`Network speed test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    addLogEntry(`Theme switched to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Debug Console</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor and debug your application in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="theme-switch">Dark Mode</Label>
            <Switch id="theme-switch" checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
          <Button variant="outline" size="sm" onClick={() => getServerInfo()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" onClick={clearAllCookies}>
            <History className="h-4 w-4 mr-2" />
            Clear Cookies
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Terminal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverInfo ? "Online" : "Checking..."}</div>
            <p className="text-xs text-muted-foreground">
              Last checked: {serverInfo ? new Date().toLocaleTimeString() : "Never"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMemoryUsagePercentage()}%</div>
            <Progress value={getMemoryUsagePercentage()} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverInfo?.database?.connected ? "Connected" : "Checking..."}</div>
            <p className="text-xs text-muted-foreground">
              Provider: {serverInfo?.database?.provider || "Unknown"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status === "authenticated" ? "Active" : "Inactive"}</div>
            <p className="text-xs text-muted-foreground">
              Session: {session ? "Valid" : "Not found"}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Speed</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {networkSpeed ? `${networkSpeed.download.toFixed(1)} Mbps` : "Test"}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={testNetworkSpeed}
              disabled={loading}
            >
              {loading ? "Testing..." : "Test Speed"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Type</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{deviceInfo?.type || "Unknown"}</div>
            <p className="text-xs text-muted-foreground">
              Platform: {deviceInfo?.platform || "Unknown"}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WebSocket Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{wsStatus}</div>
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.memory ? 
                `${Math.round((systemMetrics.memory.usedJSHeapSize / systemMetrics.memory.jsHeapSizeLimit) * 100)}%` 
                : "N/A"}
            </div>
            <Progress 
              value={systemMetrics?.memory ? 
                (systemMetrics.memory.usedJSHeapSize / systemMetrics.memory.jsHeapSizeLimit) * 100 : 0} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="system-info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="system-info">System Info</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system-info">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-5 w-5" /> Server Environment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center">Loading server information...</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h3 className="font-medium mb-2">Runtime</h3>
                          <div className="space-y-2 text-sm">
                            <div><strong>Node Version:</strong> {serverInfo?.nodeVersion || "Unknown"}</div>
                            <div><strong>Environment:</strong> {serverInfo?.nodeEnv || "Unknown"}</div>
                            <div><strong>Uptime:</strong> {serverInfo?.uptime ? Math.round(serverInfo.uptime / 60) + " minutes" : "Unknown"}</div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Configuration</h3>
                          <div className="space-y-2 text-sm">
                            <div><strong>DATABASE_URL:</strong> {serverInfo?.databaseUrl || "Unknown"}</div>
                            <div><strong>NEXTAUTH_URL:</strong> {serverInfo?.nextAuthUrl || "Unknown"}</div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">Memory</h3>
                          <div className="space-y-2 text-sm">
                            <div><strong>RSS:</strong> {serverInfo?.memory?.rss ? Math.round(serverInfo.memory.rss / 1024 / 1024) + " MB" : "Unknown"}</div>
                            <div><strong>Heap Total:</strong> {serverInfo?.memory?.heapTotal ? Math.round(serverInfo.memory.heapTotal / 1024 / 1024) + " MB" : "Unknown"}</div>
                            <div><strong>Heap Used:</strong> {serverInfo?.memory?.heapUsed ? Math.round(serverInfo.memory.heapUsed / 1024 / 1024) + " MB" : "Unknown"}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" /> Database Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center">Loading database information...</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${serverInfo?.database?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div className="font-medium">
                            {serverInfo?.database?.connected ? 'Connected' : 'Disconnected'}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><strong>Type:</strong> {serverInfo?.database?.type || "Unknown"}</div>
                          <div><strong>Status:</strong> {serverInfo?.database?.connected ? "Healthy" : "Error"}</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            getServerInfo();
                            addLogEntry('Database connection check triggered');
                          }}
                        >
                          Check Connection
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Raw Server Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md overflow-auto max-h-80">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(serverInfo, null, 2) || "No server data"}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceMetrics?.memory?.totalJSHeapSize && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(performanceMetrics.memory.totalJSHeapSize / 1024 / 1024)} MB / 
                        {Math.round(performanceMetrics.memory.jsHeapSizeLimit / 1024 / 1024)} MB
                      </span>
                    </div>
                    <Progress value={memoryUsagePercent} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used: {Math.round(performanceMetrics.memory.usedJSHeapSize / 1024 / 1024)} MB
                    </p>
                  </div>
                )}
                
                {performanceMetrics?.navigation?.loadTime && (
                  <div>
                    <h3 className="font-medium mb-2">Page Load Time</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Load Time:</span>
                        <span className="text-sm font-medium">{performanceMetrics.navigation.loadTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">DOM Ready Time:</span>
                        <span className="text-sm font-medium">{performanceMetrics.navigation.domReadyTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Connection Time:</span>
                        <span className="text-sm font-medium">{performanceMetrics.navigation.connectTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Redirect Time:</span>
                        <span className="text-sm font-medium">{performanceMetrics.navigation.redirectTime}ms</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="auth">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Authentication Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Authentication Status</CardTitle>
                    <Badge variant={status === "authenticated" ? "secondary" : "destructive"} className={status === "authenticated" ? "bg-green-500 text-white" : ""}>
                      {status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="font-medium mb-2">User Information</h3>
                        <div className="space-y-2 text-sm">
                          <div><strong>User ID:</strong> {session?.user?.id || "Not available"}</div>
                          <div><strong>Name:</strong> {session?.user?.name || "Not available"}</div>
                          <div><strong>Email:</strong> {session?.user?.email || "Not available"}</div>
                          <div><strong>Role:</strong> {session?.user?.role || "Not available"}</div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Session Details</h3>
                        <div className="space-y-2 text-sm">
                          <div><strong>Status:</strong> {status}</div>
                          <div><strong>Expires:</strong> {session?.expires || "Not available"}</div>
                          {session?.expires && (
                            <div><strong>Time Left:</strong> {
                              new Date(session.expires).getTime() - new Date().getTime() > 0 
                                ? Math.round((new Date(session.expires).getTime() - new Date().getTime()) / (1000 * 60)) + " minutes" 
                                : "Expired"
                            }</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button onClick={refreshSession} size="sm" className="flex items-center gap-1">
                        <RefreshCw className="h-4 w-4" /> Refresh Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>JWT Token</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {jwtDecoded ? (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="claims">
                            <AccordionTrigger>JWT Claims</AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Claim</TableHead>
                                    <TableHead>Value</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {Object.entries(jwtDecoded).map(([key, value]) => (
                                    <TableRow key={key}>
                                      <TableCell className="font-medium">{key}</TableCell>
                                      <TableCell className="truncate max-w-[200px]">
                                        {typeof value === 'object' 
                                          ? JSON.stringify(value) 
                                          : String(value)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="lifetime">
                            <AccordionTrigger>Token Lifetime</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 text-sm">
                                {jwtDecoded.exp && (
                                  <>
                                    <div><strong>Expires At:</strong> {new Date(jwtDecoded.exp * 1000).toLocaleString()}</div>
                                    <div><strong>Issued At:</strong> {jwtDecoded.iat ? new Date(jwtDecoded.iat * 1000).toLocaleString() : "Not available"}</div>
                                    <div>
                                      <strong>Remaining:</strong> {
                                        jwtDecoded.exp * 1000 > Date.now() 
                                          ? Math.round((jwtDecoded.exp * 1000 - Date.now()) / (1000 * 60)) + " minutes" 
                                          : "Expired"
                                      }
                                    </div>
                                  </>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ) : (
                        <div className="text-sm text-muted-foreground">JWT token not available or could not be decoded.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Raw Session Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md overflow-auto max-h-80">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(session, null, 2) || "No session data"}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md overflow-auto h-[400px] font-mono">
                {logEntries.length > 0 ? (
                  <div className="space-y-1 text-xs">
                    {logEntries.map((entry, index) => (
                      <div key={index} className="leading-relaxed">
                        {entry}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm h-full flex items-center justify-center">
                    No log entries yet. Actions will be recorded here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Network Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {networkRequests.map((request, index) => (
                    <TableRow key={index}>
                      <TableCell>{request.method}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{request.url}</TableCell>
                      <TableCell>
                        <Badge variant={request.status === 'error' ? 'destructive' : request.status >= 400 ? 'secondary' : 'default'}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.duration}ms</TableCell>
                      <TableCell>{new Date(request.timestamp).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="sticky top-0 bg-background z-10">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" /> Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Local Storage</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {localStorageItems.length} items, {Math.round(localStorageItems.reduce((acc, item) => acc + item.size, 0) / 1024)}KB total
                      </p>
                      <Button variant="outline" size="sm" onClick={clearLocalStorage}>
                        Clear Storage
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Key</TableHead>
                            <TableHead className="min-w-[300px]">Value</TableHead>
                            <TableHead className="w-[100px]">Size</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {localStorageItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm max-w-[200px] truncate">
                                {item.key}
                              </TableCell>
                              <TableCell>
                                <div className="group relative">
                                  <div className="font-mono text-sm max-w-[300px] truncate">
                                    {item.value}
                                  </div>
                                  <div className="absolute left-0 top-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 max-w-[500px]">
                                    <pre className="text-xs whitespace-pre-wrap break-all">
                                      {item.value}
                                    </pre>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{Math.round(item.size / 1024)}KB</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    localStorage.removeItem(item.key);
                                    setLocalStorageItems(prev => prev.filter((_, i) => i !== index));
                                    addLogEntry(`Removed item: ${item.key}`);
                                  }}
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Cache Storage</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {cacheStatus?.available ? `${cacheStatus.total} caches` : 'Cache API not available'}
                      </p>
                      {cacheStatus?.available && (
                        <Button variant="outline" size="sm" onClick={clearCache}>
                          Clear Cache
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Cache Name</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cacheStatus?.keys.map((key: string, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm max-w-[200px] truncate">
                                {key}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await caches.delete(key);
                                      setCacheStatus(prev => ({
                                        ...prev,
                                        keys: prev.keys.filter((k: string) => k !== key),
                                        total: prev.total - 1
                                      }));
                                      addLogEntry(`Deleted cache: ${key}`);
                                    } catch (error) {
                                      addLogEntry(`Failed to delete cache ${key}: ${error}`);
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" /> Testing Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Browser Compatibility</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(browserCompatibility || {}).map(([feature, supported]) => (
                      <div key={feature} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Badge variant={supported ? 'default' : 'destructive'}>
                          {supported ? 'Supported' : 'Not Supported'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">API Testing</h3>
                  <div className="flex gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={() => testApiEndpoint('/api/debug/server-info')}>
                      Test Server Info
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => testApiEndpoint('/api/debug-session')}>
                      Test Session
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiTestResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell className="max-w-[200px] truncate">{result.endpoint}</TableCell>
                          <TableCell>
                            <Badge variant={result.success ? 'default' : 'destructive'}>
                              {result.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{result.duration}ms</TableCell>
                          <TableCell>{new Date(result.timestamp).toLocaleTimeString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Error Boundary Testing</h3>
                  <Button variant="destructive" onClick={triggerErrorBoundary}>
                    Trigger Error
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Helper function declaration for retrieving server info
  async function getServerInfo() {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/server-info');
      if (response.ok) {
        const data = await response.json();
        setServerInfo(data);
        addLogEntry(`Server info updated: ${data.nodeEnv} environment`);
      } else {
        console.error('Failed to fetch server info');
        addLogEntry('Failed to fetch server info');
      }
    } catch (error) {
      console.error('Error fetching server info:', error);
      addLogEntry(`Error fetching server info: ${error}`);
    } finally {
      setLoading(false);
    }
  }
} 