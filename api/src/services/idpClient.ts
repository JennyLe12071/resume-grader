import axios from 'axios';

export interface IdpResult {
  resumeId: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: Array<{
    degree: string;
    field: string;
  }>;
  experience: Array<{
    title: string;
    years: number;
  }>;
  fullText: string;
}

class IdpClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.IDP_BASE_URL || '';
    this.apiKey = process.env.IDP_API_KEY || '';
    
    if (!this.baseUrl || !this.apiKey) {
      console.warn('IDP credentials not configured. Using mock responses.');
    }
  }

  async process(pdfBuffer: Buffer): Promise<IdpResult> {
    // If no IDP configured, return mock data for development
    if (!this.baseUrl || !this.apiKey) {
      return this.getMockResult();
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/process`,
        pdfBuffer,
        {
          headers: {
            'Content-Type': 'application/pdf',
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      return response.data as IdpResult;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`IDP API Error: ${error.response?.status} - ${message}`);
      }
      throw new Error(`IDP Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getMockResult(): IdpResult {
    // Generate mock data for development/testing
    const mockNames = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 'David Brown'];
    const mockEmails = ['john@email.com', 'jane@email.com', 'mike@email.com', 'sarah@email.com', 'david@email.com'];
    const mockSkills = [
      ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      ['Python', 'SQL', 'Tableau', 'Excel'],
      ['Java', 'Spring Boot', 'MySQL', 'Docker'],
      ['C#', '.NET', 'Azure', 'SQL Server'],
      ['Python', 'Machine Learning', 'TensorFlow', 'Pandas']
    ];
    const mockDegrees = ['BS', 'MS', 'MBA', 'PhD'];
    const mockFields = ['Computer Science', 'Data Science', 'Business', 'Engineering', 'Mathematics'];
    const mockTitles = ['Software Engineer', 'Data Analyst', 'Product Manager', 'DevOps Engineer', 'UX Designer'];

    const randomIndex = Math.floor(Math.random() * mockNames.length);
    
    return {
      resumeId: `R-${Date.now()}`,
      name: mockNames[randomIndex],
      email: mockEmails[randomIndex],
      phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
      skills: mockSkills[randomIndex],
      education: [{
        degree: mockDegrees[Math.floor(Math.random() * mockDegrees.length)],
        field: mockFields[Math.floor(Math.random() * mockFields.length)]
      }],
      experience: [{
        title: mockTitles[Math.floor(Math.random() * mockTitles.length)],
        years: Math.floor(Math.random() * 10) + 1
      }],
      fullText: `This is a mock resume for ${mockNames[randomIndex]}. They have experience in ${mockSkills[randomIndex].join(', ')} and ${Math.floor(Math.random() * 10) + 1} years of experience as a ${mockTitles[Math.floor(Math.random() * mockTitles.length)]}.`
    };
  }
}

export const idpClient = new IdpClient();



