export interface CourseStats {
  average: number;
  previousAverage: number;
  target: number;
  trend: number;
}

export interface CourseEngagement {
  percentage: number;
  trend: number;
  activeStudents: number;
  totalStudents: number;
  atRiskCount: number;
}

export interface AssignmentStats {
  completionRate: number;
  submittedCount: number;
  totalAssignments: number;
  nextDueAssignment: string;
  status: 'on-track' | 'behind' | 'ahead';
}

export interface CourseProgress {
  percentage: number;
  currentWeek: number;
  totalWeeks: number;
  currentTopic: string;
  nextTopic: string;
  status: 'on-track' | 'behind' | 'ahead';
}

export interface CourseData {
  id: string;
  code: string;
  name: string;
  term: string;
  section: string;
  totalStudents: number;
  attendance: number;
  passRate: number;
  stats: {
    classAverage: CourseStats;
    engagement: CourseEngagement;
    assignments: AssignmentStats;
    progress: CourseProgress;
  };
} 