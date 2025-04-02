"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MoreHorizontal, 
  Search, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Award,
  BookOpen,
  Users,
  ArrowUpDown
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import StudentDetailsDialog from './student-details-dialog'
import AddStudentDialog from './add-student-dialog'
import FilterDialog from './filter-dialog'
import { Student } from '@prisma/client'
import { cn } from '@/lib/utils'
import { AutoSizer, List, WindowScroller } from 'react-virtualized'
import debounce from 'lodash.debounce'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { toast } from "sonner"
import { useHotkeys } from "react-hotkeys-hook"

interface GradeData {
  excellent: number;
  good: number;
  needsHelp: number;
}

// Helper function to get status color class
function getStatusColor(status: string) {
  switch (status) {
    case 'Excellent':
      return 'bg-green-500/20 text-green-700 border-green-700/50'
    case 'Good':
      return 'bg-blue-500/20 text-blue-700 border-blue-700/50'
    case 'Needs Help':
      return 'bg-red-500/20 text-red-700 border-red-700/50'
    default:
      return 'bg-gray-500/20 text-gray-700 border-gray-700/50'
  }
}

type SortField = 'name' | 'email' | 'attendance' | 'status';
type SortDirection = 'asc' | 'desc';

export default function StudentsPage() {
  // State
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentDialog, setShowStudentDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const totalPages = Math.ceil(totalCount / limit)
  const [userCourses, setUserCourses] = useState<any[]>([])
  const [courseLoading, setCourseLoading] = useState(true)
  
  // Filter states
  const [filters, setFilters] = useState({
    courseId: '',
    minGrade: 0,
    maxGrade: 100,
    minAttendance: 0,
    engagementLevel: '',
    status: ''
  })

  // Stats data
  const [gradeData, setGradeData] = useState<GradeData>({
    excellent: 0,
    good: 0,
    needsHelp: 0
  })

  // Add page size options
  const pageSizeOptions = [10, 20, 50, 100]

  // Add these to the component state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch user's courses
  const fetchUserCourses = useCallback(async () => {
    setCourseLoading(true);
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const coursesData = await response.json();
      setUserCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setCourseLoading(false);
    }
  }, []);

  // Load user's courses on component mount
  useEffect(() => {
    fetchUserCourses();
  }, [fetchUserCourses]);

  // Memoize the fetchStudents function
  const fetchStudents = useCallback(async () => {
    if (!userCourses.length) return;
    
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.courseId && filters.courseId !== '_all') {
        queryParams.append('courseId', filters.courseId);
      }
      
      if (debouncedSearchQuery) {
        queryParams.append('search', debouncedSearchQuery);
      }
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters.minGrade > 0) queryParams.append('minGrade', filters.minGrade.toString());
      if (filters.maxGrade < 100) queryParams.append('maxGrade', filters.maxGrade.toString());
      if (filters.minAttendance > 0) queryParams.append('minAttendance', filters.minAttendance.toString());
      if (filters.engagementLevel && filters.engagementLevel !== '_any') queryParams.append('engagementLevel', filters.engagementLevel);
      if (filters.status && filters.status !== '_any') queryParams.append('status', filters.status);
      
      const response = await fetch(`/api/students?${queryParams.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch students');
      }
      
      setStudents(data.students);
      setTotalCount(data.totalCount);
      calculateGradeStats(data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error("Failed to fetch students. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [userCourses.length, filters, debouncedSearchQuery, page, limit]);

  // Optimize the debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setDebouncedSearchQuery(value);
      setPage(1);
    }, 500),
    []
  );

  // Effect to fetch students only when necessary dependencies change
  useEffect(() => {
    const controller = new AbortController();
    fetchStudents();
    return () => controller.abort();
  }, [fetchStudents]);

  // Calculate grade stats
  const calculateGradeStats = (students: any[]) => {
    let excellent = 0;
    let good = 0;
    let needsHelp = 0;

    students.forEach(student => {
      // Calculate average grade
      if (student.submissions && student.submissions.length > 0) {
        const avgGrade = student.submissions.reduce((sum: number, sub: any) => 
          sum + (sub.score || 0), 0) / student.submissions.length;
        
        if (avgGrade >= 85) excellent++;
        else if (avgGrade >= 70) good++;
        else needsHelp++;
      } else {
        // Students with no submissions are counted as needing help
        needsHelp++;
      }
    });

    setGradeData({ excellent, good, needsHelp });
  };

  // Handle student selection
  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDialog(true);
  };

  // Handle filter application
  const applyFilters = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when applying filters
    setShowFilterDialog(false);
  };

  // Add keyboard navigation
  useHotkeys('left', () => {
    if (page > 1 && !isLoading) goToPrevPage();
  });
  useHotkeys('right', () => {
    if (page < totalPages && !isLoading) goToNextPage();
  });

  // Optimize pagination functions
  const goToNextPage = useCallback(() => {
    if (page < totalPages && !isLoading) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages, isLoading]);

  const goToPrevPage = useCallback(() => {
    if (page > 1 && !isLoading) {
      setPage(prev => prev - 1);
    }
  }, [page, isLoading]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !isLoading) {
      setPage(newPage);
    }
  }, [totalPages, isLoading]);

  // Memoized functions for student status determination
  const getStudentStatus = useCallback((student: any) => {
    if (!student.submissions || student.submissions.length === 0) {
      return 'Needs Help';
    }
    
    const avgGrade = student.submissions.reduce((sum: number, sub: any) => 
      sum + (sub.score || 0), 0) / student.submissions.length;
    
    if (avgGrade >= 85) return 'Excellent';
    if (avgGrade >= 70) return 'Good';
    return 'Needs Help';
  }, []);

  const getAttendanceRate = useCallback((student: any) => {
    if (!student.attendances || student.attendances.length === 0) {
      return 0;
    }
    
    const presentCount = student.attendances.filter((att: any) => 
      att.status === 'PRESENT').length;
    
    return Math.round((presentCount / student.attendances.length) * 100);
  }, []);

  // Add this function after the existing state declarations
  const handleSort = useCallback((field: SortField) => {
    setSortField(field);
    setSortDirection(current => 
      current === 'asc' && sortField === field ? 'desc' : 'asc'
    );
  }, [sortField]);

  // Add this memoized sorting function
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'attendance':
          const attendanceA = getAttendanceRate(a);
          const attendanceB = getAttendanceRate(b);
          comparison = attendanceA - attendanceB;
          break;
        case 'status':
          const statusA = getStudentStatus(a);
          const statusB = getStudentStatus(b);
          comparison = statusA.localeCompare(statusB);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [students, sortField, sortDirection, getAttendanceRate, getStudentStatus]);

  // Memoize the row renderer function
  const rowRenderer = useCallback(({ index, key, style }: { index: number, key: string, style: React.CSSProperties }) => {
    if (isLoading && sortedStudents.length === 0) {
      return (
        <div key={key} style={style} className="flex items-center p-4 border-b">
          <div className="w-[80px]">
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <div className="flex-1 font-medium">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-8 ml-auto" />
          </div>
        </div>
      );
    }
    
    const student = sortedStudents[index];
    if (!student) return null;
    
    const status = getStudentStatus(student);
    const attendanceRate = getAttendanceRate(student);
    
    return (
      <div
        key={key}
        style={style}
        className="flex items-center p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handleStudentClick(student)}
      >
        <div className="w-[80px] flex items-center justify-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://avatar.vercel.sh/${student.id}`} alt={student.name} />
            <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 font-medium truncate pr-4">{student.name}</div>
        <div className="flex-1 truncate pr-4">{student.email}</div>
        <div className="flex-1 pr-4">{attendanceRate}%</div>
        <div className="flex-1 pr-4">
          <Badge variant="outline" className={cn("py-1", getStatusColor(status))}>
            {status}
          </Badge>
        </div>
        <div className="w-[60px] flex items-center justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More</span>
          </Button>
        </div>
      </div>
    );
  }, [isLoading, sortedStudents, getStudentStatus, getAttendanceRate, handleStudentClick]);

  // Optimize the virtualized list
  const listHeight = useMemo(() => {
    return Math.min(600, Math.max(200, sortedStudents.length * 65));
  }, [sortedStudents.length]);

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Students</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilterDialog(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Excellent Students
            </CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeData.excellent}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? Math.round((gradeData.excellent / totalCount) * 100) : 0}% of students
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Good Students
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeData.good}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? Math.round((gradeData.good / totalCount) * 100) : 0}% of students
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Students Needing Help
            </CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeData.needsHelp}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? Math.round((gradeData.needsHelp / totalCount) * 100) : 0}% of students
            </p>
          </CardContent>
        </Card>
      </div>
      
      {courseLoading ? (
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-8">
            <div className="flex justify-center items-center space-y-4">
              <div className="text-center">
                <Skeleton className="h-6 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : userCourses.length === 0 ? (
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">No Courses Found</h3>
              <p className="text-muted-foreground">
                You don't have any courses assigned. Students will be visible once you have courses.
              </p>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard/courses'}
              >
                Go to Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Show filter controls only if courses exist */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="md:w-[300px]"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  debouncedSearch(value);
                }}
              />
            </div>
          </div>
          
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>
                View and manage your students and their performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                {/* Table headers */}
                <div className="bg-muted/50 px-4 py-3 flex items-center font-medium text-sm sticky top-0 z-10">
                  <div className="w-[80px]"></div>
                  <div 
                    className="flex-1 flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    {sortField === 'name' && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                    {sortField === 'name' && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  <div 
                    className="flex-1 flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    Email
                    {sortField === 'email' && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                    {sortField === 'email' && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  <div 
                    className="flex-1 flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort('attendance')}
                  >
                    Attendance
                    {sortField === 'attendance' && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                    {sortField === 'attendance' && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  <div 
                    className="flex-1 flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {sortField === 'status' && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                    {sortField === 'status' && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  <div className="w-[60px]"></div>
                </div>
                
                {/* Virtualized student list */}
                <div className="relative">
                  {isLoading && sortedStudents.length === 0 ? (
                    // Skeleton loading state
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center p-4 border-b">
                        <div className="w-[80px]">
                          <Skeleton className="h-12 w-12 rounded-full" />
                        </div>
                        <div className="flex-1 font-medium">
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex-1">
                          <Skeleton className="h-4 w-36" />
                        </div>
                        <div className="flex-1">
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex-1">
                          <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-8 w-8 ml-auto" />
                        </div>
                      </div>
                    ))
                  ) : sortedStudents.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No students found.
                    </div>
                  ) : (
                    <WindowScroller>
                      {({ height, scrollTop }) => (
                        <AutoSizer disableHeight>
                          {({ width }) => (
                            <List
                              autoHeight
                              height={listHeight}
                              scrollTop={scrollTop}
                              width={width}
                              rowHeight={65}
                              rowCount={sortedStudents.length}
                              rowRenderer={rowRenderer}
                              overscanRowCount={3}
                              noRowsRenderer={() => (
                                <div className="p-4 text-center text-muted-foreground">
                                  No students found.
                                </div>
                              )}
                            />
                          )}
                        </AutoSizer>
                      )}
                    </WindowScroller>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {sortedStudents.length} of {totalCount} students
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      disabled={isLoading}
                    >
                      {pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={goToPrevPage} 
                          className={cn(
                            "transition-opacity",
                            (page <= 1 || isLoading) ? "pointer-events-none opacity-50" : "hover:opacity-80"
                          )}
                          aria-disabled={page <= 1 || isLoading}
                        />
                      </PaginationItem>
                      
                      {/* First page */}
                      {page > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink 
                              onClick={() => goToPage(1)}
                              className="transition-colors hover:bg-muted"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {page > 4 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      
                      {/* Pages around current page */}
                      {Array.from({ length: 5 }, (_, i) => page - 2 + i)
                        .filter(p => p > 0 && p <= totalPages)
                        .map(p => (
                          <PaginationItem key={p}>
                            <PaginationLink 
                              onClick={() => goToPage(p)}
                              isActive={p === page}
                              className={cn(
                                "min-w-[2.5rem] text-center transition-colors",
                                p === page 
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                  : "hover:bg-muted"
                              )}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                      ))}
                      
                      {/* Last page */}
                      {page < totalPages - 2 && (
                        <>
                          {page < totalPages - 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink 
                              onClick={() => goToPage(totalPages)}
                              className="transition-colors hover:bg-muted"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={goToNextPage} 
                          className={cn(
                            "transition-opacity",
                            (page >= totalPages || isLoading) ? "pointer-events-none opacity-50" : "hover:opacity-80"
                          )}
                          aria-disabled={page >= totalPages || isLoading}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  {/* Page input field */}
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-muted-foreground">Go to:</span>
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={page}
                      onChange={(e) => {
                        const newPage = parseInt(e.target.value);
                        if (!isNaN(newPage)) {
                          goToPage(newPage);
                        }
                      }}
                      className="w-16 h-8 text-center"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Student Details Dialog */}
      {selectedStudent && (
        <StudentDetailsDialog
          student={selectedStudent}
          open={showStudentDialog}
          onOpenChange={setShowStudentDialog}
        />
      )}
      
      {/* Add Student Dialog */}
      <AddStudentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onStudentAdded={fetchStudents}
      />
      
      {/* Filter Dialog */}
      <FilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        currentFilters={filters}
        onApplyFilters={applyFilters}
      />
    </div>
  )
}