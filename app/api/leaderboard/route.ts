import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const lectureId = searchParams.get('lectureId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Find course by normalized ID
    const courses = await prisma.course.findMany();
    const course = courses.find(c => c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === courseId);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // If we have a lectureId, only show students who were detected in this lecture
    if (lectureId) {
      // Get engagement records for this lecture
      const engagementRecords = await prisma.studentEngagement.findMany({
        where: {
          lectureId: lectureId
        },
        include: {
          student: true
        }
      });

      // If no engagements yet, return empty array
      if (engagementRecords.length === 0) {
        return NextResponse.json([]);
      }

      // Map engagement records to student data
      const students = engagementRecords.map(record => {
        return {
          id: record.student.id,
          name: record.student.name,
          email: record.student.email,
          avatar: record.student.avatar || `https://avatar.vercel.sh/${record.student.id}`,
          score: record.focusScore, // Use actual focus score from engagement
          level: Math.floor(record.attentionDuration / 60) + 1, // Level based on attention time in minutes
          badges: [
            record.engagementLevel.charAt(0).toUpperCase() + record.engagementLevel.slice(1), // Capitalize first letter
            record.handRaisedCount > 0 ? "Active Participant" : "Viewer"
          ],
          course: course.name,
          grade: record.focusScore >= 80 ? "A" : 
                 record.focusScore >= 70 ? "B" : 
                 record.focusScore >= 60 ? "C" : 
                 record.focusScore >= 50 ? "D" : "F",
          streak: Math.min(record.attentionDuration / 30, 10), // Streak based on attention time (max 10)
          progress: Math.min(record.attentionDuration / 3, 100) // Progress percentage based on attention time
        };
      });

      // Sort by score (descending)
      return NextResponse.json(students.sort((a, b) => b.score - a.score));
    }
    
    // Otherwise, get all enrollments for this course (default behavior)
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        courseId: course.id
      },
      include: {
        student: true
      }
    });

    // Map enrollments to the expected student data format
    const students = enrollments.map(enrollment => {
      return {
        id: enrollment.student.id,
        name: enrollment.student.name,
        email: enrollment.student.email,
        avatar: enrollment.student.avatar || `https://avatar.vercel.sh/${enrollment.student.id}`,
        score: Math.floor(Math.random() * 1000), // placeholder score for now
        level: Math.floor(Math.random() * 10) + 1, // placeholder level
        badges: ["Active", "Engaged"], // placeholder badges
        course: course.name,
        grade: ["A", "B", "C", "A-", "B+"][Math.floor(Math.random() * 5)], // placeholder grade
        streak: Math.floor(Math.random() * 10), // placeholder streak
        progress: Math.floor(Math.random() * 100) // placeholder progress
      };
    });

    // Sort by score (descending)
    return NextResponse.json(students.sort((a, b) => b.score - a.score));
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
} 