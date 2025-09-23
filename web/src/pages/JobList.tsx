import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { Job } from '../types';
import { Plus, FileText, Users } from 'lucide-react';

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobsData = await jobsApi.getAll();
      setJobs(jobsData);
    } catch (err) {
      setError('Failed to load jobs. Please try again.');
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">
          {error}
          <button onClick={loadJobs} style={{ marginLeft: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Jobs</h2>
        <Link to="/jobs/new" className="btn">
          <Plus size={20} style={{ marginRight: '0.5rem' }} />
          Create New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} style={{ color: '#bdc3c7', marginBottom: '1rem' }} />
          <h3>No jobs yet</h3>
          <p>Create your first job to start grading resumes</p>
          <Link to="/jobs/new" className="btn" style={{ marginTop: '1rem' }}>
            Create Job
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {jobs.map((job) => (
            <div key={job.jobId} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                    {job.title}
                  </h3>
                  <p style={{ 
                    color: '#7f8c8d', 
                    margin: '0 0 1rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {job.jobDescription}
                  </p>
                  <p style={{ color: '#95a5a6', fontSize: '0.875rem', margin: 0 }}>
                    Created {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  <Link 
                    to={`/jobs/${job.jobId}/upload`} 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    <Users size={16} style={{ marginRight: '0.25rem' }} />
                    Upload
                  </Link>
                  <Link 
                    to={`/jobs/${job.jobId}/rankings`} 
                    className="btn"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    <FileText size={16} style={{ marginRight: '0.25rem' }} />
                    Rankings
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



