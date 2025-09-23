import axios from 'axios';
import { IdpResult } from './idpClient';

export interface GradeResult {
  finalScore: number;
  topReasons: string[];
}

class GraderClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.LLM_BASE_URL || '';
    this.apiKey = process.env.LLM_API_KEY || '';
    
    if (!this.baseUrl || !this.apiKey) {
      console.warn('LLM credentials not configured. Using mock responses.');
    }
  }

  async grade(jobDescription: string, idpResult: IdpResult): Promise<GradeResult> {
    // If no LLM configured, return mock data for development
    if (!this.baseUrl || !this.apiKey) {
      return this.getMockGrade(jobDescription, idpResult);
    }

    try {
      const prompt = this.buildPrompt(jobDescription, idpResult);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'gpt-4', // or whatever model you're using
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent scoring
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000 // 30 second timeout
        }
      );

      const content = response.data.choices[0].message.content;
      return this.parseGradeResponse(content);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`LLM API Error: ${error.response?.status} - ${message}`);
      }
      throw new Error(`LLM Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getSystemPrompt(): string {
    return `You grade resumes for one job. Output JSON only. No explanations.
JSON schema: { "finalScore": 0-100, "topReasons": string[3] }`;
  }

  private buildPrompt(jobDescription: string, idpResult: IdpResult): string {
    return `JOB_DESCRIPTION:
${jobDescription}

CANDIDATE:
${idpResult.fullText}

RUBRIC (20 points each):
1) Must-have skills match
2) Years of relevant experience
3) Domain alignment
4) Recency and tenure stability
5) Communication clarity

Return strictly:
{"finalScore": <int>, "topReasons": ["...", "...", "..."]}`;
  }

  private parseGradeResponse(content: string): GradeResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (typeof parsed.finalScore !== 'number' || !Array.isArray(parsed.topReasons)) {
        throw new Error('Invalid JSON structure');
      }

      return {
        finalScore: Math.max(0, Math.min(100, parsed.finalScore)), // Clamp to 0-100
        topReasons: parsed.topReasons.slice(0, 3) // Ensure max 3 reasons
      };
    } catch (error) {
      console.error('Failed to parse grade response:', content);
      throw new Error(`Failed to parse grade response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getMockGrade(jobDescription: string, idpResult: IdpResult): GradeResult {
    // Simple mock grading based on skills and experience
    let score = 50; // Base score
    const reasons: string[] = [];

    // Check for common skills
    const commonSkills = ['JavaScript', 'Python', 'SQL', 'React', 'Node.js', 'TypeScript'];
    const matchingSkills = idpResult.skills.filter(skill => 
      commonSkills.some(common => skill.toLowerCase().includes(common.toLowerCase()))
    );

    if (matchingSkills.length > 0) {
      score += 15;
      reasons.push(`Has relevant skills: ${matchingSkills.join(', ')}`);
    }

    // Check experience
    const totalExperience = idpResult.experience.reduce((sum, exp) => sum + exp.years, 0);
    if (totalExperience >= 3) {
      score += 20;
      reasons.push(`${totalExperience} years of relevant experience`);
    } else if (totalExperience >= 1) {
      score += 10;
      reasons.push(`${totalExperience} year of experience`);
    }

    // Check education
    if (idpResult.education.length > 0) {
      score += 10;
      reasons.push(`Has ${idpResult.education[0].degree} in ${idpResult.education[0].field}`);
    }

    // Add generic reasons if we don't have enough
    if (reasons.length < 3) {
      reasons.push('Resume shows good communication skills');
    }
    if (reasons.length < 3) {
      reasons.push('Professional presentation and formatting');
    }

    // Add some randomness for variety
    score += Math.floor(Math.random() * 20) - 10;
    score = Math.max(0, Math.min(100, score));

    return {
      finalScore: score,
      topReasons: reasons.slice(0, 3)
    };
  }
}

export const graderClient = new GraderClient();



