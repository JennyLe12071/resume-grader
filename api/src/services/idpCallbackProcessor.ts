import { prisma } from '../index';
import crypto from 'crypto';

export interface IdpCallbackData {
  externalJobRef: string;
  jd?: any;
  resumes?: any[];
  idempotencyKey?: string;
  hmac?: string;
}

export interface ProcessResult {
  jobId: string;
  documentsCreated: number;
  extractionsCreated: number;
  jobResumesCreated: number;
}

export async function processIdpCallback(
  externalJobRef: string,
  jd: any,
  resumes: any[]
): Promise<ProcessResult> {
  console.log(`Processing IDP callback for job ${externalJobRef}`);
  
  let documentsCreated = 0;
  let extractionsCreated = 0;
  let jobResumesCreated = 0;
  
  // Find or create job
  let job = await prisma.job.findUnique({
    where: { externalJobRef }
  });
  
  if (!job) {
    job = await prisma.job.create({
      data: {
        externalJobRef,
        status: 'PENDING'
      }
    });
    console.log(`Created new job: ${job.jobId}`);
  }
  
  // Process Job Description
  if (jd) {
    const jdResult = await processJobDescription(job.jobId, externalJobRef, jd);
    documentsCreated += jdResult.documentsCreated;
    extractionsCreated += jdResult.extractionsCreated;
  }
  
  // Process Resumes
  if (resumes && resumes.length > 0) {
    const resumeResults = await processResumes(job.jobId, externalJobRef, resumes);
    documentsCreated += resumeResults.documentsCreated;
    extractionsCreated += resumeResults.extractionsCreated;
    jobResumesCreated += resumeResults.jobResumesCreated;
  }
  
  // Update job status to READY if we have both JD and resumes
  const jdDoc = await prisma.document.findFirst({
    where: { jobNumber: externalJobRef, type: 'JD' }
  });
  
  const resumeCount = await prisma.document.count({
    where: { jobNumber: externalJobRef, type: 'RESUME' }
  });
  
  if (jdDoc && resumeCount > 0) {
    await prisma.job.update({
      where: { jobId: job.jobId },
      data: { 
        status: 'READY',
        jdDocId: jdDoc.docId  // Link the JD document to the job
      }
    });
    console.log(`Job ${job.jobId} marked as READY with JD: ${jdDoc.docId}`);
  }
  
  return {
    jobId: job.jobId,
    documentsCreated,
    extractionsCreated,
    jobResumesCreated
  };
}

async function processJobDescription(
  jobId: string,
  jobNumber: string,
  jdData: any
): Promise<{ documentsCreated: number; extractionsCreated: number }> {
  console.log(`Processing job description for job ${jobNumber}`);
  
  // Generate docKey and contentHash for JD
  const jdJson = JSON.stringify(jdData);
  const contentHash = crypto.createHash('sha256').update(jdJson).digest('hex');
  const docKey = `jd_${jobNumber}_${Date.now()}`;
  
  // Upsert document
  const document = await prisma.document.upsert({
    where: { docKey },
    update: {
      contentHash,
      uploadedAt: new Date()
    },
    create: {
      docKey,
      type: 'JD',
      jobNumber,
      contentHash,
      mimeType: 'application/json'
    }
  });
  
  // Create extraction record
  await prisma.extraction.create({
    data: {
      docId: document.docId,
      idpRequestId: `idp_jd_${Date.now()}`,
      extractionJson: jdJson,
      extractionVersion: 'v1',
      status: 'PARSED'
    }
  });
  
  console.log(`✅ Processed JD: ${document.docId}`);
  
  return { documentsCreated: 1, extractionsCreated: 1 };
}

async function processResumes(
  jobId: string,
  jobNumber: string,
  resumes: any[]
): Promise<{ documentsCreated: number; extractionsCreated: number; jobResumesCreated: number }> {
  console.log(`Processing ${resumes.length} resumes for job ${jobNumber}`);
  
  let documentsCreated = 0;
  let extractionsCreated = 0;
  let jobResumesCreated = 0;
  
  for (let i = 0; i < resumes.length; i++) {
    const resumeData = resumes[i];
    
    // Generate docKey and contentHash for resume
    const resumeJson = JSON.stringify(resumeData);
    const contentHash = crypto.createHash('sha256').update(resumeJson).digest('hex');
    const docKey = `resume_${jobNumber}_${i}_${Date.now()}`;
    
    // Upsert document
    const document = await prisma.document.upsert({
      where: { docKey },
      update: {
        contentHash,
        uploadedAt: new Date()
      },
      create: {
        docKey,
        type: 'RESUME',
        jobNumber,
        contentHash,
        mimeType: 'application/json'
      }
    });
    
    // Create extraction record
    await prisma.extraction.create({
      data: {
        docId: document.docId,
        idpRequestId: `idp_resume_${i}_${Date.now()}`,
        extractionJson: resumeJson,
        extractionVersion: 'v1',
        status: 'PARSED'
      }
    });
    
    // Create job-resume relationship
    await prisma.jobResume.upsert({
      where: {
        jobId_resumeDocId: {
          jobId,
          resumeDocId: document.docId
        }
      },
      update: {},
      create: {
        jobId,
        resumeDocId: document.docId
      }
    });
    
    documentsCreated++;
    extractionsCreated++;
    jobResumesCreated++;
    
    console.log(`✅ Processed resume ${i + 1}: ${document.docId}`);
  }
  
  return { documentsCreated, extractionsCreated, jobResumesCreated };
}
