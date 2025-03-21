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
  Users
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
  const [limit] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const totalPages = Math.ceil(totalCount / limit)
  
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

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchQuery(value);
      setPage(1); // Reset to first page on new search
    }, 500),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Fetch students with pagination and filters
  const fetchStudents = useCallback(async () => {
    const isInitialLoad = page === 1 && !isLoadingMore;
    
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('include', 'all');
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }
      
      if (filters.courseId) {
        params.append('courseId', filters.courseId);
      }
      
      if (filters.minGrade > 0) {
        params.append('minGrade', filters.minGrade.toString());
      }
      
      if (filters.maxGrade < 100) {
        params.append('maxGrade', filters.maxGrade.toString());
      }
      
      if (filters.minAttendance > 0) {
        params.append('minAttendance', filters.minAttendance.toString());
      }
      
      if (filters.engagementLevel) {
        params.append('engagementLevel', filters.engagementLevel);
      }
      
      if (filters.status) {
        params.append('status', filters.status);
      }

      const response = await fetch(`/api/students?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const data = await response.json();
      
      setStudents(data.students);
      setTotalCount(data.total);
      calculateGradeStats(data.students);
      
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [page, limit, debouncedSearchQuery, filters]);

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

  // Effect to fetch students when relevant dependencies change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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

  // Handle pagination
  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

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

  // Row renderer for virtualized list
  const rowRenderer = ({ index, key, style }: { index: number, key: string, style: React.CSSProperties }) => {
    if (isLoading && students.length === 0) {
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
    
    const student = students[index];
    if (!student) return null;
    
    const status = getStudentStatus(student);
    const attendanceRate = getAttendanceRate(student);
    
    return (
      <div
        key={key}
        style={style}
        className="flex items-center p-4 border-b cursor-pointer hover:bg-muted/50"
        onClick={() => handleStudentClick(student)}
      >
        <div className="w-[80px]">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://avatar.vercel.sh/${student.id}`} alt={student.name} />
            <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 font-medium">{student.name}</div>
        <div className="flex-1">{student.email}</div>
        <div className="flex-1">{attendanceRate}%</div>
        <div className="flex-1">
          <Badge variant="outline" className={cn("py-1", getStatusColor(status))}>
            {status}
          </Badge>
        </div>
        <div className="text-right">
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More</span>
          </Button>
        </div>
      </div>
    );
  };

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
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="md:w-[300px]"
            value={searchQuery}
            onChange={handleSearchChange}
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
          <div className="rounded-md border">
            {/* Table headers */}
            <div className="bg-muted/50 px-4 py-3 flex items-center font-medium text-sm">
              <div className="w-[80px]"></div>
              <div className="flex-1">Name</div>
              <div className="flex-1">Email</div>
              <div className="flex-1">Attendance</div>
              <div className="flex-1">Status</div>
              <div className="w-[60px]"></div>
            </div>
            
            {/* Virtualized student list */}
            <div className="relative">
              {isLoading && students.length === 0 ? (
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
              ) : students.length === 0 ? (
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
                          height={height || 400}
                          scrollTop={scrollTop}
                          width={width}
                          rowHeight={65}
                          rowCount={students.length}
                          rowRenderer={rowRenderer}
                          overscanRowCount={5}
                        />
                      )}
                    </AutoSizer>
                  )}
                </WindowScroller>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {students.length} of {totalCount} students
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={goToPrevPage} 
                    className={cn(page <= 1 || isLoading ? "pointer-events-none opacity-50" : "")}
                  />
                </PaginationItem>
                
                {/* First page */}
                {page > 2 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Ellipsis for many pages */}
                {page > 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                {/* Previous page */}
                {page > 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setPage(page - 1)}>
                      {page - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Current page */}
                <PaginationItem>
                  <PaginationLink isActive>{page}</PaginationLink>
                </PaginationItem>
                
                {/* Next page */}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setPage(page + 1)}>
                      {page + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Ellipsis for many pages */}
                {page < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                {/* Last page */}
                {page < totalPages - 1 && totalPages > 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setPage(totalPages)}>
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={goToNextPage} 
                    className={cn(page >= totalPages || isLoading ? "pointer-events-none opacity-50" : "")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
      
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