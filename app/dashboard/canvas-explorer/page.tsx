'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertCircle, CheckCircle, RefreshCw, Users, Calendar, UserCircle, Download } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  login_id?: string;
  sis_user_id?: string;
  created_at?: string;
  last_login?: string;
}

interface Course {
  id: string;
  name: string;
  course_code?: string;
  workflow_state?: string;
  start_at?: string;
  end_at?: string;
  enrollment_type?: string;
  students?: Student[];
  loadError?: boolean;
  errorDetails?: string;
}

interface Student {
  id: string;
  name: string;
  email?: string;
  sis_user_id?: string;
  enrollments?: Array<{
    type: string;
    role: string;
  }>;
}

interface DebugEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const CanvasExplorerPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    apiUrl: 'http://localhost:3000/api/v1',
    authToken: 'canvas-simulation-token'
  });
  
  const [debugMode, setDebugMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [debugLog, setDebugLog] = useState<DebugEntry[]>([]);
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const debugLogEntry = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    if (!debugMode) return;
    
    const entry: DebugEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    
    setDebugLog(prev => [...prev, entry]);
  }, [debugMode]);

  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    const id = Date.now().toString();
    setAlerts(prev => [...prev, { id, type, title, message }]);
    
    if (type === 'success') {
      setTimeout(() => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
      }, 5000);
    }
  };

  const clearAlerts = () => setAlerts([]);

  const validateInputs = () => {
    if (!formData.email) {
      showAlert('error', 'Validation Error', 'Please enter an email address.');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert('error', 'Validation Error', 'Please enter a valid email address.');
      return false;
    }
    
    if (!formData.apiUrl) {
      showAlert('error', 'Validation Error', 'Please enter an API URL.');
      return false;
    }
    
    try {
      new URL(formData.apiUrl);
    } catch (e) {
      showAlert('error', 'Validation Error', 'Please enter a valid API URL (e.g., http://localhost:3000/api/v1).');
      return false;
    }
    
    if (!formData.authToken) {
      showAlert('error', 'Validation Error', 'Authorization token is required for the canvas-sim API. You can use any value like "test-token".');
      return false;
    }
    
    return true;
  };

  const findUserByEmail = async (email: string): Promise<User | null> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (formData.authToken) {
      headers['Authorization'] = `Bearer ${formData.authToken}`;
    }
    
    debugLogEntry(`Searching for user with email: ${email}`);
    
    try {
      const response = await fetch(`${formData.apiUrl}/users`, { 
        headers
      });
      
      debugLogEntry(`User search response: ${response.status}`, response.ok ? 'success' : 'error');
      
      if (!response.ok) {
        if (response.status === 401) throw new Error('UNAUTHORIZED');
        if (response.status === 403) throw new Error('FORBIDDEN');
        if (response.status === 404) throw new Error('API_NOT_FOUND');
        if (response.status >= 500) throw new Error('SERVER_ERROR');
        throw new Error(`HTTP_${response.status}`);
      }
      
      const users = await response.json();
      
      if (!Array.isArray(users)) {
        throw new Error('INVALID_RESPONSE');
      }
      
      const user = users.find(u => 
        u.email && u.email.toLowerCase() === email.toLowerCase()
      );
      
      debugLogEntry(`Found user: ${user ? user.name : 'No user found'}`, user ? 'success' : 'error');
      return user || null;
      
    } catch (error: any) {
      debugLogEntry(`Error finding user: ${error.message}`, 'error');
      if (error.name === 'AbortError') throw new Error('REQUEST_ABORTED');
      if (error.name === 'TypeError' && error.message.includes('fetch')) throw new Error('NETWORK_ERROR');
      throw error;
    }
  };

  const getUserCourses = async (userId: string): Promise<Course[]> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (formData.authToken) {
      headers['Authorization'] = `Bearer ${formData.authToken}`;
    }
    
    debugLogEntry(`Fetching courses for user: ${userId}`);
    
    try {
      const response = await fetch(`${formData.apiUrl}/users/${userId}/courses`, { 
        headers
      });
      
      debugLogEntry(`Courses response: ${response.status}`, response.ok ? 'success' : 'error');
      
      if (!response.ok) {
        if (response.status === 404) throw new Error('USER_NOT_FOUND');
        if (response.status === 401) throw new Error('UNAUTHORIZED');
        if (response.status >= 500) throw new Error('SERVER_ERROR');
        throw new Error(`HTTP_${response.status}`);
      }
      
      const courses = await response.json();
      
      if (!Array.isArray(courses)) {
        throw new Error('INVALID_RESPONSE');
      }
      
      debugLogEntry(`Found ${courses.length} courses`, 'success');
      return courses;
      
    } catch (error: any) {
      debugLogEntry(`Error fetching courses: ${error.message}`, 'error');
      if (error.name === 'AbortError') throw new Error('REQUEST_ABORTED');
      if (error.name === 'TypeError' && error.message.includes('fetch')) throw new Error('NETWORK_ERROR');
      throw error;
    }
  };

  const getCourseStudents = async (courseId: string): Promise<Student[]> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (formData.authToken) {
      headers['Authorization'] = `Bearer ${formData.authToken}`;
    }
    
    try {
      // Primary method: Try to get course users with enrollment type filter for students
      const params = new URLSearchParams({
        'enrollment_type[]': 'student'
      });
      
      const fullUrl = `${formData.apiUrl}/courses/${courseId}/users?${params.toString()}`;
      debugLogEntry(`Fetching students from: ${fullUrl}`);
      
      const response = await fetch(fullUrl, { 
        headers
      });
      
      debugLogEntry(`Response status for course ${courseId}: ${response.status}`, response.ok ? 'success' : 'error');
      
      if (!response.ok) {
        const errorText = await response.text();
        debugLogEntry(`Error response for course ${courseId}: ${response.status} - ${errorText}`, 'error');
        
        if (response.status === 404) {
          throw new Error('COURSE_NOT_FOUND');
        } else if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        } else if (response.status === 403) {
          throw new Error('FORBIDDEN');
        } else if (response.status >= 500) {
          throw new Error('SERVER_ERROR');
        } else {
          throw new Error(`HTTP_${response.status}`);
        }
      }
      
      const responseText = await response.text();
      debugLogEntry(`Raw response for course ${courseId}: ${responseText.length} characters`);
      
      let users;
      try {
        users = JSON.parse(responseText);
      } catch (parseError) {
        debugLogEntry(`Failed to parse JSON response for course ${courseId}: ${(parseError as Error).message}`, 'error');
        throw new Error('INVALID_RESPONSE');
      }
      
      if (!Array.isArray(users)) {
        debugLogEntry(`Response is not an array for course ${courseId}: ${typeof users}`, 'error');
        throw new Error('INVALID_RESPONSE');
      }
      
      // Filter for students if no enrollment_type filter worked
      const students = users.filter(user => {
        // Look for enrollment information that indicates student role
        if (user.enrollments) {
          return user.enrollments.some((enrollment: any) => 
            enrollment.type === 'StudentEnrollment' || 
            enrollment.role === 'StudentEnrollment' ||
            enrollment.role === 'Student'
          );
        }
        // If no enrollment info, assume all users are students for now
        return true;
      });
      
      debugLogEntry(`Found ${students.length} students out of ${users.length} users for course ${courseId}`, 'success');
      return students;
      
    } catch (primaryError: any) {
      debugLogEntry(`Primary method failed for course ${courseId}, trying alternative...`, 'error');
      
      try {
        // Alternative approach: Get all users and filter by courses
        return await getCourseStudentsAlternative(courseId);
      } catch (alternativeError: any) {
        debugLogEntry(`Both methods failed for course ${courseId}:`, 'error');
        debugLogEntry(`Primary: ${primaryError.message}, Alternative: ${alternativeError.message}`, 'error');
        throw primaryError; // Throw the original error
      }
    }
  };

  const getCourseStudentsAlternative = async (courseId: string): Promise<Student[]> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (formData.authToken) {
      headers['Authorization'] = `Bearer ${formData.authToken}`;
    }
    
    try {
      debugLogEntry(`Trying workaround: getting all users and filtering by course ${courseId}`);
      
      // Get all users first
      const usersResponse = await fetch(`${formData.apiUrl}/users`, { 
        headers
      });
      
      if (!usersResponse.ok) {
        throw new Error(`HTTP_${usersResponse.status}`);
      }
      
      const allUsers = await usersResponse.json();
      debugLogEntry(`Got ${allUsers.length} total users from API`);
      
      // Now get each user's courses to find who's enrolled in this course
      const courseStudents: Student[] = [];
      
      for (const user of allUsers) {
        try {
                      const userCoursesResponse = await fetch(`${formData.apiUrl}/users/${user.id}/courses`, {
              headers
            });
          
          if (userCoursesResponse.ok) {
            const userCourses = await userCoursesResponse.json();
            const isEnrolledInCourse = userCourses.some((course: any) => 
              course.id == courseId && course.enrollment_type === 'student'
            );
            
            if (isEnrolledInCourse) {
              courseStudents.push({
                ...user,
                enrollments: [{ 
                  type: 'StudentEnrollment',
                  role: 'Student'
                }]
              });
            }
          }
        } catch (userError: any) {
          debugLogEntry(`Failed to get courses for user ${user.id}: ${userError.message}`, 'error');
        }
              }
      
      debugLogEntry(`Found ${courseStudents.length} students in course ${courseId} using workaround method`, 'success');
      
      return courseStudents;
      
    } catch (error: any) {
      debugLogEntry(`Workaround method failed: ${error.message}`, 'error');
      throw error;
    }
  };

  const loadCoursesWithStudents = async (courses: Course[]): Promise<Course[]> => {
    const coursesWithStudents: Course[] = [];
    const errors: Array<{ course: string; error: string; details: string }> = [];
    
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      setLoadingMessage(`Loading students for course "${course.name}" (${i + 1}/${courses.length})...`);
      
      let students: Student[] = [];
      let loadError = false;
      let errorDetails = '';
      
      try {
        students = await getCourseStudents(course.id);
        debugLogEntry(`Successfully loaded ${students.length} students for course ${course.id}`, 'success');
      } catch (error: any) {
        loadError = true;
        errorDetails = error.message;
        errors.push({
          course: course.name || `Course ${course.id}`,
          error: error.message,
          details: `Failed to load students: ${error.message}`
        });
        debugLogEntry(`Failed to load students for course ${course.id}: ${error.message}`, 'error');
      }
      
      coursesWithStudents.push({ 
        ...course, 
        students, 
        loadError,
        errorDetails
      });
    }
    
    if (errors.length > 0) {
      const errorMessage = `Failed to load students for ${errors.length} course${errors.length > 1 ? 's' : ''}:\n` +
        errors.map(e => `• ${e.course}: ${getErrorMessage(e.error)}`).join('\n') +
        '\n\nCheck the debug panel for detailed error information.';
      showAlert('warning', 'Partial Load Warning', errorMessage);
    }
    
    return coursesWithStudents;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setIsLoading(true);
    setLoadingMessage('Searching for user...');
    clearAlerts();
    setUser(null);
    setCourses([]);
    
    try {
      // Step 1: Find user by email
      const foundUser = await findUserByEmail(formData.email);
      if (!foundUser) {
        showAlert('error', 'User not found', `No user found with email "${formData.email}". Please check the email address and try again.`);
        return;
      }
      
      setUser(foundUser);
      
      // Step 2: Get user's courses
      setLoadingMessage('Fetching user courses...');
      const userCourses = await getUserCourses(foundUser.id);
      
      if (userCourses.length === 0) {
        showAlert('warning', 'No Courses', `User ${foundUser.name} is not enrolled in any courses.`);
        return;
      }
      
      // Step 3: Load students for each course
      setLoadingMessage(`Loading students from ${userCourses.length} course${userCourses.length > 1 ? 's' : ''}...`);
      const coursesWithStudents = await loadCoursesWithStudents(userCourses);
      
      setCourses(coursesWithStudents);
      showAlert('success', 'Success', `Successfully loaded data for ${foundUser.name}!`);
      
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = getErrorMessage(error.message);
      showAlert('error', 'Request Failed', errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const testApiConnection = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (formData.authToken) {
      headers['Authorization'] = `Bearer ${formData.authToken}`;
    }
    
    debugLogEntry('=== API Connection Test Started ===');
    
    try {
      debugLogEntry(`Testing base URL: ${formData.apiUrl}`);
      
      const response = await fetch(`${formData.apiUrl}/users`, {
        headers
      });
      
      debugLogEntry(`✅ Connection successful! Status: ${response.status}`, 'success');
      
      if (response.ok) {
        const data = await response.json();
        debugLogEntry(`✅ Response received: ${Array.isArray(data) ? data.length + ' users' : 'Data object'}`, 'success');
        showAlert('success', 'Connection Test', 'API connection test successful!');
      } else {
        debugLogEntry(`⚠️ API responded but with error status: ${response.status}`, 'error');
        showAlert('warning', 'Connection Test', `API is reachable but returned status ${response.status}. Check authentication if required.`);
      }
      
    } catch (error: any) {
      debugLogEntry(`❌ Connection failed: ${error.message}`, 'error');
      
      if (error.name === 'AbortError') {
        showAlert('error', 'Connection Test Failed', 'API request was aborted. Check if the server is running.');
      } else {
        showAlert('error', 'Connection Test Failed', `Cannot reach API server at ${formData.apiUrl}. Please verify the server is running and URL is correct.`);
      }
    }
    
    debugLogEntry('=== API Connection Test Completed ===');
  };

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'UNAUTHORIZED': 'Authentication failed. Please check your authorization token.',
      'FORBIDDEN': 'Access forbidden. You don\'t have permission to access this resource.',
      'API_NOT_FOUND': 'API endpoint not found. Please check the API URL.',
      'USER_NOT_FOUND': 'User not found in the system.',
      'COURSE_NOT_FOUND': 'Course not found or access denied.',
      'SERVER_ERROR': 'Server error occurred. Please try again later.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
      'CONNECTION_FAILED': 'Cannot connect to API server. Server may be down or unreachable.',
      'REQUEST_ABORTED': 'Request was cancelled or aborted.',
      'INVALID_RESPONSE': 'Invalid response from server. The data format is unexpected.',
    };
    
    if (errorCode.startsWith('HTTP_')) {
      const statusCode = errorCode.replace('HTTP_', '');
      return `HTTP ${statusCode} error occurred.`;
    }
    
    return errorMessages[errorCode] || errorCode;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const syncWithDatabase = async () => {
    if (!validateInputs()) return;
    
    setIsSyncing(true);
    setLoadingMessage('Syncing Canvas data to database...');
    clearAlerts();
    
    try {
      debugLogEntry('=== Canvas Database Sync Started ===');
      
      const response = await fetch('/api/canvas/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUrl: formData.apiUrl,
          authToken: formData.authToken,
          userEmail: formData.email,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Sync failed');
      }
      
      debugLogEntry(`✅ Sync completed successfully!`, 'success');
      debugLogEntry(`Courses processed: ${result.result.coursesProcessed}`, 'success');
      debugLogEntry(`Courses created: ${result.result.coursesCreated}`, 'success');
      debugLogEntry(`Courses updated: ${result.result.coursesUpdated}`, 'success');
      debugLogEntry(`Students processed: ${result.result.studentsProcessed}`, 'success');
      debugLogEntry(`Students created: ${result.result.studentsCreated}`, 'success');
      debugLogEntry(`Students updated: ${result.result.studentsUpdated}`, 'success');
      debugLogEntry(`Enrollments created: ${result.result.enrollmentsCreated}`, 'success');
      
      if (result.result.errors.length > 0) {
        debugLogEntry(`⚠️ ${result.result.errors.length} errors occurred:`, 'error');
        result.result.errors.forEach((error: string) => {
          debugLogEntry(`• ${error}`, 'error');
        });
      }
      
      const summary = [
        'Successfully synced Canvas data to database!',
        '',
        `📚 Courses: ${result.result.coursesCreated} created, ${result.result.coursesUpdated} updated`,
        `👥 Students: ${result.result.studentsCreated} created, ${result.result.studentsUpdated} updated`,
        `🔗 Enrollments: ${result.result.enrollmentsCreated} created`,
        '',
        result.result.errors.length > 0 
          ? `⚠️ ${result.result.errors.length} errors occurred (see debug log for details)`
          : '✅ No errors occurred'
      ].join('\n');
      
      showAlert('success', 'Sync Complete', summary);
      
    } catch (error: any) {
      debugLogEntry(`❌ Sync failed: ${error.message}`, 'error');
      showAlert('error', 'Sync Failed', `Failed to sync Canvas data: ${error.message}`);
    } finally {
      setIsSyncing(false);
      setLoadingMessage('');
    }
  };

  const syncSingleCourse = async (course: Course) => {
    if (!validateInputs()) return;
    
    setIsLoading(true);
    setLoadingMessage(`Syncing course "${course.name}" to database...`);
    clearAlerts();
    
    try {
      debugLogEntry(`=== Syncing single course: ${course.name} ===`);
      
      const response = await fetch('/api/canvas/sync-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUrl: formData.apiUrl,
          authToken: formData.authToken,
          course: course,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Course sync failed');
      }
      
      debugLogEntry(`✅ Course sync completed successfully!`, 'success');
      debugLogEntry(`Course ${result.result.courseCreated ? 'created' : result.result.courseUpdated ? 'updated' : 'processed'}`, 'success');
      debugLogEntry(`Students processed: ${result.result.studentsProcessed}`, 'success');
      debugLogEntry(`Students created: ${result.result.studentsCreated}`, 'success');
      debugLogEntry(`Students updated: ${result.result.studentsUpdated}`, 'success');
      debugLogEntry(`Enrollments created: ${result.result.enrollmentsCreated}`, 'success');
      
      if (result.result.errors.length > 0) {
        debugLogEntry(`⚠️ ${result.result.errors.length} errors occurred:`, 'error');
        result.result.errors.forEach((error: string) => {
          debugLogEntry(`• ${error}`, 'error');
        });
      }
      
      const summary = [
        `Successfully added "${course.name}" to your account!`,
        '',
        `📚 Course: ${result.result.courseCreated ? 'Created' : result.result.courseUpdated ? 'Updated' : 'Processed'}`,
        `👥 Students: ${result.result.studentsCreated} created, ${result.result.studentsUpdated} updated`,
        `🔗 Enrollments: ${result.result.enrollmentsCreated} created`,
        '',
        result.result.errors.length > 0 
          ? `⚠️ ${result.result.errors.length} errors occurred (see debug log for details)`
          : '✅ No errors occurred'
      ].join('\n');
      
      showAlert('success', 'Course Added', summary);
      
    } catch (error: any) {
      debugLogEntry(`❌ Course sync failed: ${error.message}`, 'error');
      showAlert('error', 'Course Sync Failed', `Failed to add course to your account: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const reloadCourseStudents = async (courseId: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage(`Reloading students for course ${courseId}...`);
      
      const students = await getCourseStudents(courseId);
      
      // Update the specific course in state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, students, loadError: false, errorDetails: '' }
            : course
        )
      );
      
      showAlert('success', 'Reload Success', `Successfully reloaded students for course ${courseId}!`);
      
    } catch (error: any) {
      showAlert('error', 'Reload Failed', `Failed to reload students: ${getErrorMessage(error.message)}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Canvas LMS User Explorer</h1>
        <p className="text-muted-foreground">
          Enter an email to explore user details, courses, and enrolled students. You can sync all data to your database or add individual courses to your account.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Search</CardTitle>
          <CardDescription>
            Configure your Canvas API connection and search for users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter user email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiUrl">API Base URL</Label>
                <Input
                  id="apiUrl"
                  type="text"
                  placeholder="http://localhost:3000/api/v1"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="authToken">Authorization Token</Label>
              <Input
                id="authToken"
                type="text"
                placeholder="canvas-simulation-token"
                value={formData.authToken}
                onChange={(e) => setFormData(prev => ({ ...prev, authToken: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">
                For the canvas-sim API, any token value will work (e.g., "test-token")
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="debugMode"
                checked={debugMode}
                onCheckedChange={setDebugMode}
              />
              <Label htmlFor="debugMode" className="text-sm font-normal">
                Enable Debug Mode (shows detailed API calls)
              </Label>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={testApiConnection}
                disabled={isLoading || isSyncing}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Test API Connection
              </Button>
              <Button type="submit" disabled={isLoading || isSyncing}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingMessage || 'Loading...'}
                  </>
                ) : (
                  'Search User'
                )}
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={syncWithDatabase}
                disabled={isLoading || isSyncing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingMessage || 'Syncing...'}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Sync to Database
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.map((alert) => (
        <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
          {alert.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {alert.type === 'success' && <CheckCircle className="h-4 w-4" />}
          <AlertDescription>
            <strong>{alert.title}:</strong> {alert.message}
          </AlertDescription>
        </Alert>
      ))}

      {/* Debug Panel */}
      {debugMode && debugLog.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Debug Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugLog([])}
              >
                Clear Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {debugLog.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-md border-l-4 text-sm ${
                    entry.type === 'error'
                      ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
                      : entry.type === 'success'
                      ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  }`}
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {entry.timestamp}
                  </div>
                  <div className="font-mono">{entry.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Details */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCircle className="mr-2 h-5 w-5" />
              User Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-sm">{user.name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{user.email || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-sm font-mono">{user.id || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Login ID</p>
                <p className="text-sm">{user.login_id || user.sis_user_id || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(user.created_at)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Last Activity</p>
                <p className="text-sm">{formatDate(user.last_login)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses and Students */}
      {courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              User Courses & Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className={`p-6 rounded-lg border ${
                  course.loadError ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg">{course.name || 'Unnamed Course'}</h3>
                    {course.loadError && (
                      <Badge variant="destructive" className="text-xs">
                        ⚠ Error
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col sm:text-right space-y-1">
                    <Badge variant="outline" className="text-xs w-fit">
                      ID: {course.id}
                    </Badge>
                    {course.course_code && (
                      <div className="text-sm text-muted-foreground">
                        {course.course_code}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {course.workflow_state && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Status: </span>
                      <span className="text-sm">{course.workflow_state}</span>
                    </div>
                  )}
                  {course.start_at && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Start Date: </span>
                      <span className="text-sm">{formatDate(course.start_at)}</span>
                    </div>
                  )}
                  {course.end_at && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">End Date: </span>
                      <span className="text-sm">{formatDate(course.end_at)}</span>
                    </div>
                  )}
                </div>

                {course.loadError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span>Unable to load student roster</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reloadCourseStudents(course.id)}
                            disabled={isLoading || isSyncing}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Retry
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => syncSingleCourse(course)}
                            disabled={isLoading || isSyncing}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Add to Account
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        This may be due to permissions, network issues, or the course being inactive.
                      </p>
                    </AlertDescription>
                  </Alert>
                ) : course.students && course.students.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <h4 className="font-medium">Students ({course.students.length})</h4>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => syncSingleCourse(course)}
                        disabled={isLoading || isSyncing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Add to Account
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {course.students.map((student) => (
                        <div
                          key={student.id}
                          className="p-3 bg-background rounded-md border hover:shadow-sm transition-shadow"
                        >
                          <div className="font-medium text-sm truncate">
                            {student.name || 'Unnamed Student'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {student.email || 'No email'}
                          </div>
                          {student.sis_user_id && (
                            <div className="text-xs text-muted-foreground truncate">
                              SIS: {student.sis_user_id}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm italic mb-4">No students enrolled</p>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => syncSingleCourse(course)}
                      disabled={isLoading || isSyncing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Add to Account
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CanvasExplorerPage; 