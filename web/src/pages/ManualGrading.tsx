import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText } from 'lucide-react';

export function ManualGrading() {
  const navigate = useNavigate();
  const [jobJson, setJobJson] = useState('');
  const [resumeJson, setResumeJson] = useState('');
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async () => {
    if (!jobJson.trim() || !resumeJson.trim()) {
      setError('Please provide both Job Description JSON and Resume JSON');
      return;
    }

    setGrading(true);
    setError(null);
    setResult(null);

    try {
      // Parse JSONs to validate
      const jobData = JSON.parse(jobJson);
      const resumeData = JSON.parse(resumeJson);

      // Call the grading API
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobData,
          resumeData: resumeData
        })
      });

      if (!response.ok) {
        throw new Error('Grading failed');
      }

      const gradeResult = await response.json();
      setResult(gradeResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON or grading failed');
    } finally {
      setGrading(false);
    }
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
        <h2>Manual Grading</h2>
        <p>Paste Job Description JSON and Resume JSON to get AI-powered grading results</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Job Description JSON */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
            <FileText size={20} style={{ marginRight: '0.5rem' }} />
            Job Description JSON
          </h3>
          <p style={{ marginTop: 0, color: '#7f8c8d', fontSize: '0.875rem' }}>
            Paste the parsed MuleSoft IDP JSON for the job description
          </p>
          <textarea
            value={jobJson}
            onChange={(e) => setJobJson(e.target.value)}
            placeholder='{"title": "Software Engineer", "requirements": ["JavaScript", "React"], "description": "..."}'
            style={{ 
              width: '100%', 
              minHeight: '200px', 
              fontFamily: 'monospace', 
              fontSize: '0.9rem', 
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Resume JSON */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
            <FileText size={20} style={{ marginRight: '0.5rem' }} />
            Resume JSON
          </h3>
          <p style={{ marginTop: 0, color: '#7f8c8d', fontSize: '0.875rem' }}>
            Paste the parsed MuleSoft IDP JSON for the resume
          </p>
          <textarea
            value={resumeJson}
            onChange={(e) => setResumeJson(e.target.value)}
            placeholder='{"name": "John Doe", "email": "john@example.com", "skills": ["JavaScript", "React"], "experience": [...]}'
            style={{ 
              width: '100%', 
              minHeight: '200px', 
              fontFamily: 'monospace', 
              fontSize: '0.9rem', 
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            className="btn" 
            onClick={handleGrade} 
            disabled={grading || !jobJson.trim() || !resumeJson.trim()}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Upload size={16} style={{ marginRight: '0.5rem' }} />
            {grading ? 'Grading...' : 'Grade Resume'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setJobJson('');
              setResumeJson('');
              setResult(null);
              setError(null);
            }}
            disabled={grading}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card">
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50' }}>Grading Results</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
            <div 
              className={`score ${getScoreClass(result.finalScore)}`}
              style={{ 
                fontSize: '4rem', 
                color: getScoreColor(result.finalScore),
                fontWeight: 'bold',
                marginRight: '2rem'
              }}
            >
              {result.finalScore}
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Top Reasons</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.topReasons?.map((reason: string, index: number) => (
                  <div key={index} className="reason-item">
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Raw Result JSON */}
          <details style={{ marginTop: '2rem' }}>
            <summary style={{ cursor: 'pointer', color: '#7f8c8d', marginBottom: '1rem' }}>
              View Raw JSON Result
            </summary>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem',
              color: '#2c3e50'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Example JSON */}
      <div className="card" style={{ background: '#f8f9fa' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Example JSON Format</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <strong>Job Description JSON:</strong>
            <pre style={{ 
              background: 'white', 
              padding: '0.75rem', 
              borderRadius: '4px',
              fontSize: '0.8rem',
              marginTop: '0.5rem',
              overflow: 'auto'
            }}>
{`{
  "title": "Senior Software Engineer",
  "requirements": [
    "5+ years JavaScript/TypeScript",
    "React and Node.js experience",
    "Database knowledge"
  ],
  "description": "We are looking for..."
}`}
            </pre>
          </div>
          <div>
            <strong>Resume JSON:</strong>
            <pre style={{ 
              background: 'white', 
              padding: '0.75rem', 
              borderRadius: '4px',
              fontSize: '0.8rem',
              marginTop: '0.5rem',
              overflow: 'auto'
            }}>
{`{
  "name": "John Doe",
  "email": "john@example.com",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": [
    {"title": "Software Engineer", "years": 6}
  ],
  "education": [
    {"degree": "BS", "field": "Computer Science"}
  ]
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
