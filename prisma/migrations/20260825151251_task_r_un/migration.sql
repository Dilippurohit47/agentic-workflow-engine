-- CreateEnum
CREATE TYPE "TaskRunStatus" AS ENUM ('ATTEMPTED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "TaskTransaction" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "status" "TaskRunStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskTransaction_taskId_runAt_key" ON "TaskTransaction"("taskId", "runAt");
