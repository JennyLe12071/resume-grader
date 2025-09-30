// Simple test to check if OpenAI is working with our mock data
const { gradeResumeWithOpenAI } = require('./dist/services/llmService');

async function testOpenAI() {
  try {
    console.log('Testing OpenAI with mock data...');
    
    // Test data matching our MuleSoft IDP format
    const jobDescription = {
      title: "Business Development Manager",
      description: "This position will ensure compliance with Environmental Health and Safety (EHS) policies, State Departments of Health, Good Documentation Practices (GDP), Good Laboratory Practice (GLP), Good Manufacturing Practices (GMP), Good Clinical Practices (GCP), Good Laboratory Practice (GLP), Standard Operating Procedures (SOPs), EMEA and FDA Guidelines, general State and Country Regulations such as but not limited to (CLIA, CAP, USP, ISO 9001, USDA regulations, HTA license, DEA and State Controlled Substance programs) where site appropriate.\n\nEmployment Type: Full-time\n\nKey Responsibilities:\n• Responsible for achieving regional sales targets on a quarterly basis in accordance with the annual corporate sales plan\n• Help with the preparation of proposals in collaboration with your colleagues in operations\n• Negotiate complex business arrangements\n• Maintain and enhance the Company's value proposition and professional reputation by displaying the highest levels, of professionalism, competence, and personal integrity\n\nCompliance Requirements:\n• CLIA\n• CAP\n• USP\n• ISO 9001\n• USDA regulations\n• HTA license\n• DEA and State Controlled Substance programs",
      skills: ["Microsoft Excel", "Word", "Outlook"],
      experience_level: "3",
      education: "BA/BS in science or business related field, plus 4 years commercial life science experience (microbiology, biology, chemistry or biochemistry preferred)",
      requirements: [
        "sales or business development experience representing complex life science products and/or services to pharmaceutical, biotech and diagnostics companies",
        "At least 3 years sales or business development experience representing complex life science products and/or services to pharmaceutical, biotech and diagnostics companies"
      ]
    };

    const resume = {
      name: "Paul Sung",
      email: "pauldohyunsung@gmail.com",
      phone: "213-804-3732",
      skills: [
        "Drug Discovery",
        "Process Development", 
        "Organic/Peptide Synthesis",
        "NMR",
        "Mass Spec.",
        "HPLC",
        "X-ray Crystallography",
        "Flash Chromatography",
        "High Throughput Screening",
        "Technical Writing",
        "Excel",
        "PowerPoint"
      ],
      experience: [
        {
          company: "Polypeptide Laboratories",
          position: "Process Development Scientist",
          years: 2,
          description: "Exceeded benchmarks on purity and yield for all clients, leading to multiple client retentions as well as new clients added • Wrote proposals and lead projects on synthesis of large-scale polypeptides"
        }
      ],
      education: [
        {
          degree: "Ph.D. Organic Chemistry",
          field: "Organic Chemistry",
          institution: "University of Pennsylvania"
        }
      ],
      summary: "Paul Sung is a professional with 5+ years of experience in Drug Discovery, Process Development, Organic/Peptide Synthesis."
    };

    console.log('Calling OpenAI...');
    const result = await gradeResumeWithOpenAI(jobDescription, resume);
    
    console.log('OpenAI Response:');
    console.log('Score:', result.finalScore);
    console.log('Reasons:', result.topReasons);
    
  } catch (error) {
    console.error('Error testing OpenAI:', error);
  }
}

testOpenAI();
