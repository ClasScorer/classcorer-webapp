-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "joinTime" TIMESTAMP(3),
ADD COLUMN     "leaveTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StudentEngagement" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attentionDuration" INTEGER NOT NULL DEFAULT 0,
    "distractionCount" INTEGER NOT NULL DEFAULT 0,
    "focusScore" INTEGER NOT NULL DEFAULT 0,
    "handRaisedCount" INTEGER NOT NULL DEFAULT 0,
    "recognitionStatus" TEXT NOT NULL DEFAULT 'known',
    "engagementLevel" TEXT NOT NULL DEFAULT 'medium',
    "detectionCount" INTEGER NOT NULL DEFAULT 0,
    "averageConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lectureId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "detectionSnapshots" JSONB[],

    CONSTRAINT "StudentEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentEngagement_studentId_lectureId_key" ON "StudentEngagement"("studentId", "lectureId");

-- AddForeignKey
ALTER TABLE "StudentEngagement" ADD CONSTRAINT "StudentEngagement_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEngagement" ADD CONSTRAINT "StudentEngagement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
