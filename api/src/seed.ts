import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generate fake PDF content (small buffer)
function generateFakePDF(): string {
  const fakePDFContent = Buffer.from('fake pdf content for testing');
  return fakePDFContent.toString('base64');
}

// Generate content hash
function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create documents for job "12345" (Business Analyst)
  const jobNumber1 = '12345';
  
  // Create JD document
  const jdContent = generateFakePDF();
  const jdDoc = await prisma.document.create({
    data: {
      type: 'JD',
      jobNumber: jobNumber1,
      content: jdContent,
      contentHash: generateContentHash(jdContent),
      mimeType: 'application/pdf'
    }
  });

  console.log(`✅ Created JD document: ${jdDoc.docId}`);

  // Create resume documents
  const resumeCount = 12;
  const resumeDocs = [];

  for (let i = 1; i <= resumeCount; i++) {
    const resumeContent = generateFakePDF();
    const resumeDoc = await prisma.document.create({
      data: {
        type: 'RESUME',
        jobNumber: jobNumber1,
        content: resumeContent,
        contentHash: generateContentHash(resumeContent),
        mimeType: 'application/pdf'
      }
    });
    resumeDocs.push(resumeDoc);
  }

  console.log(`✅ Created ${resumeDocs.length} resume documents`);

  // Create documents for job "67890" (Data Scientist)
  const jobNumber2 = '67890';
  
  // Create JD document
  const jdContent2 = generateFakePDF();
  const jdDoc2 = await prisma.document.create({
    data: {
      type: 'JD',
      jobNumber: jobNumber2,
      content: jdContent2,
      contentHash: generateContentHash(jdContent2),
      mimeType: 'application/pdf'
    }
  });

  console.log(`✅ Created JD document: ${jdDoc2.docId}`);

  // Create resume documents for second job
  const resumeCount2 = 8;
  const resumeDocs2 = [];

  for (let i = 1; i <= resumeCount2; i++) {
    const resumeContent = generateFakePDF();
    const resumeDoc = await prisma.document.create({
      data: {
        type: 'RESUME',
        jobNumber: jobNumber2,
        content: resumeContent,
        contentHash: generateContentHash(resumeContent),
        mimeType: 'application/pdf'
      }
    });
    resumeDocs2.push(resumeDoc);
  }

  console.log(`✅ Created ${resumeDocs2.length} resume documents for second job`);

  console.log('🎉 Seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Job ${jobNumber1}: 1 JD + ${resumeCount} resumes`);
  console.log(`   - Job ${jobNumber2}: 1 JD + ${resumeCount2} resumes`);
  console.log(`   - Total documents: ${1 + resumeCount + 1 + resumeCount2}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



