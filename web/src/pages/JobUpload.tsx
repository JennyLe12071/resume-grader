import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { Job, UploadResumesResponse } from '../types';
import { Upload, FileText, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FileWithStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  resumeId?: string;
  error?: string;
}

export function JobUpload() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [job, setJob] = useState<Job | null>(null);
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      const jobData = await jobsApi.getById(jobId!);
      setJob(jobData);
    } catch (err) {
      setError('Failed to load job details');
      console.error('Error loading job:', err);
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithStatus[] = Array.from(selectedFiles).map(file => ({
      file,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    const pdfFiles = files.filter(f => f.file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      // Update file statuses to uploading
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

      const response: UploadResumesResponse = await jobsApi.uploadResumes(
        jobId!, 
        pdfFiles.map(f => f.file)
      );

      // Update file statuses based on response
      setFiles(prev => {
        const updated = [...prev];
        let acceptedIndex = 0;
        
        prev.forEach((fileWithStatus, index) => {
          if (fileWithStatus.file.type === 'application/pdf') {
            if (response.accepted.includes(fileWithStatus.file.name)) {
              updated[index] = {
                ...fileWithStatus,
                status: 'success',
                resumeId: response.resumeIds[acceptedIndex]
              };
              acceptedIndex++;
            } else {
              updated[index] = {
                ...fileWithStatus,
                status: 'error',
                error: 'File was rejected by server'
              };
            }
          }
        });
        
        return updated;
      });

      setSuccess(`Successfully uploaded ${response.accepted.length} files. Processing will begin shortly.`);
      
      // Clear files after successful upload
      setTimeout(() => {
        setFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (err) {
      setError('Failed to upload files. Please try again.');
      setFiles(prev => prev.map(f => ({ ...f, status: 'error', error: 'Upload failed' })));
      console.error('Error uploading files:', err);
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} style={{ color: '#27ae60' }} />;
      case 'error':
        return <XCircle size={16} style={{ color: '#e74c3c' }} />;
      case 'uploading':
        return <div className="loading" style={{ width: '16px', height: '16px' }}></div>;
      default:
        return <AlertCircle size={16} style={{ color: '#f39c12' }} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Uploaded';
      case 'error':
        return 'Failed';
      case 'uploading':
        return 'Uploading...';
      default:
        return 'Pending';
    }
  };

  if (!job) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn btn-secondary"
          style={{ marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
          Back to Jobs
        </button>
        <h2>Upload Resumes</h2>
        <p><strong>{job.title}</strong></p>
      </div>

      <div className="card">
        <div
          className={`upload-area ${files.length > 0 ? 'has-files' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={48} style={{ color: '#bdc3c7', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
            Drop PDF files here or click to browse
          </h3>
          <p style={{ margin: 0, color: '#7f8c8d' }}>
            Select multiple PDF files to upload and process
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>

        {files.length > 0 && (
          <div className="file-list">
            <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Selected Files</h4>
            {files.map((fileWithStatus, index) => (
              <div key={index} className="file-item">
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  {getStatusIcon(fileWithStatus.status)}
                  <span className="file-name" style={{ marginLeft: '0.5rem' }}>
                    {fileWithStatus.file.name}
                  </span>
                  <span className="file-status" style={{ marginLeft: '0.5rem' }}>
                    {getStatusText(fileWithStatus.status)}
                  </span>
                  {fileWithStatus.error && (
                    <span style={{ color: '#e74c3c', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                      {fileWithStatus.error}
                    </span>
                  )}
                </div>
                {fileWithStatus.status === 'pending' && (
                  <button
                    onClick={() => removeFile(index)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {success && (
          <div className="success">
            {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={uploadFiles}
            className="btn"
            disabled={uploading || files.length === 0}
          >
            {uploading ? (
              <>
                <div className="loading" style={{ marginRight: '0.5rem' }}></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} style={{ marginRight: '0.5rem' }} />
                Upload {files.length} Files
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card" style={{ background: '#f8f9fa' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>What happens next?</h4>
        <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#7f8c8d' }}>
          <li>Files are uploaded and stored securely</li>
          <li>Each PDF is processed by our AI to extract information</li>
          <li>Resumes are graded against your job requirements</li>
          <li>Results are ranked and ready for review</li>
        </ol>
        <div style={{ marginTop: '1rem' }}>
          <Link 
            to={`/jobs/${jobId}/rankings`} 
            className="btn"
            style={{ fontSize: '0.875rem' }}
          >
            <FileText size={16} style={{ marginRight: '0.5rem' }} />
            View Rankings
          </Link>
        </div>
      </div>
    </div>
  );
}



