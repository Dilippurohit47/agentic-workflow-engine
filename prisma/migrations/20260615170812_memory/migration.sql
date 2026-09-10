-- CreateTable
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmMemory" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "embedding" vector,

    CONSTRAINT "LlmMemory_pkey" PRIMARY KEY ("id")
);
