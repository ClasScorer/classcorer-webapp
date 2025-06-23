import { prisma } from '@/lib/prisma';
import { StudentActionType } from '@prisma/client';

interface GamificationConfig {
  participationScore: number;
  engagementScore: number;
  attendanceScore: number;
  answerScore: number;
  talkingBadScore: number;
  attendanceBadScore: number;
  repeatedBadScore: number;
}

interface AttentionMetrics {
  consecutiveMinutesAttentive: number;
  totalAttentionTime: number;
  handRaisedCount: number;
  participationCount: number;
}

/**
 * Get gamification configuration for a user
 */
export async function getGamificationConfig(userId: string): Promise<GamificationConfig> {
  const config = await prisma.scoringConfig.findUnique({
    where: { userId }
  });

  return config || {
    participationScore: 5,
    engagementScore: 5,
    attendanceScore: 5,
    answerScore: 15,
    talkingBadScore: -10,
    attendanceBadScore: -10,
    repeatedBadScore: -20,
  };
}

/**
 * Award points automatically based on attention metrics
 */
export async function processAttentionMetrics(
  studentId: string,
  lectureId: string,
  userId: string,
  metrics: AttentionMetrics
): Promise<{ pointsAwarded: number; reasons: string[] }> {
  const config = await getGamificationConfig(userId);
  let totalPoints = 0;
  const reasons: string[] = [];

  // Award points for consecutive attention
  if (metrics.consecutiveMinutesAttentive >= 5) {
    const consecutiveBonus = Math.floor(metrics.consecutiveMinutesAttentive / 5) * config.engagementScore;
    totalPoints += consecutiveBonus;
    reasons.push(`${consecutiveBonus} points for ${metrics.consecutiveMinutesAttentive} consecutive minutes of attention`);
  }

  // Award points for hand raising
  if (metrics.handRaisedCount > 0) {
    const handRaisingPoints = metrics.handRaisedCount * config.participationScore;
    totalPoints += handRaisingPoints;
    reasons.push(`${handRaisingPoints} points for raising hand ${metrics.handRaisedCount} times`);
  }

  // Award bonus for sustained engagement (more than 20 minutes total attention)
  if (metrics.totalAttentionTime >= 20) {
    const engagementBonus = config.engagementScore * 2;
    totalPoints += engagementBonus;
    reasons.push(`${engagementBonus} bonus points for sustained engagement (${metrics.totalAttentionTime} minutes)`);
  }

  // Record the automatic award if there are points to award
  if (totalPoints > 0) {
    await recordAutomaticAction(
      studentId,
      lectureId,
      userId,
      'SCORE_AWARD',
      totalPoints,
      reasons.join('; ')
    );

    // Update student's current score
    await prisma.student.update({
      where: { id: studentId },
      data: {
        currentScore: {
          increment: totalPoints
        }
      }
    });
  }

  return { pointsAwarded: totalPoints, reasons };
}

/**
 * Check and award streak bonuses
 */
