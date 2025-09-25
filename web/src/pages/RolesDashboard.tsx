import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, FileText, Clock, TrendingUp } from 'lucide-react';

interface Role {
  id: string;
  title: string;
  jobNumber: string;
  description: string;
  completionPercentage: number;
  status: string;
  lastRun?: string;
  resumeCount: number;
  jdCount: number;
  hasDocuments: boolean;
  hasResumes: boolean;
}

export function RolesDashboard() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/jobs/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      const data = await response.json();
      setRoles(data.roles);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (role: Role) => {
    setStarting(role.id);
    
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          external_job_ref: role.jobNumber
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start job');
      }

      const data = await response.json();
      navigate(`/run/${data.job_id}`);
    } catch (error) {
      console.error('Error starting job:', error);
      alert('Failed to start job. Please try again.');
    } finally {
      setStarting(null);
    }
  };

  const formatLastRun = (lastRun?: string) => {
    if (!lastRun) return null;
    
    const date = new Date(lastRun);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 100) return '#27ae60';
    if (percentage >= 75) return '#2ecc71';
    if (percentage >= 50) return '#f39c12';
    if (percentage >= 25) return '#e67e22';
    return '#95a5a6';
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p>Loading roles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">
          {error}
          <button onClick={fetchRoles} style={{ marginLeft: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2>Roles Dashboard</h2>
        <p>Select a role to start the resume grading process</p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        {roles.map((role) => (
          <div key={role.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                  {role.title}
                </h3>
                <p style={{ 
                  color: '#7f8c8d', 
                  margin: '0 0 1rem 0',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  {role.description}
                </p>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#7f8c8d', fontSize: '0.875rem' }}>
                    <FileText size={16} style={{ marginRight: '0.25rem' }} />
                    Job #{role.jobNumber}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: role.hasResumes ? '#27ae60' : '#e74c3c', fontSize: '0.875rem' }}>
                    <FileText size={16} style={{ marginRight: '0.25rem' }} />
                    {role.hasResumes ? `${role.resumeCount} resume${role.resumeCount !== 1 ? 's' : ''}` : 'No resumes'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: getCompletionColor(role.completionPercentage), fontSize: '0.875rem', fontWeight: '500' }}>
                    <TrendingUp size={16} style={{ marginRight: '0.25rem' }} />
                    {role.completionPercentage}% complete
                  </div>
                </div>

                {role.lastRun && (
                  <div style={{ display: 'flex', alignItems: 'center', color: '#95a5a6', fontSize: '0.875rem' }}>
                    <Clock size={16} style={{ marginRight: '0.25rem' }} />
                    Last run: {formatLastRun(role.lastRun)}
                  </div>
                )}

                {/* Completion Progress Bar */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ 
                    background: '#ecf0f1', 
                    borderRadius: '4px', 
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      background: getCompletionColor(role.completionPercentage),
                      height: '100%',
                      width: `${role.completionPercentage}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ 
                    marginTop: '0.25rem', 
                    fontSize: '0.75rem', 
                    color: '#7f8c8d',
                    textTransform: 'uppercase',
                    fontWeight: '500'
                  }}>
                    Status: {role.status === 'NOT_STARTED' ? 'Ready to start' : role.status.toLowerCase()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              {!role.hasResumes ? (
                <button 
                  className="btn btn-secondary" 
                  disabled
                  style={{ display: 'flex', alignItems: 'center', opacity: 0.6 }}
                >
                  <FileText size={16} style={{ marginRight: '0.5rem' }} />
                  No Resumes Available
                </button>
              ) : role.completionPercentage === 100 ? (
                <button 
                  className="btn" 
                  onClick={() => navigate(`/run/${role.id}/results`)}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <TrendingUp size={16} style={{ marginRight: '0.5rem' }} />
                  View Results
                </button>
              ) : (
                <button 
                  className="btn" 
                  onClick={() => handleStart(role)}
                  disabled={starting === role.id}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Play size={16} style={{ marginRight: '0.5rem' }} />
                  {starting === role.id ? 'Starting...' : role.completionPercentage > 0 ? 'Continue' : 'Start'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: '#f8f9fa', marginTop: '2rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>How it works</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <strong>1. Start Process</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.875rem' }}>
              Click Start to begin processing resumes for the selected role
            </p>
          </div>
          <div>
            <strong>2. Monitor Progress</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.875rem' }}>
              Watch the extraction and grading phases complete in real-time
            </p>
          </div>
          <div>
            <strong>3. View Results</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.875rem' }}>
              See ranked candidates with scores and detailed reasons
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
