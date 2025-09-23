import { Routes, Route } from 'react-router-dom'
import { JobList } from './pages/JobList'
import { JobCreate } from './pages/JobCreate'
import { JobUpload } from './pages/JobUpload'
import { JobRankings } from './pages/JobRankings'
import { ResumeDetail } from './pages/ResumeDetail'

function App() {
  return (
    <div className="container">
      <div className="header">
        <h1>Resume Grader</h1>
        <p>Upload PDFs in batch, get AI-powered rankings and insights</p>
      </div>
      
      <Routes>
        <Route path="/" element={<JobList />} />
        <Route path="/jobs/new" element={<JobCreate />} />
        <Route path="/jobs/:jobId/upload" element={<JobUpload />} />
        <Route path="/jobs/:jobId/rankings" element={<JobRankings />} />
        <Route path="/resumes/:resumeId" element={<ResumeDetail />} />
      </Routes>
    </div>
  )
}

export default App



