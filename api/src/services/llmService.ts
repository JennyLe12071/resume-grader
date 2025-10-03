import OpenAI from 'openai';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Set Node.js environment variables to bypass SSL issues
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Create HTTPS agent with comprehensive SSL bypass
    const https = require('https');
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      requestCert: false,
      agent: false,
      secureProtocol: 'TLSv1_2_method'
    });
    
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      httpAgent: httpsAgent,
      timeout: 60000, // 60 second timeout
      maxRetries: 2
    });
    
    console.log('✅ OpenAI client initialized with comprehensive SSL bypass');
    console.log('🔑 API Key configured:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');
    console.log('🔒 SSL verification disabled globally');
  }
  return openai;
}

export interface GradingResult {
  finalScore: number;
  topReasons: string[];
}

export interface JobDescriptionData {
  title: string;
  description: string;
  skills?: string[];
  experience_level?: string;
  education?: string;
  requirements?: string[];
}

export interface ResumeData {
  name: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: Array<{
    company: string;
    position: string;
    years: number;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    field: string;
    institution?: string;
  }>;
  summary?: string;
}

/**
 * Grade a resume against a job description using OpenAI
 */
export async function gradeResumeWithOpenAI(
  jobDescription: JobDescriptionData,
  resume: ResumeData
): Promise<GradingResult> {
  try {
    const prompt = createGradingPrompt(jobDescription, resume);
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o-mini for cost efficiency
      messages: [
        {
          role: "system",
          content: "You are an expert resume reviewer and HR professional with 15+ years of experience in talent acquisition. You excel at matching candidates to job requirements and providing detailed, constructive feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0, // Lower temperature for more consistent scoring
      top_p: 0, // Most deterministic sampling
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return parseGradingResponse(content);
  } catch (error) {
    console.error('OpenAI grading error:', error);
    // Fallback to mock grading if OpenAI fails
    return generateFallbackGrade(jobDescription, resume);
  }
}

/**
 * Create a comprehensive prompt for resume grading
 */
function createGradingPrompt(jobDescription: JobDescriptionData, resume: ResumeData): string {
  return `
Please grade this resume against the job description and provide a detailed assessment.

JOB DESCRIPTION:
Title: ${jobDescription.title}
Description: ${jobDescription.description}
Required Skills: ${jobDescription.skills?.join(', ') || 'Not specified'}
Experience Level: ${jobDescription.experience_level || 'Not specified'}
Education Requirements: ${jobDescription.education || 'Not specified'}
Additional Requirements: ${jobDescription.requirements?.join(', ') || 'None specified'}

CANDIDATE RESUME:
Name: ${resume.name}
Email: ${resume.email || 'Not provided'}
Phone: ${resume.phone || 'Not provided'}
Skills: ${resume.skills?.join(', ') || 'Not specified'}
Experience: ${formatExperience(resume.experience)}
Education: ${formatEducation(resume.education)}
Summary: ${resume.summary || 'Not provided'}

GRADING INSTRUCTIONS:
1. Score the candidate from 0-100 based on how well they match the job requirements
2. Consider: skills alignment, experience level, education, and overall qualifications
3. Provide exactly 3 detailed, comprehensive reasons for the score (each reason should be 15-25 words)
4. Be fair but thorough in your assessment - explain WHY each factor matters
5. Consider both technical and soft skills, providing specific examples from their background
6. Make each reason substantive and informative, not just brief bullet points

RESPONSE FORMAT (JSON only, no other text):
{
  "score": 85,
  "reasons": [
    "Strong technical skills alignment with 8+ relevant technologies including JavaScript, React, and Node.js that directly match the frontend developer requirements and demonstrate hands-on expertise",
    "Extensive 5+ years of relevant industry experience significantly exceeds the 3+ year minimum requirement, showing progression from junior to senior roles with increasing responsibilities",
    "Bachelor's degree in Computer Science provides strong technical foundation and theoretical knowledge that complements practical experience, meeting educational requirements with relevant coursework"
  ]
}
`;
}

/**
 * Format experience data for the prompt
 */
function formatExperience(experience?: ResumeData['experience']): string {
  if (!experience || experience.length === 0) {
    return 'No experience listed';
  }
  
  return experience.map(exp => 
    `${exp.position} at ${exp.company} (${exp.years} years)${exp.description ? ': ' + exp.description : ''}`
  ).join('; ');
}

/**
 * Format education data for the prompt
 */
function formatEducation(education?: ResumeData['education']): string {
  if (!education || education.length === 0) {
    return 'No education listed';
  }
  
  return education.map(edu => 
    `${edu.degree} in ${edu.field}${edu.institution ? ' from ' + edu.institution : ''}`
  ).join('; ');
}

/**
 * Parse the OpenAI response into a structured format
 */
function parseGradingResponse(content: string): GradingResult {
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (typeof parsed.score !== 'number' || !Array.isArray(parsed.reasons)) {
      throw new Error('Invalid response structure');
    }
    
    // Ensure score is within valid range
    const score = Math.max(0, Math.min(100, parsed.score));
    
    // Ensure we have exactly 3 reasons
    const reasons = parsed.reasons.slice(0, 3);
    while (reasons.length < 3) {
      reasons.push('Additional qualifications and potential for growth');
    }
    
    return {
      finalScore: score,
      topReasons: reasons
    };
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to parse grading response');
  }
}

/**
 * Generate a fallback grade if OpenAI fails
 */
function generateFallbackGrade(jobDescription: JobDescriptionData, resume: ResumeData): GradingResult {
  console.log('Using fallback grading due to OpenAI error');
  
  let score = 50; // Base score
  const reasons: string[] = [];
  
  // Basic skills matching
  const jdSkills = jobDescription.skills || [];
  const resumeSkills = resume.skills || [];
  const skillMatches = jdSkills.filter(skill => 
    resumeSkills.some(resumeSkill => 
      resumeSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  if (skillMatches.length > 0) {
    score += skillMatches.length * 10;
    reasons.push(`Skills match: ${skillMatches.join(', ')}`);
  }
  
  // Experience level
  const totalExperience = resume.experience?.reduce((sum, exp) => sum + exp.years, 0) || 0;
  if (totalExperience >= 5) {
    score += 15;
    reasons.push(`${totalExperience} years of experience`);
  } else if (totalExperience >= 2) {
    score += 10;
    reasons.push(`${totalExperience} years of relevant experience`);
  }
  
  // Education
  if (resume.education && resume.education.length > 0) {
    score += 10;
    const edu = resume.education[0];
    reasons.push(`Educational background: ${edu.degree} in ${edu.field}`);
  }
  
  // Ensure we have 3 reasons
  while (reasons.length < 3) {
    reasons.push('Professional presentation and potential');
  }
  
  // Add some randomness for variety
  score += Math.floor(Math.random() * 20) - 10;
  score = Math.max(0, Math.min(100, score));
  
  return {
    finalScore: score,
    topReasons: reasons.slice(0, 3)
  };
}
