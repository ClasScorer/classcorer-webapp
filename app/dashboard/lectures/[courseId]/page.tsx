"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import LectureRoom from "@/components/lecture-room/LectureRoom";
import { getCourseById, getStudentsByCourse, fetchLecturesByCourse, Course, Student, Lecture } from "@/lib/data";

export default function LectureRoomPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lectureToDelete, setLectureToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Fetch course data first to validate the course exists
        let courseData;
        try {
          courseData = await getCourseById(courseId);
          if (!courseData) {
            router.push("/dashboard/lectures");
            toast.error("Course not found");
            return;
          }
        } catch (error) {
          console.error("Error fetching course:", error);
          router.push("/dashboard/lectures");
          toast.error(`Unable to load course: ${error instanceof Error ? error.message : "Unknown error"}`);
          return;
        }
        
        // Now fetch the rest of the data
        const [studentsData, lecturesData] = await Promise.all([
          getStudentsByCourse(courseId).catch(error => {
            console.error("Error fetching students:", error);
            toast.error("Failed to load students");
            return [];
          }),
          fetchLecturesByCourse(courseId).catch(error => {
            console.error("Error fetching lectures:", error);
            toast.error("Failed to load lectures");
            return [];
          })
        ]);

        setCourse(courseData);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setLectures(Array.isArray(lecturesData) ? lecturesData : []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load course data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [courseId, router]);

  const deleteLecture = async (lectureId: string) => {
    if (!lectureId) return;
    
    try {
      setIsDeleting(true);
      
      // Call the API to delete the lecture
      const response = await fetch(`/api/lectures/${lectureId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete lecture");
      }
      
      toast.success("Lecture deleted successfully");
      
      // Remove deleted lecture from local state
      setLectures(lectures.filter(lecture => lecture.id !== lectureId));
    } catch (error) {
      console.error("Error deleting lecture:", error);
      toast.error(`Failed to delete lecture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setLectureToDelete(null);
    }
  };
  
  const confirmDeleteLecture = (lectureId: string) => {
    setLectureToDelete(lectureId);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lectures for {course.name}</h1>
        <Button onClick={() => router.push(`/dashboard/lectures/${courseId}/create`)}>
          <Plus className="mr-2 h-4 w-4" /> Create Lecture
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lectures.length > 0 ? (
          lectures.map((lecture) => (
            <Card key={lecture.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{lecture.title}</CardTitle>
                <CardDescription>
                  {lecture.date ? format(new Date(lecture.date), "PPP") : "No date"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    Duration: {lecture.duration} minutes
                  </p>
                </div>
              </CardContent>
              <CardFooter className="mt-auto pt-4 flex justify-between gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => router.push(`/dashboard/lectures/${courseId}/${lecture.id}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> View
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-500 hover:text-red-700"
                  onClick={() => confirmDeleteLecture(lecture.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center p-8">
            <p className="text-lg text-gray-500">No lectures found for this course.</p>
            <p className="text-gray-400 mt-2">
              Create your first lecture to get started.
            </p>
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Start Live Lecture</h2>
        <LectureRoom course={course} students={students} />
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this lecture?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lecture
              and all associated data including attendance records and engagement analytics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (lectureToDelete) {
                  deleteLecture(lectureToDelete);
                }
              }}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 