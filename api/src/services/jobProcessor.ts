import { prisma } from '../index';
import { gradeResumeWithOpenAI, JobDescriptionData, ResumeData } from './llmService';
import { createIdpAdapter } from '../adapters/idpAdapter';
import { ExtractionNormalizer } from './normalizer';
import { mockIdpJD, mockIdpResumes } from '../mocks/fixtures';
import { idpJDToJobDescriptionDataCustom, idpResumeToResumeDataCustom } from '../adapters/idpToApp';
import crypto from 'crypto';

// Helper function to store extractions in database
export async function storeExtractions(jobId: string, externalJobRef: string, extractions: any[]) {
  for (const extraction of extractions) {
    // Create or update document
    const extractionJson = extraction.extractionJson || JSON.stringify(extraction.extractionData || {});
    const contentHash = crypto.createHash('sha256').update(extractionJson).digest('hex');
    
    const document = await prisma.document.upsert({
      where: { docKey: `${externalJobRef}_${extraction.itemId}` },
      update: {
        contentHash,
        uploadedAt: new Date()
      },
      create: {
        docKey: `${externalJobRef}_${extraction.itemId}`,
        type: extraction.type,
        jobNumber: externalJobRef,
        contentHash,
        mimeType: 'application/json'
      }
    });

    // Check if extraction already exists
    const existingExtraction = await prisma.extraction.findFirst({
      where: {
        docId: document.docId,
        status: 'PARSED'
      }
    });

    // Only create extraction if it doesn't exist
    if (!existingExtraction) {
      await prisma.extraction.create({
        data: {
          docId: document.docId,
          idpRequestId: `idp_${extraction.itemId}_${Date.now()}`,
          extractionJson: extractionJson,
          extractionVersion: extraction.extractionVersion || 'v1',
          status: extraction.status || 'PARSED'
        }
      });
    }

    // Create job-resume relationship for resumes
    if (extraction.type === 'RESUME') {
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
    }
  }
}

// MuleSoft IDP Integration
async function callMuleSoftIDP(filePaths: string[]): Promise<any> {
  // TODO: Replace with actual MuleSoft IDP API call
  // For now, return mock data
  console.log('Calling MuleSoft IDP with file paths:', filePaths);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data structure that matches your 18 IDP fields
  return {
    jobDescription: mockIdpJD,
    resumes: mockIdpResumes
  };
}

// In-memory queue for MVP
const processingQueue: string[] = [];
let isProcessing = false;

export async function processJob(jobId: string) {
  console.log(`Starting job processing for ${jobId}`);
  
  // Add to queue
  processingQueue.push(jobId);
  
  // Start processing if not already running
  if (!isProcessing) {
    processQueue();
  }
}

async function processQueue() {
  if (isProcessing || processingQueue.length === 0) {
    return;
  }

  isProcessing = true;

  while (processingQueue.length > 0) {
    const jobId = processingQueue.shift()!;
    await processJobInternal(jobId);
  }

  isProcessing = false;
}

async function processJobInternal(jobId: string) {
  try {
    // Update job status to PROCESSING
    await prisma.job.update({
      where: { jobId },
      data: { status: 'PROCESSING' }
    });

    // Get job with documents
    const job = await prisma.job.findUnique({
      where: { jobId },
      include: {
        jobResumes: {
          include: {
            resume: {
              include: {
                extractions: true
              }
            }
          }
        }
      }
    });

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Check if we have extractions for all documents
    const jdDoc = await prisma.document.findFirst({
      where: { jobNumber: job.externalJobRef, type: 'JD' },
      include: { extractions: true }
    });
    
    if (!jdDoc || jdDoc.extractions.length === 0) {
      throw new Error(`No JD extraction found for job ${jobId}`);
    }
    
    const resumeDocs = await prisma.document.findMany({
      where: { jobNumber: job.externalJobRef, type: 'RESUME' },
      include: { extractions: true }
    });
    
    if (resumeDocs.length === 0) {
      throw new Error(`No resume extractions found for job ${jobId}`);
    }
    
    console.log(`Found ${jdDoc.extractions.length} JD extractions and ${resumeDocs.length} resume extractions`);

    // Process grading
    await processGrading(jobId);

    // Mark job as READY
    await prisma.job.update({
      where: { jobId },
      data: { status: 'READY' }
    });

    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    
    // Mark job as ERROR
    await prisma.job.update({
      where: { jobId },
      data: { status: 'ERROR' }
    });
  }
}

