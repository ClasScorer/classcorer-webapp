import { useState, useEffect, useCallback } from "react";
import { Student } from "@/lib/data";
import { toast } from "sonner";

interface UseCourseStudentsProps {
  courseId: string;
  enabled?: boolean;
}

interface UseCourseStudentsReturn {
  students: Student[];
  filteredStudents: Student[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshStudents: () => Promise<void>;
  getStudentById: (studentId: string) => Student | undefined;
  getStudentsByIds: (studentIds: string[]) => Student[];
}

export function useCourseStudents({
  courseId,
  enabled = true
}: UseCourseStudentsProps): UseCourseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = useCallback(async () => {
    if (!courseId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/students`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch students: ${response.status}`);
      }

      const studentsData = await response.json();
      setStudents(studentsData);
      
      console.log(`Loaded ${studentsData.length} students for course ${courseId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load students';
      setError(errorMessage);
      console.error('Error fetching course students:', err);
      toast.error('Failed to load course students');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, enabled]);

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.id.toString().includes(query)
    );
  });

  const refreshStudents = useCallback(async () => {
    await fetchStudents();
  }, [fetchStudents]);

  const getStudentById = useCallback((studentId: string): Student | undefined => {
    return students.find(student => student.id === studentId);
  }, [students]);

  const getStudentsByIds = useCallback((studentIds: string[]): Student[] => {
    return students.filter(student => studentIds.includes(student.id));
  }, [students]);

  // Initial load
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    filteredStudents,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refreshStudents,
    getStudentById,
    getStudentsByIds
  };
} 