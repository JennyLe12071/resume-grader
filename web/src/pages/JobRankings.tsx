import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { Job, Ranking } from '../types';
import { ArrowLeft, Eye, Download, AlertCircle, RefreshCw } from 'lucide-react';

export function JobRankings() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFailed, setShowFailed] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJob();
      loadRankings();
    }
  }, [jobId, showFailed]);

  const loadJob = async () => {
    try {
      const jobData = await jobsApi.getById(jobId!);
      setJob(jobData);
    } catch (err) {
      setError('Failed to load job details');
      console.error('Error loading job:', err);
    }
  };

  const loadRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      const rankingsData = await jobsApi.getRankings(jobId!, showFailed);
      setRankings(rankingsData);
    } catch (err) {
      setError('Failed to load rankings');
      console.error('Error loading rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreClass = (score?: number) => {
    if (!score) return '';
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const getScoreColor = (score?: number) => {
    if (!score) return '#95a5a6';
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const downloadErrors = () => {
    const failedResumes = rankings.filter(r => r.status.includes('FAILED'));
    const errorsData = {
      jobId,
      jobTitle: job?.title,
      timestamp: new Date().toISOString(),
      failedResumes: failedResumes.map(r => ({
        resumeId: r.resumeId,
        filename: r.filename,
        status: r.status,
        errorText: r.errorText
      }))
    };

    const blob = new Blob([JSON.stringify(errorsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-errors-${jobId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <h2>Resume Rankings</h2>
        <p><strong>{job.title}</strong></p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showFailed}
                onChange={(e) => setShowFailed(e.target.checked)}
              />
              Show failed resumes only
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={loadRankings}
              className="btn btn-secondary"
              disabled={loading}
              style={{ fontSize: '0.875rem' }}
            >
              <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
              Refresh
            </button>
            {showFailed && rankings.some(r => r.status.includes('FAILED')) && (
              <button
                onClick={downloadErrors}
                className="btn btn-danger"
                style={{ fontSize: '0.875rem' }}
              >
                <Download size={16} style={{ marginRight: '0.5rem' }} />
                Download Errors
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading"></div>
            <p>Loading rankings...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>No resumes found</h3>
            <p>
              {showFailed 
                ? 'No failed resumes to display' 
                : 'No completed resumes found. Resumes are pre-loaded in the system.'
              }
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Resume</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Top Reasons</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((ranking) => (
                  <tr key={ranking.resumeId}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500', color: '#2c3e50' }}>
                          {ranking.filename}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                          {ranking.resumeId}
                        </div>
                      </div>
                    </td>
                    <td>
                      {ranking.finalScore !== null ? (
                        <div 
                          className={`score ${getScoreClass(ranking.finalScore)}`}
                          style={{ color: getScoreColor(ranking.finalScore) }}
                        >
                          {ranking.finalScore}
                        </div>
                      ) : (
                        <span style={{ color: '#95a5a6' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={`file-status status-${ranking.status.toLowerCase().replace('_', '-')}`}>
                        {ranking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {ranking.topReasons && ranking.topReasons.length > 0 ? (
                        <div className="reasons">
                          {ranking.topReasons.slice(0, 3).map((reason, index) => (
                            <div key={index} className="reason-item">
                              {reason}
                            </div>
                          ))}
                        </div>
                      ) : ranking.errorText ? (
                        <div style={{ color: '#e74c3c', fontSize: '0.875rem' }}>
                          {ranking.errorText}
                        </div>
                      ) : (
                        <span style={{ color: '#95a5a6' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                          to={`/resumes/${ranking.resumeId}`}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                        >
                          <Eye size={14} />
                        </Link>
                        <a
                          href={`/api/resumes/${ranking.resumeId}/pdf`}
                          download={ranking.filename}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!showFailed && rankings.length > 0 && (
        <div className="card" style={{ background: '#f8f9fa' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Ranking Legend</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div className="score high" style={{ display: 'inline-block', marginRight: '0.5rem' }}>80+</div>
              <span>Excellent match</span>
            </div>
            <div>
              <div className="score medium" style={{ display: 'inline-block', marginRight: '0.5rem' }}>60-79</div>
              <span>Good match</span>
            </div>
            <div>
              <div className="score low" style={{ display: 'inline-block', marginRight: '0.5rem' }}>0-59</div>
              <span>Needs improvement</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



