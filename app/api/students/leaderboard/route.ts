import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const courseId = searchParams.get('courseId');

    // Build query filters
    const whereClause: any = {
      professorId: session.user.id
    };

    // If courseId is specified, filter by course enrollment
    if (courseId) {
      whereClause.enrollments = {
        some: {
          courseId: courseId
        }
      };
    }

    // Fetch students with all related data for leaderboard
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        badges: {
          include: {
            badge: {
              select: {
                name: true,
                description: true,
                icon: true
              }
            }
          },
          orderBy: {
            awardedAt: 'desc'
          },
          take: 5 // Latest 5 badges
        },
        actions: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 10, // Recent 10 actions
          select: {
            type: true,
            points: true,
            reason: true,
            timestamp: true
          }
        },
        attendances: {
          where: {
            lecture: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          },
          include: {
            lecture: {
              select: {
                date: true,
                title: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        engagements: {
          include: {
            lecture: {
              select: {
                date: true,
                title: true
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            actions: {
              where: {
                type: 'SCORE_AWARD'
              }
            },
            attendances: {
              where: {
                status: 'PRESENT'
              }
            },
            badges: true
          }
        }
      },
      orderBy: {
        currentScore: 'desc'
      },
      take: limit
    });

    // Calculate additional metrics for each student
    const enrichedStudents = students.map(student => {
      // Calculate total engagement score
      const totalEngagement = student.engagements.reduce(
        (sum, engagement) => sum + (engagement.focusScore || 0), 
        0
      );

      // Calculate average focus score
      const avgFocusScore = student.engagements.length > 0
        ? Math.round(student.engagements.reduce(
            (sum, engagement) => sum + (engagement.focusScore || 0), 
            0
          ) / student.engagements.length)
        : 0;

      // Calculate recent performance trend
      const recentActions = student.actions.slice(0, 5);
      const recentPoints = recentActions.reduce((sum, action) => sum + (action.points || 0), 0);
      
      let performanceTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (recentPoints > 10) performanceTrend = 'improving';
      else if (recentPoints < -10) performanceTrend = 'declining';

      // Calculate attendance rate
      const totalLectures = student.attendances.length;
      const presentCount = student.attendances.filter(a => a.status === 'PRESENT').length;
      const attendanceRate = totalLectures > 0 ? Math.round((presentCount / totalLectures) * 100) : 0;

      // Calculate current streak
      const sortedAttendances = student.attendances
        .filter(a => a.status === 'PRESENT')
        .sort((a, b) => new Date(b.lecture.date).getTime() - new Date(a.lecture.date).getTime());
      
      let currentStreak = 0;
      for (let i = 0; i < sortedAttendances.length; i++) {
        const attendanceDate = new Date(sortedAttendances[i].lecture.date);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - (i + 1));
        
        // Check if attendance was within the last week (to account for weekends)
        const daysDiff = Math.abs(attendanceDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff <= 7) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        ...student,
        metrics: {
          totalEngagement,
          avgFocusScore,
          performanceTrend,
          attendanceRate,
          currentStreak,
          recentPoints,
          totalAwards: student._count.actions,
          totalAttendances: student._count.attendances,
          totalBadges: student._count.badges
        },
        recentActions: student.actions,
        recentAttendances: student.attendances.slice(0, 5)
      };
    });

    // Calculate leaderboard statistics
    const stats = {
      totalStudents: students.length,
      averageScore: students.length > 0 
        ? Math.round(students.reduce((sum, s) => sum + s.currentScore, 0) / students.length)
        : 0,
      highestScore: students.length > 0 ? students[0].currentScore : 0,
      lowestScore: students.length > 0 ? students[students.length - 1].currentScore : 0,
      activeStudents: students.filter(s => 
        s.actions.some(a => 
          new Date(a.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        )
      ).length
    };

    return NextResponse.json({
      success: true,
      students: enrichedStudents,
      stats,
      pagination: {
        total: students.length,
        limit,
        hasMore: students.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 