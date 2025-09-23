import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a sample job
  const job = await prisma.job.create({
    data: {
      title: 'Senior Software Engineer',
      jobDescription: `We are looking for a Senior Software Engineer to join our team.

Requirements:
- 5+ years of experience with JavaScript/TypeScript
- Experience with React and Node.js
- Strong understanding of databases (SQL/NoSQL)
- Experience with cloud platforms (AWS/Azure)
- Excellent communication skills
- Bachelor's degree in Computer Science or related field

Responsibilities:
- Design and develop scalable web applications
- Collaborate with cross-functional teams
- Mentor junior developers
- Participate in code reviews and technical discussions`
    }
  });

  console.log(`✅ Created job: ${job.title} (${job.jobId})`);

  // Create some sample resumes with different statuses
  const resumes = [
    {
      resumeId: 'R-sample-001',
      filename: 'john_doe_resume.pdf',
      status: 'DONE',
      idpJson: {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '555-0123',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        education: [{ degree: 'BS', field: 'Computer Science' }],
        experience: [{ title: 'Senior Software Engineer', years: 6 }],
        fullText: 'John Doe is a Senior Software Engineer with 6 years of experience building scalable web applications using JavaScript, TypeScript, React, and Node.js. He has a Bachelor\'s degree in Computer Science and extensive experience with PostgreSQL databases and AWS cloud services.'
      },
      gradeJson: {
        finalScore: 85,
        topReasons: [
          'Strong technical skills match (JavaScript, TypeScript, React)',
          '6 years of relevant experience exceeds requirements',
          'Excellent educational background in Computer Science'
        ]
      }
    },
    {
      resumeId: 'R-sample-002',
      filename: 'jane_smith_resume.pdf',
      status: 'DONE',
      idpJson: {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '555-0456',
        skills: ['Python', 'Django', 'MySQL', 'Docker', 'AWS'],
        education: [{ degree: 'MS', field: 'Software Engineering' }],
        experience: [{ title: 'Software Developer', years: 4 }],
        fullText: 'Jane Smith is a Software Developer with 4 years of experience primarily in Python and Django. She has a Master\'s degree in Software Engineering and experience with MySQL, Docker, and AWS. She is looking to transition to full-stack JavaScript development.'
      },
      gradeJson: {
        finalScore: 65,
        topReasons: [
          'Strong educational background with MS in Software Engineering',
          '4 years of development experience',
          'Shows willingness to learn new technologies'
        ]
      }
    },
    {
      resumeId: 'R-sample-003',
      filename: 'mike_wilson_resume.pdf',
      status: 'FAILED_IDP',
      errorText: 'IDP Error: 400 - Unable to parse PDF content. File may be corrupted or password protected.'
    },
    {
      resumeId: 'R-sample-004',
      filename: 'sarah_jones_resume.pdf',
      status: 'PENDING',
      idpJson: null,
      gradeJson: null
    }
  ];

  for (const resume of resumes) {
    await prisma.resume.create({
      data: {
        resumeId: resume.resumeId,
        jobId: job.jobId,
        filename: resume.filename,
        status: resume.status,
        errorText: resume.errorText || null,
        idpJson: resume.idpJson || null,
        gradeJson: resume.gradeJson || null
      }
    });
  }

  console.log(`✅ Created ${resumes.length} sample resumes`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



