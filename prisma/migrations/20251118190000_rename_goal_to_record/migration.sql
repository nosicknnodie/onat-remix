-- Drop old indexes on Goal
DROP INDEX IF EXISTS "Goal_assignedId_idx";
DROP INDEX IF EXISTS "Goal_assistAssignedId_idx";

-- Drop old foreign keys
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_assignedId_fkey";
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_assistAssignedId_fkey";
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_teamId_fkey";
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_quarterId_fkey";

-- Rename table and columns
ALTER TABLE "Goal" RENAME TO "Record";
ALTER TABLE "Record" RENAME COLUMN "assignedId" TO "attendanceId";
ALTER TABLE "Record" RENAME COLUMN "assistAssignedId" TO "assistAttendanceId";

-- Migrate identifiers from Assigned -> Attendance
UPDATE "Record" r
SET "attendanceId" = a."attendanceId"
FROM "Assigned" a
WHERE r."attendanceId" = a."id";

UPDATE "Record" r
SET "assistAttendanceId" = a."attendanceId"
FROM "Assigned" a
WHERE r."assistAttendanceId" = a."id";

-- Recreate indexes with new names
CREATE INDEX "Record_attendanceId_idx" ON "Record"("attendanceId");
CREATE INDEX "Record_assistAttendanceId_idx" ON "Record"("assistAttendanceId");

-- Recreate foreign keys
ALTER TABLE "Record" ADD CONSTRAINT "Record_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_assistAttendanceId_fkey" FOREIGN KEY ("assistAttendanceId") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_quarterId_fkey" FOREIGN KEY ("quarterId") REFERENCES "Quarter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
