import axios from 'axios';
import { 
  Job, 
  Resume, 
  CreateJobRequest, 
  CreateJobResponse, 
  UploadResumesResponse, 
  Ranking 
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Jobs API
export const jobsApi = {
  // Create a new job
  create: async (data: CreateJobRequest): Promise<CreateJobResponse> => {
    const response = await api.post('/jobs', data);
    return response.data;
  },

  // Get all jobs
  getAll: async (): Promise<Job[]> => {
    const response = await api.get('/jobs');
    return response.data;
  },

  // Get job by ID
  getById: async (jobId: string): Promise<Job> => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Upload resumes to a job
  uploadResumes: async (jobId: string, files: File[]): Promise<UploadResumesResponse> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post(`/jobs/${jobId}/resumes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get rankings for a job
  getRankings: async (jobId: string, failed?: boolean): Promise<Ranking[]> => {
    const params = failed ? { failed: '1' } : {};
    const response = await api.get(`/jobs/${jobId}/rankings`, { params });
    return response.data;
  },
};

// Resumes API
export const resumesApi = {
  // Get resume details
  getById: async (resumeId: string): Promise<Resume> => {
    const response = await api.get(`/resumes/${resumeId}`);
    return response.data;
  },

  // Download PDF
  downloadPdf: async (resumeId: string): Promise<Blob> => {
    const response = await api.get(`/resumes/${resumeId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;



