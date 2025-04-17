-- AlterTable
ALTER TABLE "maintenance_records" ADD COLUMN     "arrival_time" TIMESTAMP(3),
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "route" TEXT;
