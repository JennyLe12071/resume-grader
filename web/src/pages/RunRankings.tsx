import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Star, RotateCcw } from 'lucide-react';

interface RankingResult {
  resume_doc_id: string;
  candidate: string;
  score: number;
  reasons: string[];
}

interface JobResults {
  job_id: string;
  ranked: RankingResult[];
}

export function RunRankings() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<JobResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number>(0);

  useEffect(() => {
    if (jobId) {
      setLoading(true);
      setError(null);
      // Small delay to ensure route is fully loaded
      const timer = setTimeout(() => {
        fetchResults();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [jobId]);

  const fetchResults = async () => {
    if (!jobId) {
      setError('No job ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching results for jobId:', jobId);
      const response = await fetch(`/api/jobs/${jobId}/results`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch results: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Results data:', data);
      setResults(data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    console.log('Retry button clicked');
    setLoading(true);
    setError(null);
    fetchResults();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const filteredResults = results?.ranked.filter(result => result.score >= minScore) || [];

  const handleRerun = async () => {
    if (!jobId) return;
    
    try {
      console.log('Starting re-run for job:', jobId);
      setLoading(true);
      setError(null);
      
      // Call the API to restart the job
      const response = await fetch(`/api/jobs/${jobId}/rerun`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to start re-run');
      }
      
      // Navigate to the job status page to monitor progress
      navigate(`/run/${jobId}`);
    } catch (err) {
      console.error('Re-run error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start re-run');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p>Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="card">
        <div className="error">
          {error || 'Failed to load rankings'}
          
          {/* Debug Info */}
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#f8f9fa', 
            borderRadius: '4px',
            fontSize: '0.875rem',
            color: '#6c757d'
          }}>
            <strong>Debug Info:</strong><br/>
            Job ID: {jobId || 'Not set'}<br/>
            Loading: {loading ? 'Yes' : 'No'}<br/>
            Error: {error || 'None'}<br/>
            Results: {results ? 'Loaded' : 'Not loaded'}
          </div>
          
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={handleRetry}
              className="btn btn-secondary"
            >
              Retry
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Back to Roles
            </button>
          </div>
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
        <h2>Resume Rankings</h2>
        <p>Job {jobId} - {results.ranked.length} candidates ranked</p>
      </div>

      {/* Filters and Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} />
              <label htmlFor="minScore" style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                Min Score:
              </label>
              <input
                id="minScore"
                type="number"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                style={{
                  width: '80px',
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
              Showing {filteredResults.length} of {results.ranked.length} candidates
            </div>
          </div>
          
          <button 
            className="btn btn-secondary"
            onClick={handleRerun}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <RotateCcw size={16} style={{ marginRight: '0.5rem' }} />
            {loading ? 'Starting Re-run...' : 'Re-run Job'}
          </button>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Candidate</th>
                <th>Score</th>
                <th>Top Reasons</th>
                <th>Resume ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => (
                <tr key={result.resume_doc_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '500', color: '#2c3e50' }}>
                        #{index + 1}
                      </span>
                      {index < 3 && (
                        <Star size={16} style={{ color: '#f39c12' }} />
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500', color: '#2c3e50' }}>
                      {result.candidate}
                    </div>
                  </td>
                  <td>
                    <div 
                      className={`score ${getScoreClass(result.score)}`}
                      style={{ 
                        color: getScoreColor(result.score),
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}
                    >
                      {result.score}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {result.reasons.map((reason, reasonIndex) => (
                        <div key={reasonIndex} className="reason-item">
                          {reason}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <code style={{ 
                      background: '#f8f9fa', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      color: '#6c757d'
                    }}>
                      {result.resume_doc_id}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredResults.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            <p>No candidates meet the minimum score requirement of {minScore}</p>
            <button 
              className="btn btn-secondary"
              onClick={() => setMinScore(0)}
              style={{ marginTop: '1rem' }}
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="card" style={{ background: '#f8f9fa', marginTop: '2rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Summary Statistics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
              {results.ranked.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Total Candidates</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>
              {results.ranked.filter(r => r.score >= 80).length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>High Scores (80+)</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
              {results.ranked.filter(r => r.score >= 60 && r.score < 80).length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Good Scores (60-79)</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
              {results.ranked.filter(r => r.score < 60).length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Low Scores (&lt;60)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
