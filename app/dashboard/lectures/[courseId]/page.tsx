"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { LectureRoom } from "./lecture-room";
import { getCourseById, getStudentsByCourse, fetchLecturesByCourse, Course, Student, Lecture } from "@/lib/data";

export default function LectureRoomPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [courseData, studentsData, lecturesData] = await Promise.all([
          getCourseById(courseId),
          getStudentsByCourse(courseId),
          fetchLecturesByCourse(courseId)
        ]);

        if (!courseData) {
          router.push("/dashboard/lectures");
          toast.error("Course not found");
          return;
        }

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
            <Card key={lecture.id}>
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
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/dashboard/lectures/${courseId}/${lecture.id}`)}
                  >
                    View Lecture
                  </Button>
                </div>
              </CardContent>
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
    </div>
  );
} 