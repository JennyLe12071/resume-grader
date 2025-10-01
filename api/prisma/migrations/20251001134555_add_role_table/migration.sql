-- CreateTable
CREATE TABLE "Document" (
    "docId" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Extraction" (
    "extractionId" TEXT NOT NULL PRIMARY KEY,
    "docId" TEXT NOT NULL,
    "idpRequestId" TEXT,
    "extractionJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Extraction_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document" ("docId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "roleId" TEXT NOT NULL PRIMARY KEY,
    "externalJobRef" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "jobId" TEXT NOT NULL PRIMARY KEY,
    "externalJobRef" TEXT NOT NULL,
    "roleId" TEXT,
    "jdDocId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "modelVersion" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Job_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("roleId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobResume" (
    "jobId" TEXT NOT NULL,
    "resumeDocId" TEXT NOT NULL,

    PRIMARY KEY ("jobId", "resumeDocId"),
    CONSTRAINT "JobResume_resumeDocId_fkey" FOREIGN KEY ("resumeDocId") REFERENCES "Document" ("docId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobResume_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("jobId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "scoreId" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "resumeDocId" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'v1',
    "finalScore" REAL NOT NULL,
    "reasonsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("jobId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_externalJobRef_key" ON "Role"("externalJobRef");

-- CreateIndex
CREATE UNIQUE INDEX "Job_externalJobRef_key" ON "Job"("externalJobRef");

-- CreateIndex
CREATE UNIQUE INDEX "Score_jobId_resumeDocId_modelVersion_key" ON "Score"("jobId", "resumeDocId", "modelVersion");
