// Environment-driven file source adapters
// Supports both local filesystem and SharePoint

export interface FileInfo {
  name: string;
  size: number;
  lastModified: string;
  webUrl: string;
  content?: Buffer; // For local files
}

export interface FileSourceAdapter {
  getFolderFileCount(jdFolderPath: string, resumeFolderPath: string): Promise<{
    jdFiles: FileInfo[];
    resumeFiles: FileInfo[];
    totalFiles: number;
  }>;
  downloadFile(filePath: string): Promise<Buffer>;
}

// Local filesystem adapter
export class LocalFsAdapter implements FileSourceAdapter {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  async getFolderFileCount(jdFolderPath: string, resumeFolderPath: string): Promise<{
    jdFiles: FileInfo[];
    resumeFiles: FileInfo[];
    totalFiles: number;
  }> {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      // Convert SharePoint-style paths to local paths
      const localJdPath = this.convertToLocalPath(jdFolderPath);
      const localResumePath = this.convertToLocalPath(resumeFolderPath);

      // Read JD files
      const jdFiles = await this.readLocalFiles(localJdPath);
      
      // Read resume files
      const resumeFiles = await this.readLocalFiles(localResumePath);

      return {
        jdFiles,
        resumeFiles,
        totalFiles: jdFiles.length + resumeFiles.length
      };
    } catch (error) {
      console.error('Error reading local files:', error);
      // Fallback to mock data if local files don't exist
      return this.getMockFileCount(jdFolderPath, resumeFolderPath);
    }
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    const fs = await import('fs/promises');
    const localPath = this.convertToLocalPath(filePath);
    return await fs.readFile(localPath);
  }

  private convertToLocalPath(sharePointPath: string): string {
    // Convert SharePoint path to your actual local file paths
    const parts = sharePointPath.split('/');
    const jobName = parts[parts.length - 2]; // Business_Development_Manager
    const folderType = parts[parts.length - 1].toLowerCase(); // jd or resumes
    
    // Map to your actual file locations
    if (jobName === 'Business_Development_Manager') {
      if (folderType === 'jd') {
        return 'C:\\Users\\jle\\OneDrive - BioIVT\\Documents\\resume-prototype\\Job Description\\Business Development Manager.pdf';
      } else if (folderType === 'resumes') {
        return 'C:\\Users\\jle\\OneDrive - BioIVT\\Documents\\resume-prototype\\sample_resumes\\Business Development Manager';
      }
    }
    
    // Fallback to local_jobs structure for other jobs
    return `${this.rootPath}/${jobName}/${folderType}`;
  }

  private async readLocalFiles(folderPath: string): Promise<FileInfo[]> {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      const stats = await fs.stat(folderPath);
      
      // If it's a single file (JD), return it as a single-item array
      if (stats.isFile()) {
        return [{
          name: path.basename(folderPath),
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          webUrl: folderPath
        }];
      }
      
      // If it's a directory (resumes), read all files in it
      if (stats.isDirectory()) {
        const files = await fs.readdir(folderPath);
        const fileInfos: FileInfo[] = [];

        for (const file of files) {
          const filePath = path.join(folderPath, file);
          const fileStats = await fs.stat(filePath);
          
          if (fileStats.isFile()) {
            fileInfos.push({
              name: file,
              size: fileStats.size,
              lastModified: fileStats.mtime.toISOString(),
              webUrl: filePath
            });
          }
        }

        return fileInfos;
      }

      return [];
    } catch (error) {
      console.log(`Local path ${folderPath} not found, using mock data`);
      return [];
    }
  }

  private getMockFileCount(jdFolderPath: string, resumeFolderPath: string): {
    jdFiles: FileInfo[];
    resumeFiles: FileInfo[];
    totalFiles: number;
  } {
    // Fallback to mock data when local files don't exist
    const jobName = jdFolderPath.split('/').slice(-2, -1)[0];
    
    const jdFiles: FileInfo[] = [{
      name: `${jobName}_JD.pdf`,
      size: 50000,
      lastModified: new Date().toISOString(),
      webUrl: `${jdFolderPath}/${jobName}_JD.pdf`
    }];

    const resumeFiles: FileInfo[] = [];
    const resumeCount = this.getResumeCountForJob(jobName);
    
    for (let i = 1; i <= resumeCount; i++) {
      resumeFiles.push({
        name: `Resume_${i.toString().padStart(2, '0')}.pdf`,
        size: Math.floor(Math.random() * 1000000) + 50000,
        lastModified: new Date().toISOString(),
        webUrl: `${resumeFolderPath}/Resume_${i.toString().padStart(2, '0')}.pdf`
      });
    }

    return {
      jdFiles,
      resumeFiles,
      totalFiles: jdFiles.length + resumeFiles.length
    };
  }

  private getResumeCountForJob(jobName: string): number {
    // Simulate different resume counts based on job
    const counts: { [key: string]: number } = {
      'Business_Development_Manager': 4,
      'Marketing_Manager': 3,
      'Sales_Manager': 4,
      'Software_Engineer': 5
    };
    return counts[jobName] || 2;
  }
}

// SharePoint adapter (placeholder for future implementation)
export class SharePointAdapter implements FileSourceAdapter {
  private siteId: string;
  private driveId: string;

  constructor(siteId: string, driveId: string) {
    this.siteId = siteId;
    this.driveId = driveId;
  }

  async getFolderFileCount(jdFolderPath: string, resumeFolderPath: string): Promise<{
    jdFiles: FileInfo[];
    resumeFiles: FileInfo[];
    totalFiles: number;
  }> {
    // TODO: Implement SharePoint Graph API calls
    throw new Error('SharePoint adapter not yet implemented');
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    // TODO: Implement SharePoint file download
    throw new Error('SharePoint adapter not yet implemented');
  }
}

// Factory function to create the appropriate adapter
export function createFileSourceAdapter(): FileSourceAdapter {
  const fileSource = process.env.FILE_SOURCE || 'local';
  const localRoot = process.env.LOCAL_ROOT || './local_jobs';

  switch (fileSource) {
    case 'local':
      return new LocalFsAdapter(localRoot);
    case 'sharepoint':
      const siteId = process.env.SP_SITE_ID;
      const driveId = process.env.SP_DRIVE_ID;
      if (!siteId || !driveId) {
        throw new Error('SP_SITE_ID and SP_DRIVE_ID must be set for SharePoint adapter');
      }
      return new SharePointAdapter(siteId, driveId);
    default:
      throw new Error(`Unknown FILE_SOURCE: ${fileSource}`);
  }
}
