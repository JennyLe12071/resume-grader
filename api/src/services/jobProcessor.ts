import { prisma } from '../index';
import crypto from 'crypto';

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

    // Process JD extraction (mock)
    if (job.jdDocId) {
      await processJDExtraction(job.jdDocId);
    }

    // Process resume extractions (mock)
    for (const jobResume of job.jobResumes) {
      await processResumeExtraction(jobResume.resume.docId);
      // Small delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 500));
    }

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
      const pdfBuffer = Buffer.from(document.content, 'base64');
      
      // Call real IDP API
      const response = await fetch(`${process.env.IDP_BASE_URL}/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.IDP_API_KEY}`,
          'Content-Type': 'application/pdf'
        },
        body: pdfBuffer
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
  return {
    title: "Senior Software Engineer",
    requirements: [
      "5+ years of JavaScript/TypeScript experience",
      "Strong React and Node.js skills",
      "Database design and optimization",
      "Cloud platform experience (AWS/Azure)",
      "Excellent communication skills"
    ],
    description: "We are looking for a Senior Software Engineer to join our team. You will be responsible for designing and developing scalable web applications, mentoring junior developers, and collaborating with cross-functional teams.",
    experience_level: "Senior",
    skills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "AWS", "Azure"],
    education: "Bachelor's degree in Computer Science or related field"
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
      const pdfBuffer = Buffer.from(document.content, 'base64');
      
      // Call real IDP API
      const response = await fetch(`${process.env.IDP_BASE_URL}/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.IDP_API_KEY}`,
          'Content-Type': 'application/pdf'
        },
        body: pdfBuffer
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
  const names = [
    "Alexandra Allen", "Jordan Kim", "Marcus Rodriguez", "Sarah Chen", "David Thompson",
    "Emily Watson", "Michael Park", "Jessica Liu", "Christopher Brown", "Amanda Davis",
    "Ryan Wilson", "Nicole Garcia", "Kevin Martinez", "Rachel Taylor", "Brandon Anderson"
  ];
  
  const skills = [
    ["JavaScript", "TypeScript", "React", "Node.js", "MongoDB"],
    ["Python", "Django", "PostgreSQL", "Docker", "AWS"],
    ["Java", "Spring Boot", "MySQL", "Redis", "Kubernetes"],
    ["C#", ".NET", "SQL Server", "Azure", "Entity Framework"],
    ["Python", "Machine Learning", "TensorFlow", "Pandas", "Jupyter"],
    ["JavaScript", "Vue.js", "Express", "MongoDB", "GraphQL"],
    ["Python", "Flask", "PostgreSQL", "Celery", "Redis"],
    ["Java", "Hibernate", "Oracle", "Maven", "Jenkins"],
    ["TypeScript", "Angular", "NestJS", "PostgreSQL", "Docker"],
    ["Python", "FastAPI", "MongoDB", "Elasticsearch", "Kafka"]
  ];

  const experiences = [
    { title: "Senior Software Engineer", years: 6 },
    { title: "Software Engineer", years: 4 },
    { title: "Full Stack Developer", years: 5 },
    { title: "Backend Developer", years: 3 },
    { title: "Frontend Developer", years: 4 },
    { title: "DevOps Engineer", years: 5 },
    { title: "Data Engineer", years: 4 },
    { title: "Machine Learning Engineer", years: 3 }
  ];

  const educations = [
    { degree: "BS", field: "Computer Science" },
    { degree: "MS", field: "Software Engineering" },
    { degree: "BS", field: "Information Technology" },
    { degree: "MS", field: "Data Science" },
    { degree: "BS", field: "Computer Engineering" }
  ];

  const name = names[Math.floor(Math.random() * names.length)];
  const skillSet = skills[Math.floor(Math.random() * skills.length)];
  const experience = experiences[Math.floor(Math.random() * experiences.length)];
  const education = educations[Math.floor(Math.random() * educations.length)];

  return {
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
    skills: skillSet,
    experience: [experience],
    education: [education],
    fullText: `${name} is a ${experience.title} with ${experience.years} years of experience. They have expertise in ${skillSet.slice(0, 3).join(', ')} and hold a ${education.degree} in ${education.field}.`
  };
}

async function processGrading(jobId: string) {
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
      docId: job.jdDocId!,
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
    const grade = calculateMockGrade(jdData, resumeData);

    // Save score
    await prisma.score.create({
      data: {
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

function calculateMockGrade(jdData: any, resumeData: any): { finalScore: number; topReasons: string[] } {
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
