import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Course } from "@prisma/client"
import { useState } from "react"

export interface FilterOptions {
  courseId?: string
  gradeRange: [number, number]
  attendanceThreshold?: number
  engagementLevel?: 'high' | 'medium' | 'low'
  status?: 'Excellent' | 'Good' | 'Needs Help'
}

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courses: Course[]
  initialFilters: FilterOptions
  onApplyFilters: (filters: FilterOptions) => void
}

export function FilterDialog({
  open,
  onOpenChange,
  courses,
  initialFilters,
  onApplyFilters,
}: FilterDialogProps) {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters)

  const handleApply = () => {
    onApplyFilters(filters)
    onOpenChange(false)
  }

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      courseId: undefined,
      gradeRange: [0, 100],
      attendanceThreshold: undefined,
      engagementLevel: undefined,
      status: undefined,
    }
    setFilters(resetFilters)
    onApplyFilters(resetFilters)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Students</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="course">Course</Label>
            <Select
              value={filters.courseId || "all"}
              onValueChange={(value) => setFilters({ ...filters, courseId: value === "all" ? undefined : value })}
            >
              <SelectTrigger id="course">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Grade Range</Label>
            <div className="pt-2">
              <Slider
                defaultValue={filters.gradeRange}
                max={100}
                min={0}
                step={1}
                value={filters.gradeRange}
                onValueChange={(value) => setFilters({ ...filters, gradeRange: value as [number, number] })}
              />
              <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                <span>{filters.gradeRange[0]}%</span>
                <span>{filters.gradeRange[1]}%</span>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attendance">Minimum Attendance</Label>
            <Select
              value={filters.attendanceThreshold?.toString() || "none"}
              onValueChange={(value) => setFilters({ ...filters, attendanceThreshold: value === "none" ? undefined : parseInt(value) })}
            >
              <SelectTrigger id="attendance">
                <SelectValue placeholder="Any Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any Attendance</SelectItem>
                <SelectItem value="75">Above 75%</SelectItem>
                <SelectItem value="85">Above 85%</SelectItem>
                <SelectItem value="90">Above 90%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="engagement">Engagement Level</Label>
            <Select
              value={filters.engagementLevel || "any"}
              onValueChange={(value) => setFilters({ ...filters, engagementLevel: value === "any" ? undefined : value as FilterOptions['engagementLevel'] })}
            >
              <SelectTrigger id="engagement">
                <SelectValue placeholder="Any Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Level</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status || "any"}
              onValueChange={(value) => setFilters({ ...filters, status: value === "any" ? undefined : value as FilterOptions['status'] })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Any Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Status</SelectItem>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Needs Help">Needs Help</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 