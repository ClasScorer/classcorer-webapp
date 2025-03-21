"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useMemo } from "react"

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentFilters: {
    courseId: string
    minGrade: number
    maxGrade: number
    minAttendance: number
    engagementLevel: string
    status: string
  }
  onApplyFilters: (filters: any) => void
}

export default function FilterDialog({
  open,
  onOpenChange,
  currentFilters,
  onApplyFilters,
}: FilterDialogProps) {
  const [courseId, setCourseId] = useState<string>(currentFilters.courseId || '')
  const [gradeRange, setGradeRange] = useState<[number, number]>([
    currentFilters.minGrade || 0,
    currentFilters.maxGrade || 100,
  ])
  const [minAttendance, setMinAttendance] = useState<number>(
    currentFilters.minAttendance || 0
  )
  const [engagementLevel, setEngagementLevel] = useState<string>(
    currentFilters.engagementLevel || ''
  )
  const [status, setStatus] = useState<string>(currentFilters.status || '')
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/courses")
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchCourses()
    }
  }, [open])

  // Reset filters when dialog opens
  useEffect(() => {
    if (open) {
      setCourseId(currentFilters.courseId || '')
      setGradeRange([currentFilters.minGrade || 0, currentFilters.maxGrade || 100])
      setMinAttendance(currentFilters.minAttendance || 0)
      setEngagementLevel(currentFilters.engagementLevel || '')
      setStatus(currentFilters.status || '')
    }
  }, [open, currentFilters])

  // Apply filters
  const handleApplyFilters = () => {
    onApplyFilters({
      courseId,
      minGrade: gradeRange[0],
      maxGrade: gradeRange[1],
      minAttendance,
      engagementLevel,
      status,
    })
  }

  // Clear filters
  const handleClearFilters = () => {
    setCourseId('')
    setGradeRange([0, 100])
    setMinAttendance(0)
    setEngagementLevel('')
    setStatus('')
    
    onApplyFilters({
      courseId: '',
      minGrade: 0,
      maxGrade: 100,
      minAttendance: 0,
      engagementLevel: '',
      status: '',
    })
  }

  // Format slider value
  const formatGradeValue = (value: number[]) => {
    return `${value[0]}% - ${value[1]}%`
  }

  const formatAttendanceValue = (value: number[]) => {
    return `${value[0]}%+`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Students</DialogTitle>
          <DialogDescription>
            Apply filters to find specific students based on various criteria.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="course">Course</Label>
            <Select
              value={courseId}
              onValueChange={setCourseId}
              disabled={loading}
            >
              <SelectTrigger id="course">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                {courses.length > 0 ? (
                  <>
                    <SelectItem value="_all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No courses available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Grade Range</Label>
            <div className="px-1">
              <Slider
                defaultValue={[0, 100]}
                value={gradeRange}
                onValueChange={setGradeRange as any}
                min={0}
                max={100}
                step={5}
                minStepsBetweenThumbs={1}
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{gradeRange[0]}%</span>
                <span>{formatGradeValue(gradeRange)}</span>
                <span>{gradeRange[1]}%</span>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Minimum Attendance</Label>
            <div className="px-1">
              <Slider
                defaultValue={[0]}
                value={[minAttendance]}
                onValueChange={(value) => setMinAttendance(value[0])}
                min={0}
                max={100}
                step={5}
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>0%</span>
                <span>{formatAttendanceValue([minAttendance])}</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="engagement">Engagement Level</Label>
            <Select value={engagementLevel} onValueChange={setEngagementLevel}>
              <SelectTrigger id="engagement">
                <SelectValue placeholder="Any Engagement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_any">Any Engagement</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Any Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_any">Any Status</SelectItem>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Needs Help">Needs Help</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 