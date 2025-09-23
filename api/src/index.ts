import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure storage directories exist
const storageDir = process.env.STORAGE_DIR || './storage';
const resumesDir = path.join(storageDir, 'resumes');

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const jobId = req.params.jobId;
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

// Import route handlers
import jobRoutes from './routes/jobs';
import resumeRoutes from './routes/resumes';

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Resume Grader API running on port ${PORT}`);
  console.log(`📁 Storage directory: ${storageDir}`);
});

export { prisma };