async function processJDExtraction(docId: string) {
  // Check if already processed
  const existing = await prisma.extraction.findFirst({
    where: { docId, status: 'PARSED' }
  });

  if (existing) {
    return;
  }

  // Get document content
  const document = await prisma.document.findUnique({
    where: { docId }
  });

  if (!document) {
    throw new Error(`Document ${docId} not found`);
  }

  let extractionData: any;

  // Check if IDP API is configured
  if (process.env.IDP_BASE_URL && process.env.IDP_API_KEY) {
    console.log(`Using real IDP API for JD extraction: ${docId}`);
    try {
      // Convert base64 back to buffer
      // PDF content is no longer stored in database in new architecture
      // const pdfBuffer = Buffer.from(document.content, 'base64');
      
      // Call real IDP API
      const response = await fetch(`${process.env.IDP_BASE_URL}/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.IDP_API_KEY}`,
          'Content-Type': 'application/pdf'
        },
        body: Buffer.from('mock-pdf-content') // Mock content for testing
      });

      if (!response.ok) {
        throw new Error(`IDP API error: ${response.status} ${response.statusText}`);
      }

      extractionData = await response.json();
      console.log(`✅ Real IDP extraction completed for ${docId}`);
    } catch (error) {
      console.error(`IDP API failed for ${docId}, falling back to mock:`, error);
      extractionData = getMockJDData();
    }
  } else {
    console.log(`Using mock IDP for JD extraction: ${docId}`);
    extractionData = getMockJDData();
  }

  // Create extraction record
  await prisma.extraction.create({
    data: {
      docId,
      idpRequestId: `idp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      extractionJson: JSON.stringify(extractionData),
      status: 'PARSED'
    }
  });

  console.log(`JD extraction completed for ${docId}`);
}

function getMockJDData() {
  // Use the new mock IDP data and convert it to our format
  const idpData = mockIdpJD;
  const convertedData = idpJDToJobDescriptionDataCustom(idpData);
  
  // Return in the format expected by the existing code
  return {
    title: convertedData.title,
    requirements: convertedData.requirements || [],
    description: convertedData.description,
    experience_level: convertedData.experience_level,
    skills: convertedData.skills || [],
    education: convertedData.education
  };
}

async function processResumeExtraction(docId: string) {
  // Check if already processed
  const existing = await prisma.extraction.findFirst({
    where: { docId, status: 'PARSED' }
  });

  if (existing) {
    return;
  }

  // Get document content
  const document = await prisma.document.findUnique({
    where: { docId }
  });

  if (!document) {
    throw new Error(`Document ${docId} not found`);
  }

  let extractionData: any;

  // Check if IDP API is configured
  if (process.env.IDP_BASE_URL && process.env.IDP_API_KEY) {
    console.log(`Using real IDP API for resume extraction: ${docId}`);
    try {
      // Convert base64 back to buffer
      // PDF content is no longer stored in database in new architecture
      // const pdfBuffer = Buffer.from(document.content, 'base64');
      
      // Call real IDP API
      const response = await fetch(`${process.env.IDP_BASE_URL}/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.IDP_API_KEY}`,
          'Content-Type': 'application/pdf'
        },
        body: Buffer.from('mock-pdf-content') // Mock content for testing
      });

      if (!response.ok) {
        throw new Error(`IDP API error: ${response.status} ${response.statusText}`);
      }

      extractionData = await response.json();
      console.log(`✅ Real IDP extraction completed for ${docId}`);
    } catch (error) {
      console.error(`IDP API failed for ${docId}, falling back to mock:`, error);
      extractionData = generateMockResumeData();
    }
  } else {
    console.log(`Using mock IDP for resume extraction: ${docId}`);
    extractionData = generateMockResumeData();
  }

  // Create extraction record
  await prisma.extraction.create({
    data: {
      docId,
      idpRequestId: `idp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      extractionJson: JSON.stringify(extractionData),
      status: 'PARSED'
    }
  });

  console.log(`Resume extraction completed for ${docId}`);
}

function generateMockResumeData() {
  // Use the new mock IDP data and convert it to our format
  const randomResume = mockIdpResumes[Math.floor(Math.random() * mockIdpResumes.length)];
  const convertedData = idpResumeToResumeDataCustom(randomResume);
  
  // Return in the format expected by the existing code
  return {
    name: convertedData.name,
    email: convertedData.email || `${convertedData.name.toLowerCase().replace(' ', '.')}@example.com`,
    phone: convertedData.phone || `555-${Math.floor(Math.random() * 9000) + 1000}`,
    skills: convertedData.skills || [],
    experience: convertedData.experience || [],
    education: convertedData.education || [],
    fullText: convertedData.summary || `${convertedData.name} is an experienced professional with relevant skills and qualifications.`
  };
}

