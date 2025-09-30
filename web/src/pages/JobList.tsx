import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { Job } from '../types';
import { Plus, FileText, Users, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const jobsData = await jobsApi.getAll();
      setJobs(jobsData);
    } catch (err) {
      setError('Failed to load jobs. Please try again.');
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

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
        <div>
          <h2>Jobs</h2>
          <p style={{ color: '#7f8c8d', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => loadJobs(true)} 
            className="btn btn-secondary"
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <Link to="/manual-grading" className="btn btn-secondary">
            <FileText size={20} style={{ marginRight: '0.5rem' }} />
            Manual Grading
          </Link>
          <Link to="/jobs/new" className="btn">
            <Plus size={20} style={{ marginRight: '0.5rem' }} />
            Run Job
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} style={{ color: '#bdc3c7', marginBottom: '1rem' }} />
          <h3>No jobs available</h3>
          <p>All documents are stored in the database. Run a job to start processing resumes.</p>
          <Link to="/jobs/new" className="btn" style={{ marginTop: '1rem' }}>
            Run Job
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {jobs.map((job) => {
            const getStatusIcon = (status: string) => {
              switch (status) {
                case 'READY':
                  return <CheckCircle size={16} style={{ color: '#27ae60' }} />;
                case 'PROCESSING':
                  return <Clock size={16} style={{ color: '#f39c12' }} />;
                case 'ERROR':
                  return <AlertCircle size={16} style={{ color: '#e74c3c' }} />;
                default:
                  return <Clock size={16} style={{ color: '#95a5a6' }} />;
              }
            };

            const getStatusText = (status: string) => {
              switch (status) {
                case 'READY':
                  return 'Ready';
                case 'PROCESSING':
                  return 'Processing';
                case 'ERROR':
                  return 'Error';
                default:
                  return 'Pending';
              }
            };

            const getStatusColor = (status: string) => {
              switch (status) {
                case 'READY':
                  return '#27ae60';
                case 'PROCESSING':
                  return '#f39c12';
                case 'ERROR':
                  return '#e74c3c';
                default:
                  return '#95a5a6';
              }
            };

            return (
              <div key={job.jobId} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, color: '#2c3e50' }}>
                        {job.title}
                      </h3>
                      {getStatusIcon(job.status)}
                      <span style={{ 
                        color: getStatusColor(job.status), 
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {getStatusText(job.status)}
                      </span>
                    </div>
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
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <p style={{ color: '#95a5a6', fontSize: '0.875rem', margin: 0 }}>
                        Created {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                      {(job as any).resumeCount !== undefined && (
                        <p style={{ color: '#95a5a6', fontSize: '0.875rem', margin: 0 }}>
                          • {(job as any).resumeCount} resume{(job as any).resumeCount !== 1 ? 's' : ''}
                        </p>
                      )}
                      {(job as any).completedCount !== undefined && (
                        <p style={{ color: '#95a5a6', fontSize: '0.875rem', margin: 0 }}>
                          • {(job as any).completedCount} graded
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <Link 
                      to={`/jobs/${job.jobId}/rankings`} 
                      className="btn"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      <FileText size={16} style={{ marginRight: '0.25rem' }} />
                      View Results
                    </Link>
                    {job.status === 'PENDING' && (
                      <button 
                        onClick={() => {
                          // TODO: Implement job execution
                          console.log('Run job:', job.jobId);
                        }}
                        className="btn btn-success"
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                      >
                        <Users size={16} style={{ marginRight: '0.25rem' }} />
                        Run Job
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



