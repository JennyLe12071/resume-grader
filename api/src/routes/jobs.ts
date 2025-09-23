import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index';
import { processResume } from '../services/processingService';

const router = express.Router();

// Configure multer for job-specific uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const jobId = req.params.jobId;
    const resumesDir = path.join(process.env.STORAGE_DIR || './storage', 'resumes');
    const jobDir = path.join(resumesDir, jobId);
    if (!fs.existsSync(jobDir)) {
      fs.mkdirSync(jobDir, { recursive: true });
    }
    cb(null, jobDir);
  },
  filename: (req, file, cb) => {
    const resumeId = `R-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, `${resumeId}.pdf`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/jobs - Create a new job
router.post('/', async (req, res) => {
  try {
    const { title, jobDescription } = req.body;

    if (!title || !jobDescription) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Both title and jobDescription are required' 
      });
    }

    const job = await prisma.job.create({
      data: {
        title,
        jobDescription
      }
    });

    res.status(201).json({ jobId: job.jobId });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ 
      error: 'Failed to create job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/jobs/:jobId/resumes - Upload multiple PDFs
router.post('/:jobId/resumes', upload.array('files'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        message: 'Please upload at least one PDF file' 
      });
    }

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { jobId }
    });

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found',
        message: `Job with ID ${jobId} does not exist` 
      });
    }

    const resumeIds: string[] = [];
    const accepted: string[] = [];
    const rejected: string[] = [];

    // Process each uploaded file
    for (const file of files) {
      try {
        const resumeId = path.basename(file.filename, '.pdf');
        
        // Create resume record
        const resume = await prisma.resume.create({
          data: {
            resumeId,
            jobId,
            filename: file.originalname,
            status: 'PENDING'
          }
        });

        resumeIds.push(resumeId);
        accepted.push(file.originalname);

        // Start background processing
        processResume(resumeId, jobId, file.path, job.jobDescription);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        rejected.push(file.originalname);
      }
    }

    res.json({
      accepted,
      rejected,
      resumeIds
    });
  } catch (error) {
    console.error('Error uploading resumes:', error);
    res.status(500).json({ 
      error: 'Failed to upload resumes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/jobs/:jobId/rankings - Get ranked list of resumes
router.get('/:jobId/rankings', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { failed } = req.query;

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { jobId }
    });

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found',
        message: `Job with ID ${jobId} does not exist` 
      });
    }

    // Get resumes with filtering
    const whereClause: any = { jobId };
    if (failed === '1') {
      whereClause.status = { in: ['FAILED_IDP', 'FAILED_GRADER'] };
    } else {
      whereClause.status = 'DONE';
    }

    const resumes = await prisma.resume.findMany({
      where: whereClause,
      orderBy: [
        { status: 'asc' }, // Show DONE first, then FAILED
        { gradeJson: { finalScore: 'desc' } } // Sort by score descending
      ]
    });

    // Format response
    const rankings = resumes.map(resume => {
      const grade = resume.gradeJson as any;
      return {
        resumeId: resume.resumeId,
        filename: resume.filename,
        status: resume.status,
        finalScore: grade?.finalScore || null,
        topReasons: grade?.topReasons || [],
        errorText: resume.errorText
      };
    });

    res.json(rankings);
  } catch (error) {
    console.error('Error getting rankings:', error);
    res.status(500).json({ 
      error: 'Failed to get rankings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;



