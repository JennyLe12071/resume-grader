import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { processIdpCallback } from './services/idpCallbackProcessor';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// No file uploads in new architecture - documents are stored in database

// Import route handlers
import jobRoutes from './routes/jobs';

// Routes
app.use('/api/jobs', jobRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SharePoint file upload notification endpoint - called when files are uploaded to SharePoint
app.post('/api/sharepoint/upload', async (req, res) => {
  try {
    const { externalJobRef, title, description, jdFolderPath, resumeFolderPath } = req.body;
    
    if (!externalJobRef) {
      return res.status(400).json({ 
        error: 'Missing externalJobRef',
        message: 'externalJobRef is required' 
      });
    }
    
    console.log(`📁 SharePoint upload detected for job ${externalJobRef}`);
    console.log(`  Title: ${title || 'Not provided'}`);
    console.log(`  JD Folder: ${jdFolderPath || 'Not provided'}`);
    console.log(`  Resume Folder: ${resumeFolderPath || 'Not provided'}`);
    
    // Dynamically scan SharePoint folders to get actual file counts
    const { fileSourceService } = await import('./services/fileSourceService');
    const folderInfo = await fileSourceService.getFolderFileCount(
      jdFolderPath || `/sites/HR-Recruiting/Shared Documents/Jobs/${externalJobRef}/JD`,
      resumeFolderPath || `/sites/HR-Recruiting/Shared Documents/Jobs/${externalJobRef}/resumes`
    );
    
    console.log(`📊 Dynamic file detection results:`);
    console.log(`  JD Files: ${folderInfo.jdFiles.length}`);
    console.log(`  Resume Files: ${folderInfo.resumeFiles.length}`);
    console.log(`  Total Files: ${folderInfo.totalFiles}`);
    
    // Create or update job record with PENDING status (not processed yet)
    const job = await prisma.job.upsert({
      where: { externalJobRef },
      update: {
        status: 'PENDING'
      },
      create: {
        externalJobRef,
        status: 'PENDING'
      }
    });
    
    // Create or update role record
    if (title) {
      await prisma.role.upsert({
        where: { externalJobRef },
        update: {
          title,
          description,
          updatedAt: new Date()
        },
        create: {
          roleId: `role_${externalJobRef}`,
          externalJobRef,
          title,
          description,
          updatedAt: new Date()
        }
      });
    }
    
            res.status(200).json({ 
              status: 'success',
              message: 'Job created from SharePoint upload with dynamic file detection',
              jobId: job.jobId,
              externalJobRef: job.externalJobRef,
              jobStatus: 'PENDING',
              fileCounts: {
                jdFiles: folderInfo.jdFiles.length,
                resumeFiles: folderInfo.resumeFiles.length,
                totalFiles: folderInfo.totalFiles
              }
            });
    
  } catch (error) {
    console.error('Error processing SharePoint upload:', error);
    res.status(500).json({ 
      error: 'SharePoint upload processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trigger IDP processing - called when user clicks "Start"
app.post('/api/idp/trigger', async (req, res) => {
  try {
    const { externalJobRef, jdFolderPath, resumeFolderPath } = req.body;
    
    if (!externalJobRef) {
      return res.status(400).json({ 
        error: 'Missing externalJobRef',
        message: 'externalJobRef is required' 
      });
    }
    
    // Use environment-driven IDP adapter
    const { createIdpAdapter } = await import('./adapters/idpAdapter');
    const idpAdapter = createIdpAdapter();
    
    // Process job through IDP
    const idpResult = await idpAdapter.processJob(
      externalJobRef,
      jdFolderPath || `/sites/HR-Recruiting/Shared Documents/Jobs/${externalJobRef}/JD`,
      resumeFolderPath || `/sites/HR-Recruiting/Shared Documents/Jobs/${externalJobRef}/resumes`
    );
    
    console.log(`IDP processing result:`, idpResult);
    
    // Get extractions from IDP
    const extractions = await idpAdapter.getExtractions(idpResult.requestId);
    
    if (extractions.length === 0) {
      throw new Error(`No extractions found for job ${externalJobRef}`);
    }
    
    // Normalize extractions
    const { ExtractionNormalizer } = await import('./services/normalizer');
    const normalizedExtractions = ExtractionNormalizer.normalizeExtractions(extractions);
    const jobData = ExtractionNormalizer.groupByJob(normalizedExtractions);
    
    if (!ExtractionNormalizer.validateJobData(jobData.get(externalJobRef)!)) {
      throw new Error(`Invalid job data for ${externalJobRef}`);
    }
    
    // Store extractions in database
    const { storeExtractions } = await import('./services/jobProcessor');
    const job = await prisma.job.findUnique({ where: { externalJobRef } });
    if (job) {
      await storeExtractions(job.jobId, externalJobRef, normalizedExtractions);
    }
    
    // Update job status to PROCESSING
    await prisma.job.update({
      where: { externalJobRef },
      data: { status: 'PROCESSING' }
    });
    
    // Trigger grading process
    const { processJob } = await import('./services/jobProcessor');
    if (job) {
      processJob(job.jobId);
    }
    
    res.status(200).json({ 
      status: 'success',
      message: 'IDP processing triggered successfully',
      idpRequestId: idpResult.requestId,
      externalJobRef
    });
    
  } catch (error) {
    console.error('Error triggering IDP processing:', error);
    res.status(500).json({ 
      error: 'IDP trigger failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// IDP webhook endpoint - receives batch extraction results from MuleSoft IDP
app.post('/api/idp/callback', async (req, res) => {
  try {
    console.log('IDP webhook received:', JSON.stringify(req.body, null, 2));
    
    const { externalJobRef, jd, resumes, idempotencyKey, hmac } = req.body;
    
    // TODO: Add HMAC verification for security
    // TODO: Add idempotency check using idempotencyKey
    
    if (!externalJobRef) {
      return res.status(400).json({ 
        error: 'Missing externalJobRef',
        message: 'externalJobRef is required' 
      });
    }
    
    if (!jd && (!resumes || resumes.length === 0)) {
      return res.status(400).json({ 
        error: 'No data provided',
        message: 'Either jd or resumes must be provided' 
      });
    }
    
    // Process the batch extraction results
    const result = await processIdpCallback(externalJobRef, jd, resumes);
    
    res.status(200).json({ 
      status: 'success',
      message: 'IDP callback processed successfully',
      result 
    });
    
  } catch (error) {
    console.error('Error in IDP webhook:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
  console.log(`📊 Database: ${process.env.DATABASE_URL || 'file:./dev.db'}`);
});

export { prisma };



