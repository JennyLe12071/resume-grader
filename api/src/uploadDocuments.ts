import { PrismaClient } from '@prisma/client';
import { uploadDocumentsFromDirectory, uploadDocument } from './services/documentUploader';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function uploadUserDocuments() {
  console.log('🌱 Uploading documents from Downloads folder...');
  
  const downloadsPath = '/Users/jennyle/Downloads';
  const jdPath = path.join(downloadsPath, 'JD');
  const cvPath = path.join(downloadsPath, 'CV');
  
  try {
    // Upload JD documents with unique job numbers
    console.log('\n📄 Uploading Job Description documents...');
    const jdFiles = [
      { filename: 'Business Development Manager.pdf', jobNumber: '12345' },
      { filename: 'Director Strategic Initiatives.pdf', jobNumber: '67890' },
      { filename: 'Operations Manager Winchester- JD.pdf', jobNumber: '78901' },
      { filename: 'Product Manager NHA.pdf', jobNumber: '89012' },
      { filename: 'Site Manager, Donor Center.pdf', jobNumber: '90123' },
      { filename: 'Technical Sales Specialist, DS State.docx.pdf', jobNumber: '01234' }
    ];
    
    const jdResults = [];
    for (const jd of jdFiles) {
      const filePath = path.join(jdPath, jd.filename);
      if (fs.existsSync(filePath)) {
        const result = await uploadDocument(filePath, 'JD', jd.jobNumber);
        jdResults.push(result);
        console.log(`✅ Uploaded JD: ${jd.filename} as job ${jd.jobNumber}`);
      } else {
        console.log(`⚠️  JD file not found: ${jd.filename}`);
      }
    }
    
    // Upload CV documents only for Business Development Manager (12345)
    console.log(`\n📄 Uploading Resume documents for Business Development Manager (12345)...`);
    const cvResults = await uploadDocumentsFromDirectory(cvPath, 'RESUME', '12345');
    console.log(`✅ Uploaded ${cvResults.length} resume documents for Business Development Manager`);
    
    console.log('\n🎉 Document upload completed!');
    console.log(`📊 Summary:`);
    console.log(`   - JD documents: ${jdResults.length}`);
    console.log(`   - Resume documents: ${cvResults.length} (for Business Development Manager only)`);
    console.log(`   - Total documents: ${jdResults.length + cvResults.length}`);
    console.log(`   - Jobs created: 6 (12345, 67890, 78901, 89012, 90123, 01234)`);
    console.log(`   - Note: Resumes are only available for Business Development Manager (12345)`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  uploadUserDocuments()
    .catch((e) => {
      console.error('❌ Upload script failed:', e);
      process.exit(1);
    });
}

export { uploadUserDocuments };
