"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Presentation, Users, BookOpen, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { fetchCourses } from "@/lib/data";

export default function LecturesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const coursesData = await fetchCourses();
        setCourses(coursesData);
      } catch (error) {
        console.error("Error loading courses:", error);
        toast.error("Failed to load courses");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lectures</h1>
          <p className="text-gray-500">Manage lectures for your courses</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.length > 0 ? (
          courses.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>{course.name}</span>
                  {course.status && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      course.status === 'Active' ? 'bg-green-100 text-green-700' : 
                      course.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {course.status}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{course.code}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Presentation className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {course.lectures?.length || 0} Lectures
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {course.totalStudents || 0} Students
                      </span>
                    </div>
                    <div className="flex items-center col-span-2">
                      <BookOpen className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Week {course.week || 1} of {Math.ceil(course.credits * 2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/dashboard/lectures/${course.id}`)}
                >
                  Manage Lectures
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center p-12">
            <Presentation className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No Courses Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              You don't have any courses yet. Create a course to start managing lectures.
            </p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/courses/create')}>
              Create Course
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 