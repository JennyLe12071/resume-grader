// Environment-driven IDP adapters
// Supports both mock IDP and MuleSoft IDP

export interface IdpExtraction {
  jobKey: string;
  itemId: string;
  extractionJson: string;
  extractionVersion: string;
  status: string;
  createdAt: string;
}

export interface IdpAdapter {
  processJob(externalJobRef: string, jdFolderPath: string, resumeFolderPath: string): Promise<{
    requestId: string;
    status: string;
  }>;
  getExtractions(requestId: string): Promise<IdpExtraction[]>;
}

// Mock IDP adapter using fixtures
export class MockIdpAdapter implements IdpAdapter {
  private extractions: Map<string, IdpExtraction[]> = new Map();

  async processJob(externalJobRef: string, jdFolderPath: string, resumeFolderPath: string): Promise<{
    requestId: string;
    status: string;
  }> {
    const requestId = `mock_${externalJobRef}_${Date.now()}`;
    
    console.log(` Mock IDP processing job: ${externalJobRef}`);
    console.log(`   JD Folder: ${jdFolderPath}`);
    console.log(`   Resume Folder: ${resumeFolderPath}`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Load mock extractions from fixtures
    const { mockIdpJD, mockIdpResumes } = await import('../mocks/fixtures');
    
    const extractions: IdpExtraction[] = [];

    // Add JD extraction
    extractions.push({
      jobKey: externalJobRef,
      itemId: `${externalJobRef}_jd`,
      extractionJson: JSON.stringify(mockIdpJD),
      extractionVersion: 'v1',
      status: 'PARSED',
      createdAt: new Date().toISOString()
    });

    // Add resume extractions
    mockIdpResumes.forEach((resume, index) => {
      extractions.push({
        jobKey: externalJobRef,
        itemId: `${externalJobRef}_resume_${index}`,
        extractionJson: JSON.stringify(resume),
        extractionVersion: 'v1',
        status: 'PARSED',
        createdAt: new Date().toISOString()
      });
    });

    // Store extractions for later retrieval
    this.extractions.set(requestId, extractions);

    console.log(`✅ Mock IDP completed: ${extractions.length} extractions created`);

    return {
      requestId,
      status: 'COMPLETED'
    };
  }

  async getExtractions(requestId: string): Promise<IdpExtraction[]> {
    return this.extractions.get(requestId) || [];
  }
}

// MuleSoft IDP adapter
export class MuleIdpAdapter implements IdpAdapter {
  private startUrl: string;
  private hmacSecret: string;

  constructor(startUrl: string, hmacSecret: string) {
    this.startUrl = startUrl;
    this.hmacSecret = hmacSecret;
  }

  async processJob(externalJobRef: string, jdFolderPath: string, resumeFolderPath: string): Promise<{
    requestId: string;
    status: string;
  }> {
    const requestId = `mule_${externalJobRef}_${Date.now()}`;
    
    console.log(` MuleSoft IDP processing job: ${externalJobRef}`);
    console.log(`   Start URL: ${this.startUrl}`);
    console.log(`   JD Folder: ${jdFolderPath}`);
    console.log(`   Resume Folder: ${resumeFolderPath}`);

    // TODO: Implement actual MuleSoft API call
    const response = await fetch(this.startUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.hmacSecret}`
      },
      body: JSON.stringify({
        externalJobRef,
        jdFolderPath,
        resumeFolderPath,
        requestId
      })
    });

    if (!response.ok) {
      throw new Error(`MuleSoft IDP request failed: ${response.statusText}`);
    }

    const result = await response.json() as any;

    return {
      requestId: result.requestId || requestId,
      status: result.status || 'PROCESSING'
    };
  }

  async getExtractions(requestId: string): Promise<IdpExtraction[]> {
    // TODO: Implement MuleSoft extraction retrieval
    // This would typically be called via webhook callback
    throw new Error('MuleSoft extraction retrieval not yet implemented');
  }
}

// Factory function to create the appropriate adapter
export function createIdpAdapter(): IdpAdapter {
  const parser = process.env.PARSER || 'mock';

  switch (parser) {
    case 'mock':
      return new MockIdpAdapter();
    case 'mule':
      const startUrl = process.env.MULE_START_URL;
      const hmacSecret = process.env.CALLBACK_HMAC_SECRET;
      if (!startUrl || !hmacSecret) {
        throw new Error('MULE_START_URL and CALLBACK_HMAC_SECRET must be set for MuleSoft adapter');
      }
      return new MuleIdpAdapter(startUrl, hmacSecret);
    default:
      throw new Error(`Unknown PARSER: ${parser}`);
  }
}
