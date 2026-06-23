-- Add Google Calendar fields to User
ALTER TABLE "User" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Add Google Calendar event ID to Deadline
ALTER TABLE "Deadline" ADD COLUMN "googleEventId" TEXT;
