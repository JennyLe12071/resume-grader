const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🌐 Testing API endpoint...');
    
    const response = await fetch('http://localhost:8080/api/jobs');
    const data = await response.json();
    
    console.log('📊 API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.length > 0) {
      const job = data[0];
      console.log('\n🎯 First Job Details:');
      console.log(`   Job ID: ${job.jobId}`);
      console.log(`   Title: ${job.title}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Resume Count: ${job.resumeCount}`);
      console.log(`   Completed Count: ${job.completedCount}`);
      console.log(`   Progress: ${Math.round((job.completedCount / job.resumeCount) * 100)}%`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
