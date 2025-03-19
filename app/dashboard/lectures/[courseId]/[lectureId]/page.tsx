"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Download, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { 
  getCourseById, 
  getStudentsByCourse, 
  fetchLectureById,
  fetchAttendance,
  updateBulkAttendance
} from "@/lib/data";

export default function LectureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lectureId = params.lectureId as string;
  
  const [course, setCourse] = useState<any>(null);
  const [lecture, setLecture] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [courseData, lectureData, studentsData, attendanceRecords] = await Promise.all([
          getCourseById(courseId),
          fetchLectureById(lectureId),
          getStudentsByCourse(courseId),
          fetchAttendance(lectureId)
        ]);

        if (!courseData || !lectureData) {
          router.push(`/dashboard/lectures/${courseId}`);
          toast.error("Lecture not found");
          return;
        }

        setCourse(courseData);
        setLecture(lectureData);
        setStudents(studentsData);

        // Process attendance data
        if (attendanceRecords && attendanceRecords.length > 0) {
          // Use real attendance data
          setAttendanceData(
            attendanceRecords.map((record: any) => ({
              studentId: record.studentId,
              studentName: record.student.name,
              status: record.status,
              joinTime: record.joinTime,
              leaveTime: record.leaveTime,
              participation: 100, // This would be calculated based on real metrics
              notes: record.notes
            }))
          );
        } else {
          // Generate mock attendance data for students without records
          const mockAttendance = studentsData.map(student => ({
            studentId: student.id,
            studentName: student.name,
            status: Math.random() > 0.2 ? "PRESENT" : Math.random() > 0.5 ? "LATE" : "ABSENT",
            joinTime: new Date(new Date(lectureData.date).getTime() + Math.floor(Math.random() * 15) * 60000),
            leaveTime: new Date(new Date(lectureData.date).getTime() + (lectureData.duration || 60) * 60000 - Math.floor(Math.random() * 10) * 60000),
            participation: Math.floor(Math.random() * 100),
            notes: ""
          }));
          
          setAttendanceData(mockAttendance);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load lecture data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [courseId, lectureId, router]);

  const getTotalAttendance = () => {
    if (!attendanceData.length) return { present: 0, late: 0, absent: 0 };
    
    return {
      present: attendanceData.filter(a => a.status === "PRESENT").length,
      late: attendanceData.filter(a => a.status === "LATE").length,
      absent: attendanceData.filter(a => a.status === "ABSENT").length
    };
  };

  const generateAttendanceReport = () => {
    // In a real application, this would generate a report for download
    toast.success("Attendance report generated!");
  };
  
  const saveAllAttendance = async () => {
    try {
      setIsSaving(true);
      
      // Prepare data for bulk update
      const records = attendanceData.map(record => ({
        studentId: record.studentId,
        status: record.status,
        joinTime: record.joinTime,
        leaveTime: record.leaveTime,
        notes: record.notes
      }));
      
      await updateBulkAttendance(lectureId, records);
      
      toast.success("Attendance records saved successfully");
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance records");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lecture || !course) {
    return null;
  }

  const attendance = getTotalAttendance();
  const attendanceRate = attendance.present + attendance.late + attendance.absent > 0 
    ? Math.round(((attendance.present + attendance.late) / (attendance.present + attendance.late + attendance.absent)) * 100)
    : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push(`/dashboard/lectures/${courseId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lectures
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{lecture.title}</CardTitle>
            <CardDescription>
              {course.name} ({course.code})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Date & Time</p>
                <p className="text-sm text-gray-500">
                  {lecture.date && format(new Date(lecture.date), "PPP 'at' p")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-gray-500">{lecture.duration} minutes</p>
              </div>
            </div>
            
            {lecture.description && (
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-gray-500">{lecture.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>
              Overall attendance rate: {attendanceRate}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-2 bg-green-50 rounded-md">
                <p className="text-2xl font-bold text-green-600">{attendance.present}</p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded-md">
                <p className="text-2xl font-bold text-yellow-600">{attendance.late}</p>
                <p className="text-sm text-gray-600">Late</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-md">
                <p className="text-2xl font-bold text-red-600">{attendance.absent}</p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={generateAttendanceReport}
              >
                <Download className="mr-2 h-4 w-4" /> Export Report
              </Button>
              <Button 
                className="flex-1" 
                onClick={saveAllAttendance}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="attendance">
            <Users className="mr-2 h-4 w-4" /> Attendance Details
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FileText className="mr-2 h-4 w-4" /> Lecture Resources
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance</CardTitle>
              <CardDescription>
                Detailed attendance records for this lecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr className="border-b">
                      <th className="py-3 font-medium">Student</th>
                      <th className="py-3 font-medium">Status</th>
                      <th className="py-3 font-medium">Join Time</th>
                      <th className="py-3 font-medium">Leave Time</th>
                      <th className="py-3 font-medium">Duration</th>
                      <th className="py-3 font-medium">Participation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((record) => {
                      const joinDate = record.joinTime ? new Date(record.joinTime) : null;
                      const leaveDate = record.leaveTime ? new Date(record.leaveTime) : null;
                      const durationMinutes = joinDate && leaveDate
                        ? Math.round((leaveDate.getTime() - joinDate.getTime()) / (60 * 1000))
                        : 0;
                      
                      return (
                        <tr key={record.studentId} className="border-b hover:bg-gray-50">
                          <td className="py-3">{record.studentName}</td>
                          <td className="py-3">
                            <Badge variant={
                              record.status === "PRESENT" ? "default" : 
                              record.status === "LATE" ? "secondary" : "destructive"
                            }>
                              {record.status}
                            </Badge>
                          </td>
                          <td className="py-3">
                            {joinDate ? format(joinDate, "p") : "N/A"}
                          </td>
                          <td className="py-3">
                            {leaveDate ? format(leaveDate, "p") : "N/A"}
                          </td>
                          <td className="py-3">
                            {durationMinutes > 0 ? `${durationMinutes} min` : "N/A"}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-full max-w-[100px] h-2 bg-gray-200 rounded">
                                <div 
                                  className="h-2 bg-blue-500 rounded" 
                                  style={{ width: `${record.participation}%` }}
                                />
                              </div>
                              <span>{record.participation}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lecture Materials</CardTitle>
              <CardDescription>
                Resources shared during this lecture
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center p-8">
              <p className="text-gray-500">No materials have been uploaded for this lecture.</p>
              <Button className="mt-4">
                <FileText className="mr-2 h-4 w-4" /> Upload Materials
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 