"use client"

import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ArrowUpRight, GraduationCap, BookOpen, Clock, Trophy, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { fetchStudents, type Student, type Course, fetchCourses } from "@/lib/data";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddStudentDialog } from "./add-student-dialog"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StudentDetailsDialog } from "./student-details-dialog"
import { FilterDialog, type FilterOptions } from "./filter-dialog"

// Remove metadata since this is now a client component
// export const metadata: Metadata = {
//   title: "Students",
//   description: "View and manage student information",
// };

const ITEMS_PER_PAGE = 10;

interface StudentWithUI extends Student {
  isExpanded?: boolean;
}

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailedStudent, setDetailedStudent] = useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    courseId: undefined,
    gradeRange: [0, 100],
    attendanceThreshold: undefined,
    engagementLevel: undefined,
    status: undefined
  });

  // Load students data with all related information
  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsResponse, coursesResponse] = await Promise.all([
          fetch('/api/students?include=all'),
          fetch('/api/courses')
        ]);

        if (!studentsResponse.ok || !coursesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [studentsData, coursesData] = await Promise.all([
          studentsResponse.json(),
          coursesResponse.json()
        ]);

        setStudents(studentsData);
        setCourses(coursesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error("Failed to load students data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter students based on search query and filters
  const filteredStudents = students.filter(student => {
    // Text search
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Course filter
    if (filters.courseId) {
      const matchesCourse = Array.isArray(student.enrollments) &&
        student.enrollments.some(e => e.courseId === filters.courseId);
      if (!matchesCourse) return false;
    }

    // Grade filter
    const studentGrade = Array.isArray(student.submissions) && student.submissions.length > 0
      ? Math.round(student.submissions.reduce((acc, sub) => acc + (sub.score || 0), 0) / student.submissions.length)
      : 0;
    if (studentGrade < filters.gradeRange[0] || studentGrade > filters.gradeRange[1]) return false;

    // Attendance filter
    if (filters.attendanceThreshold) {
      const attendanceRate = Array.isArray(student.attendances) && student.attendances.length > 0
        ? (student.attendances.filter(a => a.status === 'PRESENT').length / student.attendances.length) * 100
        : 0;
      if (attendanceRate < filters.attendanceThreshold) return false;
    }

    // Engagement filter
    if (filters.engagementLevel) {
      const avgEngagement = Array.isArray(student.engagements) && student.engagements.length > 0
        ? student.engagements.reduce((acc, eng) => acc + eng.focusScore, 0) / student.engagements.length
        : 0;
      
      const engagementLevel = 
        avgEngagement >= 80 ? 'high' :
        avgEngagement >= 50 ? 'medium' : 'low';
      
      if (engagementLevel !== filters.engagementLevel) return false;
    }

    // Status filter
    if (filters.status) {
      const studentGradeStatus = 
        studentGrade >= 85 ? 'Excellent' :
        studentGrade >= 70 ? 'Good' : 'Needs Help';
      
      if (studentGradeStatus !== filters.status) return false;
    }

    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Stats calculations
  const totalStudents = students.length;
  const averageGrade = students.length > 0
    ? Math.round(students.reduce((acc, s) => {
        if (!Array.isArray(s.submissions)) return acc;
        const studentGrade = s.submissions.length > 0
          ? s.submissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / s.submissions.length
          : 0;
        return acc + studentGrade;
      }, 0) / students.length)
    : 0;

  const averageAttendance = students.length > 0
    ? Math.round(students.reduce((acc, s) => {
        if (!Array.isArray(s.attendances)) return acc;
        const attendance = s.attendances.length > 0
          ? (s.attendances.filter(a => a.status === 'PRESENT').length / s.attendances.length) * 100
          : 0;
        return acc + attendance;
      }, 0) / students.length)
    : 0;

  const activeCourses = new Set(
    students.flatMap(s => Array.isArray(s.enrollments) ? s.enrollments.map(e => e.courseId) : [])
  ).size;

  const handleAddStudent = async (studentData: {
    name: string
    email: string
    courseId: string
  }) => {
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add student")
      }

      const newStudent = await response.json()
      setStudents(prev => [...prev, newStudent])
      toast.success("Student added successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add student")
      throw error
    }
  }

  const handleViewDetails = async (studentId: string) => {
    try {
      console.log('Fetching details for student:', studentId);
      const response = await fetch(`/api/students/${studentId}?include=all`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch student details: ${response.status}`);
      }

      let detailedData;
      try {
        detailedData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        toast.error("Invalid response format from server");
        return;
      }

      // Validate the response data
      if (!detailedData || typeof detailedData !== 'object') {
        toast.error("Invalid student data received");
        return;
      }

      setDetailedStudent(detailedData);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Error loading student details:', error);
      toast.error(error instanceof Error ? error.message : "Failed to load student details");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">Manage and monitor student performance across all courses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <AddStudentDialog courses={courses} onAddStudent={handleAddStudent} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across {activeCourses} courses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGrade}%</div>
            <p className="text-xs text-muted-foreground">Overall class performance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAttendance}%</div>
            <p className="text-xs text-muted-foreground">Average attendance rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCourses}</div>
            <p className="text-xs text-muted-foreground">Currently running courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-8" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        {Object.values(filters).some(v => v !== undefined && v !== null && (Array.isArray(v) ? v[0] !== 0 || v[1] !== 100 : true)) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({
                courseId: undefined,
                gradeRange: [0, 100],
                attendanceThreshold: undefined,
                engagementLevel: undefined,
                status: undefined
              });
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Average Grade</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => {
                const studentGrade = Array.isArray(student.submissions) && student.submissions.length > 0
                  ? Math.round(student.submissions.reduce((acc, sub) => acc + (sub.score || 0), 0) / student.submissions.length)
                  : null;

                const attendanceRate = Array.isArray(student.attendances) && student.attendances.length > 0
                  ? Math.round(student.attendances.filter(a => a.status === 'PRESENT').length / student.attendances.length * 100)
                  : null;

                const courseCount = Array.isArray(student.enrollments) ? student.enrollments.length : 0;

                return (
                  <TableRow key={student.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(student.id)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{courseCount} courses</TableCell>
                    <TableCell>
                      {studentGrade !== null ? `${studentGrade}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {attendanceRate !== null ? `${attendanceRate}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        studentGrade >= 85 ? 'default' :
                        studentGrade >= 70 ? 'secondary' : 'destructive'
                      }>
                        {studentGrade >= 85 ? 'Excellent' :
                         studentGrade >= 70 ? 'Good' : 'Needs Help'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(student.id);
                      }}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>

      {/* Filter Dialog */}
      <FilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        courses={courses}
        initialFilters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
      />

      {/* Student Details Dialog */}
      <StudentDetailsDialog
        student={detailedStudent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
} 