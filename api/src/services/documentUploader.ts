import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadResult {
  docId: string;
  filename: string;
  size: number;
  hash: string;
}

export async function uploadDocument(
  filePath: string,
  type: 'JD' | 'RESUME',
  jobNumber: string
): Promise<UploadResult> {
  try {
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    
    // Generate content hash
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // For JD documents, check if already exists (by hash)
    // For RESUME documents, always create new associations for each job
    if (type === 'JD') {
      const existingDoc = await prisma.document.findFirst({
        where: { contentHash: hash, type: 'JD' }
      });
      
      if (existingDoc) {
        console.log(`JD document ${filename} already exists with hash ${hash}`);
        return {
          docId: existingDoc.docId,
          filename,
          size: fileBuffer.length,
          hash
        };
      }
    }
    
    // Convert to base64 for storage
    const base64Content = fileBuffer.toString('base64');
    
    // Create document record
    const document = await prisma.document.create({
      data: {
        type,
        jobNumber,
        content: base64Content,
        contentHash: hash,
        mimeType: 'application/pdf'
      }
    });
    
    console.log(`✅ Uploaded ${type} document: ${filename} (${document.docId})`);
    
    return {
      docId: document.docId,
      filename,
      size: fileBuffer.length,
      hash
    };
    
  } catch (error) {
    console.error(`Error uploading document ${filePath}:`, error);
    throw error;
  }
}

export async function uploadDocumentsFromDirectory(
  directoryPath: string,
  type: 'JD' | 'RESUME',
  jobNumber: string
): Promise<UploadResult[]> {
  try {
    const files = fs.readdirSync(directoryPath);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    console.log(`Found ${pdfFiles.length} PDF files in ${directoryPath}`);
    
    const uploadResults: UploadResult[] = [];
    
    for (const filename of pdfFiles) {
      const filePath = path.join(directoryPath, filename);
      try {
        const result = await uploadDocument(filePath, type, jobNumber);
        uploadResults.push(result);
      } catch (error) {
        console.error(`Failed to upload ${filename}:`, error);
      }
    }
    
    return uploadResults;
  } catch (error) {
    console.error(`Error reading directory ${directoryPath}:`, error);
    throw error;
  }
}
