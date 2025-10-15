# Resume Grader System

AI-powered resume grading system that automatically scores and ranks job candidates against specific job descriptions.

##  Quick Start

### 1. Configure API Keys
Copy `api/env.example` to `api/.env` and add your API keys:
```bash
# IDP Configuration
IDP_BASE_URL=https://your-idp-endpoint.com
IDP_API_KEY=your-idp-api-key

# OpenAI Configuration  
OPENAI_API_KEY=sk-proj-your-openai-key-here

# Database
DATABASE_URL="file:./dev.db"
```

### 2. Start the System
```bash
# Start API server
cd api
npm install
npm start

# Start frontend (in new terminal)
cd web
npm install
npm start
```

### 3. Run Jobs
1. Open http://localhost:5173
2. Click "Run Job" on any job card
3. Watch real-time progress tracking
4. View ranked results when complete

## 📊 Current Data
- **6 Jobs** ready to process
- **54 Documents** stored (7 JDs + 47 resumes)
- **Real-time progress** tracking with 3 phases
- **AI-powered grading** with detailed reasoning

##  Architecture
- **Frontend**: React + Vite with real-time updates
- **Backend**: Node.js + Express API
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI GPT-4 for resume grading
- **Parsing**: MuleSoft IDP for document extraction

##  Project Structure
```
├── api/                 # Backend API server
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── adapters/    # Data transformation
│   └── prisma/          # Database schema
├── web/                 # Frontend React app
│   └── src/
│       ├── pages/       # React components
│       └── services/    # API client
└── README.md
```

## 🔧 API Endpoints
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id/status` - Job processing status
- `GET /api/jobs/:id/results` - Job rankings

##  Ready for Production
The system is fully functional and ready to process your real documents with IDP and OpenAI integration.
