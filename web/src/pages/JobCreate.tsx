import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';

export function JobCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    jobDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.jobDescription.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await jobsApi.create(formData);
      navigate(`/run/${response.jobId}`);
    } catch (err) {
      setError('Failed to create job. Please try again.');
      console.error('Error creating job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        <h2>Create New Job</h2>
        <p>Define the job requirements to start grading resumes</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="jobDescription">Job Description *</label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              placeholder="Describe the role, requirements, and responsibilities..."
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading" style={{ marginRight: '0.5rem' }}></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} style={{ marginRight: '0.5rem' }} />
                  Create Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ background: '#f8f9fa' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Tips for better results:</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#7f8c8d' }}>
          <li>Be specific about required skills and technologies</li>
          <li>Include years of experience requirements</li>
          <li>Mention preferred educational background</li>
          <li>Describe key responsibilities and expectations</li>
        </ul>
      </div>
    </div>
  );
}



