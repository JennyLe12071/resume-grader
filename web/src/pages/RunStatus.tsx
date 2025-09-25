import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';

interface JobStatus {
  job_id: string;
  external_job_ref: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
  phases: {
    extract_jd: 'PENDING' | 'DONE';
    extract_resumes: {
      done: number;
      total: number;
    };
    grade: {
      done: number;
      total: number;
    };
  };
}

export function RunStatus() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchStatus();
      // Poll every 2 seconds
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [jobId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle size={20} style={{ color: '#27ae60' }} />;
      case 'PROCESSING':
        return <Clock size={20} style={{ color: '#f39c12' }} />;
      case 'ERROR':
        return <AlertCircle size={20} style={{ color: '#e74c3c' }} />;
      default:
        return <Clock size={20} style={{ color: '#95a5a6' }} />;
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

  const getProgressPercentage = (done: number, total: number) => {
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p>Loading job status...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="card">
        <div className="error">
          {error || 'Failed to load job status'}
          <button onClick={() => navigate('/')} style={{ marginLeft: '1rem' }}>
            Back to Roles
          </button>
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
          Back to Roles
        </button>
        <h2>Job Status</h2>
        <p>Job #{status.external_job_ref} - {status.job_id}</p>
      </div>

      {/* Overall Status */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Overall Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getStatusIcon(status.status)}
            <span style={{ 
              color: getStatusColor(status.status),
              fontWeight: '500',
              textTransform: 'uppercase',
              fontSize: '0.875rem'
            }}>
              {status.status}
            </span>
          </div>
        </div>
        
        {status.status === 'READY' && (
          <div style={{ 
            background: '#d4edda', 
            border: '1px solid #c3e6cb', 
            borderRadius: '8px', 
            padding: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#155724' }}>Processing Complete!</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#155724' }}>
                  All resumes have been processed and graded. You can now view the results.
                </p>
              </div>
              <button 
                className="btn"
                onClick={() => navigate(`/run/${jobId}/results`)}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Eye size={16} style={{ marginRight: '0.5rem' }} />
                View Rankings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processing Phases */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50' }}>Processing Phases</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* JD Extraction */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500', color: '#2c3e50' }}>Job Description Extraction</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getStatusIcon(status.phases.extract_jd)}
                <span style={{ 
                  color: status.phases.extract_jd === 'DONE' ? '#27ae60' : '#95a5a6',
                  fontSize: '0.875rem'
                }}>
                  {status.phases.extract_jd}
                </span>
              </div>
            </div>
            <div style={{ 
              background: '#ecf0f1', 
              borderRadius: '4px', 
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: status.phases.extract_jd === 'DONE' ? '#27ae60' : '#95a5a6',
                height: '100%',
                width: status.phases.extract_jd === 'DONE' ? '100%' : '0%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Resume Extraction */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500', color: '#2c3e50' }}>Resume Extraction</span>
              <span style={{ color: '#7f8c8d', fontSize: '0.875rem' }}>
                {status.phases.extract_resumes.done} / {status.phases.extract_resumes.total}
              </span>
            </div>
            <div style={{ 
              background: '#ecf0f1', 
              borderRadius: '4px', 
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: '#f39c12',
                height: '100%',
                width: `${getProgressPercentage(status.phases.extract_resumes.done, status.phases.extract_resumes.total)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ marginTop: '0.25rem', color: '#7f8c8d', fontSize: '0.875rem' }}>
              {getProgressPercentage(status.phases.extract_resumes.done, status.phases.extract_resumes.total)}% complete
            </div>
          </div>

          {/* Grading */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '500', color: '#2c3e50' }}>Resume Grading</span>
              <span style={{ color: '#7f8c8d', fontSize: '0.875rem' }}>
                {status.phases.grade.done} / {status.phases.grade.total}
              </span>
            </div>
            <div style={{ 
              background: '#ecf0f1', 
              borderRadius: '4px', 
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: '#3498db',
                height: '100%',
                width: `${getProgressPercentage(status.phases.grade.done, status.phases.grade.total)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ marginTop: '0.25rem', color: '#7f8c8d', fontSize: '0.875rem' }}>
              {getProgressPercentage(status.phases.grade.done, status.phases.grade.total)}% complete
            </div>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div style={{ textAlign: 'center', marginTop: '2rem', color: '#95a5a6', fontSize: '0.875rem' }}>
        Status updates automatically every 2 seconds
      </div>
    </div>
  );
}
