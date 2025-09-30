const { processJob } = require('./dist/services/jobProcessor');

async function testGrading() {
  try {
    console.log('Starting grading test...');
    const jobId = 'cmg5gwy0g00008xai73rd421k'; // Business Development Manager job
    await processJob(jobId);
    console.log('Grading completed successfully!');
  } catch (error) {
    console.error('Error during grading:', error);
  }
}

testGrading();
