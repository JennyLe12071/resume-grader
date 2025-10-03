// Environment-driven file source service
// Uses adapters to support both local filesystem and SharePoint

import { createFileSourceAdapter, FileInfo } from '../adapters/fileSourceAdapter';

export interface FolderInfo {
  jdFiles: FileInfo[];
  resumeFiles: FileInfo[];
  totalFiles: number;
}

export class FileSourceService {
  private adapter: any;

  constructor() {
    this.adapter = createFileSourceAdapter();
  }

  /**
   * Dynamically count files using the configured adapter
   */
  async getFolderFileCount(
    jdFolderPath: string,
    resumeFolderPath: string
  ): Promise<FolderInfo> {
    try {
      const fileSource = process.env.FILE_SOURCE || 'local';
      console.log(`🔍 Dynamically scanning files using ${fileSource} adapter...`);
      console.log(`   JD Folder: ${jdFolderPath}`);
      console.log(`   Resume Folder: ${resumeFolderPath}`);

      const result = await this.adapter.getFolderFileCount(jdFolderPath, resumeFolderPath);

      console.log(`✅ File detection complete:`);
      console.log(`   JD Files: ${result.jdFiles.length}`);
      console.log(`   Resume Files: ${result.resumeFiles.length}`);
      console.log(`   Total Files: ${result.totalFiles}`);

      return result;

    } catch (error) {
      console.error('Error scanning files:', error);
      throw new Error('Failed to scan files');
    }
  }

  /**
   * Download a file using the configured adapter
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    return await this.adapter.downloadFile(filePath);
  }
}

// Export singleton instance
export const fileSourceService = new FileSourceService();
