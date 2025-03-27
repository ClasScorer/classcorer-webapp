-- CreateTable
CREATE TABLE "ScoringConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "participationScore" INTEGER NOT NULL DEFAULT 5,
    "engagementScore" INTEGER NOT NULL DEFAULT 5,
    "attendanceScore" INTEGER NOT NULL DEFAULT 5,
    "answerScore" INTEGER NOT NULL DEFAULT 15,
    "talkingBadScore" INTEGER NOT NULL DEFAULT -10,
    "attendanceBadScore" INTEGER NOT NULL DEFAULT -10,
    "repeatedBadScore" INTEGER NOT NULL DEFAULT -20,

    CONSTRAINT "ScoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThresholdConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attendanceThreshold" INTEGER NOT NULL DEFAULT 70,
    "engagementThreshold" INTEGER NOT NULL DEFAULT 60,
    "atRiskThreshold" INTEGER NOT NULL DEFAULT 60,
    "maxScoreThreshold" INTEGER NOT NULL DEFAULT 100,
    "minScoreThreshold" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ThresholdConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecayConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "decayRate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "decayInterval" INTEGER NOT NULL DEFAULT 1,
    "decayThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "DecayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enableThreeStreak" BOOLEAN NOT NULL DEFAULT true,
    "threeStreakBonus" INTEGER NOT NULL DEFAULT 10,
    "enableFiveStreak" BOOLEAN NOT NULL DEFAULT true,
    "fiveStreakBonus" INTEGER NOT NULL DEFAULT 20,
    "constantEngagementBonus" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "BonusConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvancedConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "automaticRiskDetection" BOOLEAN NOT NULL DEFAULT true,
    "realTimeAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "engagementNotifications" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdvancedConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deadzone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deadzone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoringConfig_userId_key" ON "ScoringConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThresholdConfig_userId_key" ON "ThresholdConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DecayConfig_userId_key" ON "DecayConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BonusConfig_userId_key" ON "BonusConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvancedConfig_userId_key" ON "AdvancedConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Deadzone_userId_name_key" ON "Deadzone"("userId", "name");