export async function processStreakBonuses(
  studentId: string,
  lectureId: string,
  userId: string
): Promise<{ bonusAwarded: number; streakType?: string }> {
  // Get bonus configuration
  const bonusConfig = await prisma.bonusConfig.findUnique({
    where: { userId }
  });

  if (!bonusConfig) {
    return { bonusAwarded: 0 };
  }

  // Check recent attendance to calculate streak
  const recentLectures = await prisma.lecture.findMany({
    where: {
      course: {
        instructorId: userId
      },
      date: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    include: {
      attendances: {
        where: { studentId },
        select: { status: true }
      }
    },
    orderBy: { date: 'desc' }
  });

  const consecutiveDays = recentLectures
    .reverse()
    .reduce((streak, lecture) => {
      const attended = lecture.attendances.some(att => att.status === 'PRESENT');
      return attended ? streak + 1 : 0;
    }, 0);

  let bonusAwarded = 0;
  let streakType: string | undefined;

  // Award three-day streak bonus
  if (bonusConfig.enableThreeStreak && consecutiveDays >= 3 && consecutiveDays < 5) {
    bonusAwarded = bonusConfig.threeStreakBonus;
    streakType = 'three-day';
  }
  // Award five-day streak bonus (overrides three-day)
  else if (bonusConfig.enableFiveStreak && consecutiveDays >= 5) {
    bonusAwarded = bonusConfig.fiveStreakBonus;
    streakType = 'five-day';
  }

  if (bonusAwarded > 0) {
    await recordAutomaticAction(
      studentId,
      lectureId,
      userId,
      'SCORE_AWARD',
      bonusAwarded,
      `${streakType} attendance streak bonus`
    );

    await prisma.student.update({
      where: { id: studentId },
      data: {
        currentScore: {
          increment: bonusAwarded
        }
      }
    });
  }

  return { bonusAwarded, streakType };
}

/**
 * Record an automatic action in the database
 */
async function recordAutomaticAction(
  studentId: string,
  lectureId: string,
  instructorId: string,
  type: StudentActionType,
  points: number,
  reason: string
) {
  await prisma.studentAction.create({
    data: {
      type,
      studentId,
      lectureId,
      instructorId,
      points,
      reason,
      details: {
        automatic: true,
        timestamp: new Date().toISOString()
      },
      status: 'COMPLETED'
    }
  });
}

/**
 * Process gamification for a student during a lecture
 * This should be called periodically (e.g., every minute) during an active lecture
 */
export async function processStudentGamification(
  studentId: string,
  lectureId: string,
  userId: string,
  attentionStatus: 'focused' | 'unfocused',
  handRaised: boolean,
  currentEngagement?: any
): Promise<{ pointsAwarded: number; bonusAwarded: number; messages: string[] }> {
  const messages: string[] = [];
  
  // Get current engagement data or create it
  let engagement = currentEngagement;
  if (!engagement) {
    engagement = await prisma.studentEngagement.findFirst({
      where: { studentId, lectureId }
    });
  }

  if (!engagement) {
    // Create initial engagement record
    engagement = await prisma.studentEngagement.create({
      data: {
        studentId,
        lectureId,
        attentionDuration: 0,
        focusScore: 0,
        handRaisedCount: 0,
        engagementLevel: 'medium'
      }
    });
  }

  // Update engagement metrics
  const updatedEngagement = await prisma.studentEngagement.update({
    where: { id: engagement.id },
    data: {
      attentionDuration: attentionStatus === 'focused' 
        ? engagement.attentionDuration + 1 
        : engagement.attentionDuration,
      handRaisedCount: handRaised 
        ? engagement.handRaisedCount + 1 
        : engagement.handRaisedCount,
      focusScore: attentionStatus === 'focused'
        ? Math.min(100, engagement.focusScore + 2)
        : Math.max(0, engagement.focusScore - 1),
      detectionCount: engagement.detectionCount + 1
    }
  });

  // Calculate metrics for gamification
  const metrics: AttentionMetrics = {
    consecutiveMinutesAttentive: attentionStatus === 'focused' ? 
      (engagement.attentionDuration + 1) : 0,
    totalAttentionTime: updatedEngagement.attentionDuration,
    handRaisedCount: updatedEngagement.handRaisedCount,
    participationCount: updatedEngagement.handRaisedCount
  };

  // Process attention-based points
  const attentionResult = await processAttentionMetrics(
    studentId,
    lectureId,
    userId,
    metrics
  );

  // Process streak bonuses
  const streakResult = await processStreakBonuses(
    studentId,
    lectureId,
    userId
  );

  messages.push(...attentionResult.reasons);
  if (streakResult.bonusAwarded > 0) {
    messages.push(`${streakResult.bonusAwarded} bonus points for ${streakResult.streakType} streak!`);
  }

  return {
    pointsAwarded: attentionResult.pointsAwarded,
    bonusAwarded: streakResult.bonusAwarded,
    messages
  };
} 