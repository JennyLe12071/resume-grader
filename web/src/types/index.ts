export interface Job {
  jobId: string;
  title: string;
  jobDescription: string;
  createdAt: string;
}

export interface Resume {
  resumeId: string;
  jobId: string;
  filename: string;
  status: 'PENDING' | 'FAILED_IDP' | 'FAILED_GRADER' | 'DONE';
  errorText?: string;
  createdAt: string;
  idpJson?: IdpResult;
  gradeJson?: GradeResult;
}

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

export interface GradeResult {
  finalScore: number;
  topReasons: string[];
}

export interface Ranking {
  resumeId: string;
  filename: string;
  status: string;
  finalScore?: number;
  topReasons?: string[];
  errorText?: string;
}

export interface CreateJobRequest {
  title: string;
  jobDescription: string;
}

export interface CreateJobResponse {
  jobId: string;
}

export interface UploadResumesResponse {
  accepted: string[];
  rejected: string[];
  resumeIds: string[];
}



