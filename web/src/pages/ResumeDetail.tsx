import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resumesApi } from '../services/api';
import { Resume } from '../types';
import { ArrowLeft, Download, User, Mail, Phone, GraduationCap, Briefcase, Star } from 'lucide-react';

export function ResumeDetail() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idpInput, setIdpInput] = useState<string>('');
  const [idpUploading, setIdpUploading] = useState<boolean>(false);
  const [idpError, setIdpError] = useState<string | null>(null);

  useEffect(() => {
    if (resumeId) {
      loadResume();
    }
  }, [resumeId]);

  const loadResume = async () => {
    try {
      setLoading(true);
      setError(null);
      const resumeData = await resumesApi.getById(resumeId!);
      setResume(resumeData);
    } catch (err) {
      setError('Failed to load resume details');
      console.error('Error loading resume:', err);
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

  const handleUploadIdp = async () => {
    if (!resumeId) return;
    setIdpError(null);
    setIdpUploading(true);
    try {
      let payload: unknown = {};
      try {
        payload = JSON.parse(idpInput || '{}');
      } catch (e) {
        setIdpError('Invalid JSON');
        setIdpUploading(false);
        return;
      }
      await resumesApi.uploadIdp(resumeId, payload);
      await loadResume();
      setIdpInput('');
    } catch (e: any) {
      setIdpError(e?.message || 'Failed to upload IDP JSON');
    } finally {
      setIdpUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p>Loading resume details...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="card">
        <div className="error">
          {error || 'Resume not found'}
          <button onClick={() => navigate('/')} style={{ marginLeft: '1rem' }}>
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const idpData = resume.idpJson as any;
  const gradeData = resume.gradeJson as any;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate(`/jobs/${resume.jobId}/rankings`)} 
          className="btn btn-secondary"
          style={{ marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
          Back to Rankings
        </button>
        <h2>Resume Details</h2>
        <p><strong>{resume.filename}</strong></p>
      </div>

      {/* Status and Score */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Processing Status</h3>
            <span className={`file-status status-${resume.status.toLowerCase().replace('_', '-')}`}>
              {resume.status.replace('_', ' ')}
            </span>
          </div>
          {gradeData?.finalScore !== undefined && (
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Final Score</h3>
              <div 
                className={`score ${getScoreClass(gradeData.finalScore)}`}
                style={{ 
                  fontSize: '2rem', 
                  color: getScoreColor(gradeData.finalScore),
                  fontWeight: 'bold'
                }}
              >
                {gradeData.finalScore}
              </div>
            </div>
          )}
        </div>

        {resume.errorText && (
          <div className="error">
            <strong>Error:</strong> {resume.errorText}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <a
            href={`/api/resumes/${resume.resumeId}/pdf`}
            download={resume.filename}
            className="btn"
          >
            <Download size={16} style={{ marginRight: '0.5rem' }} />
            Download PDF
          </a>
        </div>
      </div>

      {/* Extracted Information */}
      {idpData && (
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50' }}>Extracted Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Contact Information */}
            <div>
              <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
                <User size={20} style={{ marginRight: '0.5rem' }} />
                Contact
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} style={{ marginRight: '0.5rem', color: '#7f8c8d' }} />
                  {idpData.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Phone size={16} style={{ marginRight: '0.5rem', color: '#7f8c8d' }} />
                  {idpData.phone}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {idpData.skills?.map((skill: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      background: '#ecf0f1',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      color: '#2c3e50'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Education */}
            {idpData.education && idpData.education.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
                  <GraduationCap size={20} style={{ marginRight: '0.5rem' }} />
                  Education
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {idpData.education.map((edu: any, index: number) => (
                    <div key={index} style={{ padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontWeight: '500', color: '#2c3e50' }}>
                        {edu.degree} in {edu.field}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {idpData.experience && idpData.experience.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
                  <Briefcase size={20} style={{ marginRight: '0.5rem' }} />
                  Experience
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {idpData.experience.map((exp: any, index: number) => (
                    <div key={index} style={{ padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontWeight: '500', color: '#2c3e50' }}>
                        {exp.title}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                        {exp.years} years of experience
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Text */}
          {idpData.fullText && (
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Extracted Text</h4>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                color: '#2c3e50'
              }}>
                {idpData.fullText}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual IDP JSON Upload */}
      <div className="card">
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Provide IDP JSON Manually</h3>
        <p style={{ marginTop: 0, color: '#7f8c8d' }}>Paste the parsed MuleSoft IDP JSON for this resume. This will trigger grading.</p>
        <textarea
          value={idpInput}
          onChange={(e) => setIdpInput(e.target.value)}
          placeholder='{"name":"...","email":"...", ... }'
          style={{ width: '100%', minHeight: '160px', fontFamily: 'monospace', fontSize: '0.9rem', padding: '0.75rem' }}
        />
        {idpError && (
          <div className="error" style={{ marginTop: '0.75rem' }}>{idpError}</div>
        )}
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={handleUploadIdp} disabled={idpUploading}>
            {idpUploading ? 'Submitting...' : 'Submit IDP JSON'}
          </button>
          <button className="btn btn-secondary" onClick={() => setIdpInput('')} disabled={idpUploading}>Clear</button>
        </div>
      </div>

      {/* Grading Results */}
      {gradeData && (
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
            <Star size={20} style={{ marginRight: '0.5rem' }} />
            Grading Results
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div 
              className={`score ${getScoreClass(gradeData.finalScore)}`}
              style={{ 
                fontSize: '3rem', 
                color: getScoreColor(gradeData.finalScore),
                fontWeight: 'bold',
                marginRight: '2rem'
              }}
            >
              {gradeData.finalScore}
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Top Reasons</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {gradeData.topReasons?.map((reason: string, index: number) => (
                  <div key={index} className="reason-item">
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Information */}
      <div className="card" style={{ background: '#f8f9fa' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Job Context</h4>
        <p style={{ margin: 0, color: '#7f8c8d' }}>
          This resume was evaluated for: <strong>{resume.jobId}</strong>
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Link to={`/jobs/${resume.jobId}/rankings`} className="btn btn-secondary">
            View All Rankings
          </Link>
        </div>
      </div>
    </div>
  );
}



