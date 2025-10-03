// Data normalizer to ensure consistent flow between mock and real IDP
// This ensures grading code is identical regardless of data source

export interface NormalizedExtraction {
  jobKey: string;
  itemId: string;
  type: 'JD' | 'RESUME';
  extractionData: any;
  extractionVersion: string;
  status: string;
  createdAt: string;
}

export interface NormalizedJobData {
  jobKey: string;
  jd: NormalizedExtraction;
  resumes: NormalizedExtraction[];
}

export class ExtractionNormalizer {
  /**
   * Normalize IDP extractions to a consistent format
   */
  static normalizeExtractions(extractions: any[]): NormalizedExtraction[] {
    return extractions.map(extraction => {
      // Determine type based on itemId or content
      const type = this.determineType(extraction.itemId, extraction.extractionJson);
      
      return {
        jobKey: extraction.jobKey,
        itemId: extraction.itemId,
        type,
        extractionData: JSON.parse(extraction.extractionJson),
        extractionVersion: extraction.extractionVersion,
        status: extraction.status,
        createdAt: extraction.createdAt
      };
    });
  }

  /**
   * Group normalized extractions by job
   */
  static groupByJob(normalizedExtractions: NormalizedExtraction[]): Map<string, NormalizedJobData> {
    const jobMap = new Map<string, NormalizedJobData>();

    for (const extraction of normalizedExtractions) {
      if (!jobMap.has(extraction.jobKey)) {
        jobMap.set(extraction.jobKey, {
          jobKey: extraction.jobKey,
          jd: null as any, // Will be set below
          resumes: []
        });
      }

      const jobData = jobMap.get(extraction.jobKey)!;

      if (extraction.type === 'JD') {
        jobData.jd = extraction;
      } else if (extraction.type === 'RESUME') {
        jobData.resumes.push(extraction);
      }
    }

    return jobMap;
  }

  /**
   * Validate that a job has required data
   */
  static validateJobData(jobData: NormalizedJobData): boolean {
    return !!(jobData.jd && jobData.resumes.length > 0);
  }

  /**
   * Extract candidate name from resume data
   */
  static extractCandidateName(resumeData: any): string {
    // Try different possible fields for candidate name
    const possibleNames = [
      resumeData.Full_Name,
      resumeData.name,
      resumeData.Name,
      resumeData.candidate_name,
      resumeData.Candidate_Name
    ];

    for (const name of possibleNames) {
      if (name && typeof name === 'string' && name.trim()) {
        return name.trim();
      }
    }

    return 'Unknown Candidate';
  }

  /**
   * Extract job title from JD data
   */
  static extractJobTitle(jdData: any): string {
    const possibleTitles = [
      jdData.Job_Title,
      jdData.title,
      jdData.Title,
      jdData.job_title,
      jdData.position
    ];

    for (const title of possibleTitles) {
      if (title && typeof title === 'string' && title.trim()) {
        return title.trim();
      }
    }

    return 'Unknown Position';
  }

  /**
   * Extract skills from resume data
   */
  static extractSkills(resumeData: any): string[] {
    const skills: string[] = [];

    // Try different possible fields for skills
    const possibleSkills = [
      resumeData.Skills?.Skills,
      resumeData.skills,
      resumeData.Skills,
      resumeData.technical_skills,
      resumeData.Technical_Skills
    ];

    for (const skillField of possibleSkills) {
      if (Array.isArray(skillField)) {
        skills.push(...skillField.map(s => String(s).trim()));
      } else if (typeof skillField === 'string') {
        skills.push(skillField.trim());
      }
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Extract required skills from JD data
   */
  static extractRequiredSkills(jdData: any): string[] {
    const skills: string[] = [];

    // Try different possible fields for required skills
    const possibleSkills = [
      jdData.Skills?.Skills,
      jdData.skills,
      jdData.Skills,
      jdData.required_skills,
      jdData.Required_Skills
    ];

    for (const skillField of possibleSkills) {
      if (Array.isArray(skillField)) {
        skills.push(...skillField.map(s => String(s).trim()));
      } else if (typeof skillField === 'string') {
        skills.push(skillField.trim());
      }
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Determine extraction type based on itemId or content
   */
  private static determineType(itemId: string, extractionJson: string): 'JD' | 'RESUME' {
    // Check itemId first
    if (itemId.includes('_jd') || itemId.includes('_JD')) {
      return 'JD';
    }
    if (itemId.includes('_resume') || itemId.includes('_Resume')) {
      return 'RESUME';
    }

    // Fallback: check content structure
    try {
      const data = JSON.parse(extractionJson);
      
      // JD typically has job-related fields
      const jdFields = ['Job_Title', 'Responsibilities', 'Qualifications', 'Experience'];
      const hasJdFields = jdFields.some(field => data.hasOwnProperty(field));
      
      if (hasJdFields) {
        return 'JD';
      }

      // Resume typically has personal fields
      const resumeFields = ['Full_Name', 'Email', 'Phone', 'Education', 'Experience'];
      const hasResumeFields = resumeFields.some(field => data.hasOwnProperty(field));
      
      if (hasResumeFields) {
        return 'RESUME';
      }
    } catch (error) {
      console.warn('Could not parse extraction JSON for type determination:', error);
    }

    // Default to RESUME if uncertain
    return 'RESUME';
  }
}
