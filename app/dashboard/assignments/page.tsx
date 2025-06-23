"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon, 
  ExternalLink, 
  Download, 
  Upload,
  Users,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Loader2
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  code: string;
  canvasCourseId?: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  pointsPossible: number;
  weight?: number;
  assignmentType: string;
  courseId: string;
  canvasAssignmentId?: string;
  course: Course;
  submissions?: Submission[];
  _count?: { submissions: number };
}

interface Submission {
  id: string;
  score?: number;
  feedback?: string;
  isLate: boolean;
  status: string;
  submittedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

interface CanvasConfig {
  id?: string;
  apiUrl: string;
  apiToken: string;
  isActive: boolean;
  lastSyncedAt?: string;
}

export default function AssignmentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: new Date(),
    pointsPossible: 100,
    weight: 1,
    assignmentType: "ASSIGNMENT",
    courseId: "",
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCanvasConfig(),
        loadCourses(),
        loadAssignments()
      ]);
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Failed to load assignments data");
    } finally {
      setLoading(false);
    }
  };

  const loadCanvasConfig = async () => {
    try {
      const response = await fetch("/api/canvas/config");
      if (response.ok) {
        const config = await response.json();
        setCanvasConfig(config);
        
        // If no Canvas credentials are configured, show a message
        if (!config.apiUrl || !config.apiToken) {
          toast.warning("Canvas integration not configured. Please set up Canvas credentials to sync assignments.");
        }
      }
    } catch (error) {
      console.error("Error loading Canvas config:", error);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch("/api/assignments");
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  };

  const syncWithCanvas = async () => {
    if (!canvasConfig?.isActive) {
      toast.error("Canvas integration is not active. Please configure Canvas credentials first.");
      router.push("/dashboard/canvas-explorer");
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch("/api/assignments/sync-canvas", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Synced ${result.synced} assignments from Canvas`);
        await loadAssignments();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to sync with Canvas");
      }
    } catch (error) {
      console.error("Error syncing with Canvas:", error);
      toast.error("Failed to sync with Canvas");
    } finally {
      setSyncing(false);
    }
  };

  const createAssignment = async () => {
    if (!formData.title || !formData.courseId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Assignment created successfully");
        setIsCreateOpen(false);
        resetForm();
        await loadAssignments();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create assignment");
    }
  };

  const createAttendanceAssignment = async (courseId: string) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;

      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Attendance Tracking",
          description: "Automatic attendance tracking assignment",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          pointsPossible: 100,
          weight: 0.1,
          assignmentType: "OTHER",
          courseId: courseId,
        }),
      });

      if (response.ok) {
        toast.success("Attendance assignment created successfully");
        await loadAssignments();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create attendance assignment");
      }
    } catch (error) {
      console.error("Error creating attendance assignment:", error);
      toast.error("Failed to create attendance assignment");
    }
  };

  const updateAssignment = async () => {
    if (!editingAssignment) return;

    try {
      const response = await fetch(`/api/assignments/${editingAssignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Assignment updated successfully");
        setEditingAssignment(null);
        resetForm();
        await loadAssignments();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update assignment");
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Failed to update assignment");
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Assignment deleted successfully");
        await loadAssignments();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete assignment");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: new Date(),
      pointsPossible: 100,
      weight: 1,
      assignmentType: "ASSIGNMENT",
      courseId: "",
    });
  };

  const startEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      dueDate: parseISO(assignment.dueDate),
      pointsPossible: assignment.pointsPossible,
      weight: assignment.weight || 1,
      assignmentType: assignment.assignmentType,
      courseId: assignment.courseId,
    });
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesCourse = selectedCourse === "all" || assignment.courseId === selectedCourse;
    const matchesSearch = !searchQuery || 
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCourse && matchesSearch;
  });

  // Group assignments by course
  const assignmentsByCourse = filteredAssignments.reduce((acc, assignment) => {
    const courseKey = assignment.course.name;
    if (!acc[courseKey]) {
      acc[courseKey] = [];
    }
    acc[courseKey].push(assignment);
    return acc;
  }, {} as Record<string, Assignment[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading assignments...</span>
      </div>
    );
  }

  // If Canvas not configured, show setup prompt
  if (!canvasConfig?.apiUrl || !canvasConfig?.apiToken) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Canvas Integration Required</h1>
          <p className="text-muted-foreground mb-6">
            To manage assignments, you need to configure Canvas LMS integration first.
          </p>
          <Button onClick={() => router.push("/dashboard/canvas-explorer")}>
            <Settings className="mr-2 h-4 w-4" />
            Configure Canvas Integration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">
            Manage assignments across all your courses
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={syncWithCanvas} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Sync with Canvas
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create a new assignment for your course
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Assignment title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="course">Course</Label>
                    <Select value={formData.courseId} onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Assignment description (optional)"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.dueDate}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, dueDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="points">Points Possible</Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.pointsPossible}
                      onChange={(e) => setFormData(prev => ({ ...prev, pointsPossible: Number(e.target.value) }))}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.assignmentType} onValueChange={(value) => setFormData(prev => ({ ...prev, assignmentType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                        <SelectItem value="QUIZ">Quiz</SelectItem>
                        <SelectItem value="EXAM">Exam</SelectItem>
                        <SelectItem value="PROJECT">Project</SelectItem>
                        <SelectItem value="DISCUSSION">Discussion</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createAssignment}>
                  Create Assignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments by Course */}
      <div className="space-y-6">
        {Object.entries(assignmentsByCourse).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No assignments found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first assignment or sync with Canvas to get started.
              </p>
              <div className="flex justify-center space-x-2">
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assignment
                </Button>
                <Button variant="outline" onClick={syncWithCanvas}>
                  <Download className="mr-2 h-4 w-4" />
                  Sync with Canvas
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(assignmentsByCourse).map(([courseName, courseAssignments]) => {
            const course = courses.find(c => c.name === courseName);
            return (
              <Card key={courseName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <BookOpen className="mr-2 h-5 w-5" />
                        {courseName}
                        {course && (
                          <Badge variant="outline" className="ml-2">
                            {course.code}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {courseAssignments.length} assignment{courseAssignments.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => course && createAttendanceAssignment(course.id)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Attendance
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseAssignments.map(assignment => (
                      <div key={assignment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{assignment.title}</h4>
                              <Badge variant={assignment.title.toLowerCase().includes("attendance") ? "default" : "secondary"}>
                                {assignment.assignmentType}
                              </Badge>
                              {assignment.canvasAssignmentId && (
                                <Badge variant="outline" className="text-xs">
                                  <ExternalLink className="mr-1 h-3 w-3" />
                                  Canvas
                                </Badge>
                              )}
                              {isPast(parseISO(assignment.dueDate)) && (
                                <Badge variant="destructive">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {assignment.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <CalendarIcon className="mr-1 h-4 w-4" />
                                Due {format(parseISO(assignment.dueDate), "PPP")}
                              </span>
                              <span className="flex items-center">
                                <Users className="mr-1 h-4 w-4" />
                                {assignment._count?.submissions || 0} submissions
                              </span>
                              <span className="flex items-center">
                                <CheckCircle className="mr-1 h-4 w-4" />
                                {assignment.pointsPossible} points
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(assignment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{assignment.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAssignment(assignment.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Assignment Dialog */}
      <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Make changes to your assignment
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Assignment title"
                />
              </div>
              <div>
                <Label htmlFor="edit-course">Course</Label>
                <Select value={formData.courseId} onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Assignment description (optional)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, dueDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="edit-points">Points Possible</Label>
                <Input
                  id="edit-points"
                  type="number"
                  value={formData.pointsPossible}
                  onChange={(e) => setFormData(prev => ({ ...prev, pointsPossible: Number(e.target.value) }))}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select value={formData.assignmentType} onValueChange={(value) => setFormData(prev => ({ ...prev, assignmentType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="EXAM">Exam</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                    <SelectItem value="DISCUSSION">Discussion</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAssignment(null)}>
              Cancel
            </Button>
            <Button onClick={updateAssignment}>
              Update Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}