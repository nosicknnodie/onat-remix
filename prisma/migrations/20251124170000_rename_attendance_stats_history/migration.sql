-- 테이블/제약 이름을 신규 모델(AttendanceStatsHistory)에 맞게 변경
ALTER TABLE "AttendanceRatingHistory" RENAME TO "AttendanceStatsHistory";
ALTER TABLE "AttendanceStatsHistory" RENAME CONSTRAINT "AttendanceRatingHistory_pkey" TO "AttendanceStatsHistory_pkey";
ALTER TABLE "AttendanceStatsHistory" RENAME CONSTRAINT "AttendanceRatingHistory_attendanceId_fkey" TO "AttendanceStatsHistory_attendanceId_fkey";
