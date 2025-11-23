-- CreateTable
CREATE TABLE "AttendanceRatingStats" (
    "attendanceId" TEXT NOT NULL,
    "averageRating" INTEGER NOT NULL DEFAULT 0,
    "totalRating" INTEGER NOT NULL DEFAULT 0,
    "voterCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AttendanceRatingStats_pkey" PRIMARY KEY ("attendanceId")
);

-- CreateTable
CREATE TABLE "AttendanceRatingVote" (
    "attendanceId" TEXT NOT NULL,
    "totalUsedRating" INTEGER NOT NULL DEFAULT 0,
    "hasVoted" BOOLEAN NOT NULL DEFAULT false,
    "votedMemberCount" INTEGER NOT NULL DEFAULT 0,
    "usedLikeCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AttendanceRatingVote_pkey" PRIMARY KEY ("attendanceId")
);

-- CreateTable
CREATE TABLE "AttendanceRatingHistory" (
    "attendanceId" TEXT NOT NULL,
    "monthlyAverageRating" INTEGER NOT NULL DEFAULT 0,
    "monthlyTotalRating" INTEGER NOT NULL DEFAULT 0,
    "quarterlyAverageRating" INTEGER NOT NULL DEFAULT 0,
    "quarterlyTotalRating" INTEGER NOT NULL DEFAULT 0,
    "halfYearAverageRating" INTEGER NOT NULL DEFAULT 0,
    "halfYearTotalRating" INTEGER NOT NULL DEFAULT 0,
    "yearlyAverageRating" INTEGER NOT NULL DEFAULT 0,
    "yearlyTotalRating" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AttendanceRatingHistory_pkey" PRIMARY KEY ("attendanceId")
);

-- AddForeignKey
ALTER TABLE "AttendanceRatingStats" ADD CONSTRAINT "AttendanceRatingStats_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRatingVote" ADD CONSTRAINT "AttendanceRatingVote_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRatingHistory" ADD CONSTRAINT "AttendanceRatingHistory_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
