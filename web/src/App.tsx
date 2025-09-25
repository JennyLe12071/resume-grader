import { Routes, Route } from 'react-router-dom'
import { RolesDashboard } from './pages/RolesDashboard'
import { RunStatus } from './pages/RunStatus'
import { RunRankings } from './pages/RunRankings'

function App() {
  return (
    <div className="container">
      <div className="header">
        <h1>Resume Grader v1</h1>
        <p>AI-powered resume screening and ranking system</p>
      </div>
      
      <Routes>
        <Route path="/" element={<RolesDashboard />} />
        <Route path="/run/:jobId" element={<RunStatus />} />
        <Route path="/run/:jobId/results" element={<RunRankings />} />
      </Routes>
    </div>
  )
}

export default App



