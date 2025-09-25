import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

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

// IDP webhook endpoint (stubbed for MVP)
app.post('/api/idp/callback', async (req, res) => {
  try {
    console.log('IDP webhook received:', req.body);
    // In MVP, this is just stubbed - real implementation would process the webhook
    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Error in IDP webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
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



