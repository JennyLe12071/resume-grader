import express from 'express';
import { prisma } from '../index';
import { processJob } from '../services/jobProcessor';

const router = express.Router();

function getJobDescription(jobNumber: string): string {
  switch (jobNumber) {
    case '12345':
      return 'Lead business development initiatives, identify new market opportunities, and build strategic partnerships to drive revenue growth and market expansion.';
    case '67890':
      return 'Drive strategic initiatives and cross-functional projects, ensuring alignment with organizational goals and delivering measurable business impact.';
    case '78901':
      return 'Oversee daily operations at Winchester location, manage team performance, and ensure efficient delivery of services while maintaining quality standards.';
    case '89012':
      return 'Lead product development and management for NHA portfolio, from concept to launch, ensuring products meet market needs and business objectives.';
    case '90123':
      return 'Manage donor center operations, coordinate blood collection activities, and ensure compliance with health and safety regulations while optimizing donor experience.';
    case '01234':
      return 'Drive technical sales for DS State territory, provide technical expertise to clients, and develop solutions that address customer needs and business requirements.';
    default:
      return 'Lead strategic initiatives and drive business growth through innovative solutions and collaborative partnerships.';
  }
}

// GET /api/jobs - Get all jobs (for frontend compatibility)
router.get('/', async (req, res) => {
  try {
    // Get all jobs from database
    const jobs = await prisma.job.findMany({
      include: {
        jobResumes: {
          include: {
            resume: true
          }
        },
        scores: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to frontend format
    const transformedJobs = await Promise.all(jobs.map(async (job) => {
      // Get job description from JD document if available
      let title = `Job ${job.externalJobRef}`;
      let jobDescription = 'No job description available';

      if (job.jdDocId) {
        // Extract title from JD document extraction data
        const jdDoc = await prisma.document.findUnique({
          where: { docId: job.jdDocId },
          include: {
            extractions: {
              where: { status: 'PARSED' }
            }
          }
        });
        
        if (jdDoc?.extractions[0]?.extractionJson) {
          try {
            const jdData = JSON.parse(jdDoc.extractions[0].extractionJson);
            title = jdData.Job_Title || `Job ${job.externalJobRef}`;
            jobDescription = jdData.Summary || getJobDescription(job.externalJobRef);
          } catch (e) {
            // Fallback to hardcoded values
            const jobTitles: { [key: string]: string } = {
              '12345': 'Business Development Manager',
              '67890': 'Director Strategic Initiatives', 
              '78901': 'Operations Manager Winchester',
              '89012': 'Product Manager NHA',
              '90123': 'Site Manager, Donor Center',
              '01234': 'Technical Sales Specialist, DS State'
            };
            title = jobTitles[job.externalJobRef] || `Job ${job.externalJobRef}`;
            jobDescription = getJobDescription(job.externalJobRef);
          }
        } else {
          // Fallback to hardcoded values
          const jobTitles: { [key: string]: string } = {
            '12345': 'Business Development Manager',
            '67890': 'Director Strategic Initiatives', 
            '78901': 'Operations Manager Winchester',
            '89012': 'Product Manager NHA',
            '90123': 'Site Manager, Donor Center',
            '01234': 'Technical Sales Specialist, DS State'
          };
          title = jobTitles[job.externalJobRef] || `Job ${job.externalJobRef}`;
          jobDescription = getJobDescription(job.externalJobRef);
        }
      } else {
        title = `Job ${job.externalJobRef}`;
        jobDescription = 'No job description available';
      }

      return {
        jobId: job.jobId,
        title,
        jobDescription,
        createdAt: job.createdAt.toISOString(),
        status: job.status,
        resumeCount: job.jobResumes.length,
        completedCount: job.scores.length
      };
    }));

    res.json(transformedJobs);
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({ 
      error: 'Failed to get jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/roles - Get available roles with completion status
router.get('/roles', async (req, res) => {
  try {
    // Get all active roles from the Role table
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            jobResumes: {
              include: {
                resume: {
                  include: {
                    extractions: true
                  }
                }
              }
            },
            scores: true
          }
        }
      }
    });

    const rolesWithStatus = await Promise.all(
      roles.map(async (role) => {
        // Count documents for this role
        const [jdCount, resumeCount] = await Promise.all([
          prisma.document.count({ where: { type: 'JD', jobNumber: role.externalJobRef } }),
          prisma.document.count({ where: { type: 'RESUME', jobNumber: role.externalJobRef } })
        ]);

        // Get latest job run for this role
        const latestJob = role.jobs[0] || null;

        let completionPercentage = 0;
        let lastRun = null;
        let status = 'NOT_STARTED';

        if (latestJob) {
          const totalResumes = latestJob.jobResumes.length;
          const completedResumes = latestJob.scores.length;
          
          if (totalResumes > 0) {
            completionPercentage = Math.round((completedResumes / totalResumes) * 100);
          }
          
          lastRun = latestJob.createdAt.toISOString();
          status = latestJob.status;
        }

        return {
          id: latestJob ? latestJob.jobId : role.externalJobRef,
          title: role.title,
          jobNumber: role.externalJobRef,
          description: role.description || getJobDescription(role.externalJobRef),
          completionPercentage,
          status,
          lastRun,
          resumeCount,
          jdCount,
          hasDocuments: jdCount > 0 && resumeCount > 0,
          hasResumes: resumeCount > 0
        };
      })
    );

    res.json({ roles: rolesWithStatus });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({ 
      error: 'Failed to get roles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/jobs - Create a new job run
router.post('/', async (req, res) => {
  try {
    const { external_job_ref } = req.body;

    if (!external_job_ref) {
      return res.status(400).json({ 
        error: 'Missing required field',
        message: 'external_job_ref is required' 
      });
    }

    // Check if job already exists
    const existingJob = await prisma.job.findUnique({
      where: { externalJobRef: external_job_ref }
    });

    if (existingJob) {
      return res.json({ job_id: existingJob.jobId });
    }

    // Find JD and resumes for this job number
    const jdDoc = await prisma.document.findFirst({
      where: { 
        type: 'JD',
        jobNumber: external_job_ref 
      },
      orderBy: { uploadedAt: 'desc' }
    });

    const resumeDocs = await prisma.document.findMany({
      where: { 
        type: 'RESUME',
        jobNumber: external_job_ref 
      },
      orderBy: { uploadedAt: 'desc' },
      take: 20 // Limit to 20 most recent resumes
    });

    if (!jdDoc) {
      return res.status(400).json({
        error: 'No job description found',
        message: `No JD found for job number ${external_job_ref}`
      });
    }

    if (resumeDocs.length === 0) {
      return res.status(400).json({
        error: 'No resumes found',
        message: `No resumes found for job number ${external_job_ref}`
      });
    }

    // Find or create role for this job
    let role = await prisma.role.findUnique({
      where: { externalJobRef: external_job_ref }
    });

    if (!role) {
      // Create role from JD document if available
      let roleTitle = `Job ${external_job_ref}`;
      let roleDescription = 'No job description available';

      if (jdDoc) {
        const jdExtraction = await prisma.extraction.findFirst({
          where: { 
            docId: jdDoc.docId,
            status: 'PARSED'
          }
        });

        if (jdExtraction?.extractionJson) {
          try {
            const jdData = JSON.parse(jdExtraction.extractionJson);
            roleTitle = jdData.Job_Title || `Job ${external_job_ref}`;
            roleDescription = jdData.Summary || getJobDescription(external_job_ref);
          } catch (e) {
            // Use fallback values
            roleTitle = `Job ${external_job_ref}`;
            roleDescription = getJobDescription(external_job_ref);
          }
        }
      }

      role = await prisma.role.create({
        data: {
          externalJobRef: external_job_ref,
          title: roleTitle,
          description: roleDescription,
          isActive: true
        }
      });
    }

    // Create job linked to role
    const job = await prisma.job.create({
      data: {
        externalJobRef: external_job_ref,
        roleId: role.roleId,
        jdDocId: jdDoc.docId,
        status: 'PENDING'
      }
    });

    // Create job-resume relationships
    await prisma.jobResume.createMany({
      data: resumeDocs.map(doc => ({
        jobId: job.jobId,
        resumeDocId: doc.docId
      }))
    });

    // Start processing (async)
    processJob(job.jobId).catch(console.error);

    res.json({ job_id: job.jobId });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ 
      error: 'Failed to create job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/jobs/:jobId/status - Get job status
router.get('/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;

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
        },
        scores: true
      }
    });

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found',
        message: `Job with ID ${jobId} does not exist` 
      });
    }

    // Calculate phases
    const totalResumes = job.jobResumes.length;
    const extractedResumes = job.jobResumes.filter(jr => 
      jr.resume.extractions.some(ext => ext.status === 'PARSED')
    ).length;
    const gradedResumes = job.scores.length;

    const phases = {
      extract_jd: job.jdDocId ? 'DONE' : 'PENDING',
      extract_resumes: {
        done: extractedResumes,
        total: totalResumes
      },
      grade: {
        done: gradedResumes,
        total: totalResumes
      }
    };

    res.json({
      job_id: job.jobId,
      external_job_ref: job.externalJobRef,
      status: job.status,
      phases
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ 
      error: 'Failed to get job status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/jobs/:jobId - Get job by ID
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { jobId },
      include: {
        jobResumes: {
          include: {
            resume: true
          }
        },
        scores: true
      }
    });

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found',
        message: `Job with ID ${jobId} does not exist` 
      });
    }

    // Extract title from JD document extraction data
    let title = `Job ${job.externalJobRef}`;
    let jobDescription = 'No job description available';
    
    if (job.jdDocId) {
      const jdDoc = await prisma.document.findUnique({
        where: { docId: job.jdDocId },
        include: {
          extractions: {
            where: { status: 'PARSED' }
          }
        }
      });
      
      if (jdDoc?.extractions[0]?.extractionJson) {
        try {
          const jdData = JSON.parse(jdDoc.extractions[0].extractionJson);
          title = jdData.Job_Title || `Job ${job.externalJobRef}`;
          jobDescription = jdData.Summary || getJobDescription(job.externalJobRef);
        } catch (e) {
          // Fallback to hardcoded values
          const jobTitles: { [key: string]: string } = {
            '12345': 'Business Development Manager',
            '67890': 'Director Strategic Initiatives', 
            '78901': 'Operations Manager Winchester',
            '89012': 'Product Manager NHA',
            '90123': 'Site Manager, Donor Center',
            '01234': 'Technical Sales Specialist, DS State'
          };
          title = jobTitles[job.externalJobRef] || `Job ${job.externalJobRef}`;
          jobDescription = getJobDescription(job.externalJobRef);
        }
      } else {
        // Fallback to hardcoded values
        const jobTitles: { [key: string]: string } = {
          '12345': 'Business Development Manager',
          '67890': 'Director Strategic Initiatives', 
          '78901': 'Operations Manager Winchester',
          '89012': 'Product Manager NHA',
          '90123': 'Site Manager, Donor Center',
          '01234': 'Technical Sales Specialist, DS State'
        };
        title = jobTitles[job.externalJobRef] || `Job ${job.externalJobRef}`;
        jobDescription = getJobDescription(job.externalJobRef);
      }
    }

    res.json({
      jobId: job.jobId,
      title,
      jobDescription,
      createdAt: job.createdAt.toISOString(),
      status: job.status,
      resumeCount: job.jobResumes.length,
      completedCount: job.scores.length
    });
  } catch (error) {
    console.error('Error getting job:', error);
    res.status(500).json({ 
      error: 'Failed to get job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/jobs/:jobId/resumes - Upload resumes to a job
router.post('/:jobId/resumes', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { jobId }
    });

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found',
        message: `Job with ID ${jobId} does not exist` 
      });
    }

    // For now, return mock response since file upload is not implemented in this API
    // In a real implementation, you would handle multipart form data here
    res.json({
      accepted: [],
      rejected: [],
      resumeIds: []
    });
  } catch (error) {
    console.error('Error uploading resumes:', error);
    res.status(500).json({ 
      error: 'Failed to upload resumes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/jobs/:jobId/rankings - Get job rankings
router.get('/:jobId/rankings', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { failed } = req.query;

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
        },
        scores: {
          orderBy: { finalScore: 'desc' }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found',
        message: `Job with ID ${jobId} does not exist` 
      });
    }

    if (job.status !== 'READY') {
      return res.status(400).json({
        error: 'Job not ready',
        message: `Job status is ${job.status}, not READY`
      });
    }

    // Build rankings
    const rankings = job.scores.map((score: any) => {
      const jobResume = job.jobResumes.find((jr: any) => jr.resumeDocId === score.resumeDocId);
      const resume = jobResume?.resume;
      
      // Get extraction data for candidate name
      const extraction = resume?.extractions.find((ext: any) => ext.status === 'PARSED');
      let candidate = `Resume ${score.resumeDocId.slice(-4)}`;
      
      if (extraction?.extractionJson) {
        try {
          const data = JSON.parse(extraction.extractionJson);
          candidate = data.Full_Name || data.name || candidate;
        } catch (e) {
          // Use default candidate name
        }
      }

      // Parse reasons
      let reasons: string[] = [];
      try {
        reasons = JSON.parse(score.reasonsJson);
      } catch (e) {
        reasons = ['No reasons provided'];
      }

      return {
        resumeId: score.resumeDocId,
        filename: candidate,
        status: 'DONE',
        finalScore: Math.round(score.finalScore),
        topReasons: reasons
      };
    });

    res.json(rankings);
  } catch (error) {
    console.error('Error getting job rankings:', error);
    res.status(500).json({ 
      error: 'Failed to get job rankings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/jobs/:jobId/rerun - Re-run a job
router.post('/:jobId/rerun', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { jobId },
      include: {
        jobResumes: true,
        scores: true
      }
    });

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found',
        message: `Job with ID ${jobId} does not exist` 
      });
    }

    // Reset job status to PENDING
    await prisma.job.update({
      where: { jobId },
      data: {
        status: 'PENDING'
      }
    });

    // Clear existing scores
    await prisma.score.deleteMany({
      where: { jobId }
    });

    // Start processing (async)
    processJob(jobId).catch(console.error);

    res.json({ 
      message: 'Job re-run started',
      job_id: jobId,
      status: 'PENDING'
    });
  } catch (error) {
    console.error('Error re-running job:', error);
    res.status(500).json({ 
      error: 'Failed to re-run job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/jobs/:jobId/results - Get job results
router.get('/:jobId/results', async (req, res) => {
  try {
    const { jobId } = req.params;

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
        },
        scores: {
          orderBy: { finalScore: 'desc' }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found',
        message: `Job with ID ${jobId} does not exist` 
      });
    }

    if (job.status !== 'READY') {
      return res.status(400).json({
        error: 'Job not ready',
        message: `Job status is ${job.status}, not READY`
      });
    }

    // Build ranked results
    const ranked = job.scores.map((score: any) => {
      // Find the resume document for this score
      const jobResume = job.jobResumes.find((jr: any) => jr.resumeDocId === score.resumeDocId);
      const resume = jobResume?.resume;
      
      // Get extraction data for candidate name
      const extraction = resume?.extractions.find((ext: any) => ext.status === 'PARSED');
      let candidate = `Resume ${score.resumeDocId.slice(-4)}`;
      
      if (extraction?.extractionJson) {
        try {
          const data = JSON.parse(extraction.extractionJson);
          candidate = data.Full_Name || data.name || candidate;
        } catch (e) {
          // Use default candidate name
        }
      }

      // Parse reasons
      let reasons: string[] = [];
      try {
        reasons = JSON.parse(score.reasonsJson);
      } catch (e) {
        reasons = ['No reasons provided'];
      }

      return {
        resume_doc_id: score.resumeDocId,
        candidate,
        score: Math.round(score.finalScore),
        reasons
      };
    });

    res.json({
      job_id: job.jobId,
      ranked
    });
  } catch (error) {
    console.error('Error getting job results:', error);
    res.status(500).json({ 
      error: 'Failed to get job results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;