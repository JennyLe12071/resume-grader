import { prisma } from '../index';
import { idpClient } from './idpClient';
import { graderClient } from './graderClient';
import fs from 'fs';

export async function processResume(resumeId: string, jobId: string, filePath: string, jobDescription: string) {
  try {
    console.log(`Processing resume ${resumeId} for job ${jobId}`);

    // Read PDF file
    const pdfBuffer = fs.readFileSync(filePath);

    // Step 1: Process with IDP
    console.log(`Calling IDP for resume ${resumeId}`);
    const idpResult = await idpClient.process(pdfBuffer);
    
    // Update resume with IDP result
    await prisma.resume.update({
      where: { resumeId },
      data: {
        idpJson: idpResult,
        status: 'PENDING' // Still processing, not done yet
      }
    });

    // Step 2: Grade with LLM
    console.log(`Calling LLM grader for resume ${resumeId}`);
    const gradeResult = await graderClient.grade(jobDescription, idpResult);

    // Update resume with grade result
    await prisma.resume.update({
      where: { resumeId },
      data: {
        gradeJson: gradeResult,
        status: 'DONE'
      }
    });

    console.log(`Successfully processed resume ${resumeId}`);
  } catch (error) {
    console.error(`Error processing resume ${resumeId}:`, error);
    
    // Determine error type and update status
    let status = 'FAILED_GRADER';
    let errorText = 'Unknown error occurred during processing';

    if (error instanceof Error) {
      if (error.message.includes('IDP') || error.message.includes('IDP')) {
        status = 'FAILED_IDP';
        errorText = `IDP Error: ${error.message}`;
      } else if (error.message.includes('LLM') || error.message.includes('grader')) {
        status = 'FAILED_GRADER';
        errorText = `Grader Error: ${error.message}`;
      } else {
        errorText = error.message;
      }
    }

    // Update resume with error
    await prisma.resume.update({
      where: { resumeId },
      data: {
        status,
        errorText
      }
    });
  }
}



