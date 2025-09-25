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

// GET /api/roles - Get available roles with completion status
router.get('/roles', async (req, res) => {
  try {
    // Get all unique job numbers
    const jobNumbers = await prisma.document.findMany({
      where: { type: 'JD' },
      select: { jobNumber: true },
      distinct: ['jobNumber']
    });

    const roles = await Promise.all(
      jobNumbers.map(async ({ jobNumber }) => {
        // Count documents
        const [jdCount, resumeCount] = await Promise.all([
          prisma.document.count({ where: { type: 'JD', jobNumber } }),
          prisma.document.count({ where: { type: 'RESUME', jobNumber } })
        ]);

        // Get latest job run for this role
        const latestJob = await prisma.job.findFirst({
          where: { externalJobRef: jobNumber },
          orderBy: { createdAt: 'desc' },
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

        // Determine role title based on job number
        let title = 'Unknown Role';
        if (jobNumber === '12345') {
          title = 'Business Development Manager';
        } else if (jobNumber === '67890') {
          title = 'Director Strategic Initiatives';
        } else if (jobNumber === '78901') {
          title = 'Operations Manager Winchester';
        } else if (jobNumber === '89012') {
          title = 'Product Manager NHA';
        } else if (jobNumber === '90123') {
          title = 'Site Manager, Donor Center';
        } else if (jobNumber === '01234') {
          title = 'Technical Sales Specialist, DS State';
        }

        return {
          id: jobNumber,
          title,
          jobNumber,
          description: getJobDescription(jobNumber),
          completionPercentage,
          status,
          lastRun,
          resumeCount,
          jdCount,
          hasDocuments: jdCount > 0 && resumeCount > 0
        };
      })
    );

    // Show all roles, but mark which ones have resumes available
    const allRoles = roles.map(role => ({
      ...role,
      hasResumes: role.resumeCount > 0
    }));

    res.json({ roles: allRoles });
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

    // Create job
    const job = await prisma.job.create({
      data: {
        externalJobRef: external_job_ref,
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
          candidate = data.name || candidate;
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