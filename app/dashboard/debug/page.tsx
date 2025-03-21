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
import { BarChart3, Globe, Database, Terminal, Shield, Cpu, RefreshCw, History, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function DebugPage() {
  const { data: session, status, update } = useSession();
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [jwtDecoded, setJwtDecoded] = useState<any>(null);

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
  
  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Debug Console</h2>
        <div className="flex items-center gap-2">
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
      </div>

      <Tabs defaultValue="system-info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system-info">System Info</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
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