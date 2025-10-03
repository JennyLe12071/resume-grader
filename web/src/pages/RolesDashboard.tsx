import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, TrendingUp, RefreshCw } from 'lucide-react';

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
  isUploaded?: boolean;
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
      setLoading(true);
      // Fetch jobs from the API - these are dynamically created by IDP processing
      const jobsResponse = await fetch('/api/jobs');
      
      if (!jobsResponse.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const jobsData = await jobsResponse.json();
      console.log('Fetched jobs data:', jobsData);
      
      // Filter to show only the 2 main jobs we want to display
      const mainJobs = jobsData.filter((job: any) => 
        job.externalJobRef === 'Business_Development_Manager' || 
        job.externalJobRef === 'PRODUCT_MANAGER_002'
      );

      // Convert jobs to role format for display
      const dynamicRoles = mainJobs.map((job: any) => {
        // Customize the Product Manager job to make it more interesting
        let title = job.title || `Job ${job.externalJobRef}`;
        let description = job.description || 'No description available';
        
        if (job.externalJobRef === 'PRODUCT_MANAGER_002') {
          title = 'Senior Product Manager';
          description = 'Lead product strategy and roadmap development for our flagship platform. Drive cross-functional teams to deliver innovative solutions that meet customer needs and business objectives.';
        }
        
        return {
          id: job.jobId,
          title,
          jobNumber: job.externalJobRef,
          description,
          completionPercentage: job.status === 'READY' ? 100 : job.completedCount > 0 ? Math.round((job.completedCount / job.resumeCount) * 100) : 0,
          status: job.status,
          lastRun: job.createdAt,
          resumeCount: job.resumeCount || 0,
          jdCount: 1,
          hasDocuments: true,
          hasResumes: (job.resumeCount || 0) > 0,
          isUploaded: true // All jobs are now IDP-processed
        };
      });
      
      console.log('Dynamic roles:', dynamicRoles);
      setRoles(dynamicRoles);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchRoles();
  };

  const handleStart = async (role: Role) => {
    setStarting(role.id);
    
    try {
      // If job is already completed, navigate directly to rankings
      if (role.completionPercentage > 0) {
        console.log('Job already completed, navigating to rankings:', role.id);
        navigate(`/run/${role.id}/results`);
        return;
      }

      // Step 1: Trigger MuleSoft IDP processing
      console.log('Triggering IDP processing for job:', role.jobNumber);
      const idpResponse = await fetch('/api/idp/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalJobRef: role.jobNumber,
          jdFolderPath: `/sharepoint/jobs/${role.jobNumber}/jd`,
          resumeFolderPath: `/sharepoint/jobs/${role.jobNumber}/resumes`
        })
      });

      if (!idpResponse.ok) {
        throw new Error('Failed to trigger IDP processing');
      }

      const idpData = await idpResponse.json();
      console.log('IDP processing triggered:', idpData);

      // Step 2: Wait a moment for IDP to process, then check job status
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Get the job ID and navigate to status page
      const jobResponse = await fetch('/api/jobs');
      const jobsData = await jobResponse.json();
      const job = jobsData.find((j: any) => j.jobId === role.id);
      
      if (job) {
        navigate(`/run/${job.jobId}`);
      } else {
        throw new Error('Job not found after IDP processing');
      }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Roles Dashboard</h2>
          <button 
            onClick={handleRefresh}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
        <p>Upload files to SharePoint folders, then refresh to see job cards. Click Start to begin processing.</p>
        <p style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
          Showing {roles.length} jobs from SharePoint
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', maxWidth: '1200px', margin: '0 auto' }}>
        {roles.map((role) => (
          <div key={role.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '280px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                  {role.title}
                </h3>
                <p style={{ 
                  color: '#7f8c8d', 
                  margin: '0 0 1rem 0',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  height: '3.6rem', // Fixed height for 2 lines of text
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {role.description}
                </p>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#7f8c8d', fontSize: '0.875rem' }}>
                    Job #{role.jobNumber}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: role.hasResumes ? '#27ae60' : '#e74c3c', fontSize: '0.875rem' }}>
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

            {/* Button area - always at bottom */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '1rem' }}>
              {!role.hasResumes ? (
                <button 
                  className="btn btn-secondary" 
                  disabled
                  style={{ display: 'flex', alignItems: 'center', opacity: 0.6 }}
                >
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
                  {starting === role.id ? 'Starting...' : role.completionPercentage > 0 ? 'View Results' : 'Start'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: '#f8f9fa', marginTop: '3rem', maxWidth: '1200px', margin: '3rem auto 0 auto' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>How it works</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <strong>1. Upload Files</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.875rem' }}>
              Upload job descriptions and resumes to SharePoint folders
            </p>
          </div>
          <div>
            <strong>2. Refresh Page</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.875rem' }}>
              Click Refresh to see new job cards from SharePoint uploads
            </p>
          </div>
          <div>
            <strong>3. Start Grading</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.875rem' }}>
              Click Start to begin AI-powered resume grading and ranking
            </p>
          </div>
          <div>
            <strong>4. View Results</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.875rem' }}>
              See ranked candidates with scores and detailed reasons
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
