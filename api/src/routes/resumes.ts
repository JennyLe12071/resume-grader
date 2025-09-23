import express from 'express';
import { prisma } from '../index';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// GET /api/resumes/:resumeId - Get resume details
router.get('/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;

    const resume = await prisma.resume.findUnique({
      where: { resumeId },
      include: {
        Job: true
      }
    });

    if (!resume) {
      return res.status(404).json({ 
        error: 'Resume not found',
        message: `Resume with ID ${resumeId} does not exist` 
      });
    }

    // Format response
    const response = {
      resume: {
        resumeId: resume.resumeId,
        jobId: resume.jobId,
        filename: resume.filename,
        status: resume.status,
        errorText: resume.errorText,
        createdAt: resume.createdAt
      },
      job: {
        jobId: resume.Job.jobId,
        title: resume.Job.title,
        jobDescription: resume.Job.jobDescription
      },
      idpJson: resume.idpJson,
      grade: resume.gradeJson
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting resume:', error);
    res.status(500).json({ 
      error: 'Failed to get resume',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/resumes/:resumeId/pdf - Download PDF file
router.get('/:resumeId/pdf', async (req, res) => {
  try {
    const { resumeId } = req.params;

    const resume = await prisma.resume.findUnique({
      where: { resumeId }
    });

    if (!resume) {
      return res.status(404).json({ 
        error: 'Resume not found',
        message: `Resume with ID ${resumeId} does not exist` 
      });
    }

    const filePath = path.join(
      process.env.STORAGE_DIR || './storage',
      'resumes',
      resume.jobId,
      `${resumeId}.pdf`
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'PDF file not found',
        message: 'The PDF file for this resume is missing' 
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.filename}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ 
      error: 'Failed to download PDF',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;