export async function processGrading(jobId: string) {
  // Get job with JD and resume extractions
  const job = await prisma.job.findUnique({
    where: { jobId },
    include: {
      jobResumes: {
        include: {
          resume: {
            include: {
              extractions: {
                where: { status: 'PARSED' }
              }
            }
          }
        }
      }
    }
  });

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // Get JD extraction
  const jdExtraction = await prisma.extraction.findFirst({
    where: { 
      docId: job.jdDocId || undefined,
      status: 'PARSED'
    }
  });

  if (!jdExtraction) {
    throw new Error('JD extraction not found');
  }

  const jdData = JSON.parse(jdExtraction.extractionJson!);

  // Grade each resume
  for (const jobResume of job.jobResumes) {
    const resumeExtraction = jobResume.resume.extractions[0];
    if (!resumeExtraction) {
      continue;
    }

    const resumeData = JSON.parse(resumeExtraction.extractionJson!);
    
    // Convert to proper interfaces for grading using adapter functions
    const jdForGrading: JobDescriptionData = idpJDToJobDescriptionDataCustom(jdData);
    const resumeForGrading: ResumeData = idpResumeToResumeDataCustom(resumeData);
    
    // Use OpenAI for grading if API key is available, otherwise fallback to mock
    let grade;
    if (process.env.OPENAI_API_KEY) {
      console.log(`Using OpenAI for grading resume: ${jobResume.resumeDocId}`);
      grade = await gradeResumeWithOpenAI(jdForGrading, resumeForGrading);
    } else {
      console.log(`OpenAI API key not configured, using mock grading for: ${jobResume.resumeDocId}`);
      grade = calculateMockGrade(jdForGrading, resumeForGrading);
    }

    // Save score (upsert to handle duplicates)
    await prisma.score.upsert({
      where: {
        jobId_resumeDocId_modelVersion: {
          jobId,
          resumeDocId: jobResume.resumeDocId,
          modelVersion: 'v1'
        }
      },
      update: {
        finalScore: grade.finalScore,
        reasonsJson: JSON.stringify(grade.topReasons)
      },
      create: {
        jobId,
        resumeDocId: jobResume.resumeDocId,
        modelVersion: 'v1',
        finalScore: grade.finalScore,
        reasonsJson: JSON.stringify(grade.topReasons)
      }
    });
  }

  console.log(`Grading completed for job ${jobId}`);
}

function calculateMockGrade(jdData: JobDescriptionData, resumeData: ResumeData): { finalScore: number; topReasons: string[] } {
  let score = 50; // Base score
  const reasons: string[] = [];

  // Check skills overlap
  const jdSkills = jdData.skills || [];
  const resumeSkills = resumeData.skills || [];
  const skillOverlap = jdSkills.filter((skill: string) => 
    resumeSkills.some((resumeSkill: string) => 
      resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(resumeSkill.toLowerCase())
    )
  );

  if (skillOverlap.length > 0) {
    score += skillOverlap.length * 8;
    reasons.push(`Strong technical skills match: ${skillOverlap.join(', ')}`);
  }

  // Check experience level
  const jdExperience = jdData.experience_level || '';
  const resumeExperience = resumeData.experience?.[0]?.years || 0;
  
  if (jdExperience.toLowerCase().includes('senior') && resumeExperience >= 5) {
    score += 15;
    reasons.push(`${resumeExperience} years of experience meets senior requirements`);
  } else if (resumeExperience >= 3) {
    score += 10;
    reasons.push(`${resumeExperience} years of relevant experience`);
  }

  // Check education
  if (resumeData.education?.[0]) {
    score += 8;
    const edu = resumeData.education[0];
    reasons.push(`Strong educational background: ${edu.degree} in ${edu.field}`);
  }

  // Add some randomness for variety
  score += Math.floor(Math.random() * 20) - 10;
  score = Math.max(0, Math.min(100, score));

  // Ensure we have at least 3 reasons
  while (reasons.length < 3) {
    reasons.push('Professional presentation and communication skills');
  }

  return {
    finalScore: score,
    topReasons: reasons.slice(0, 3)
  };
}
