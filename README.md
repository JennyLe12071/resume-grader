# Resume Grader v0.1

A web application for batch processing and AI-powered grading of resumes against job requirements.

## Features

- **Batch PDF Upload**: Upload multiple PDF resumes at once
- **AI Processing**: Extract information using MuleSoft IDP
- **Smart Grading**: Grade resumes against job requirements using LLM
- **Ranked Results**: View resumes sorted by match score
- **Detailed Insights**: See top reasons for each score

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (MVP) with Prisma ORM
- **Storage**: Local filesystem
- **Integrations**: MuleSoft IDP + External LLM API

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp api/env.example api/.env
   # Edit api/.env with your API keys
   ```

4. Initialize the database:
   ```bash
   cd api
   npm run db:push
   npm run db:seed
   ```

5. Start the development servers:
   ```bash
   npm run dev
   ```

This will start:
- API server on http://localhost:8080
- Web app on http://localhost:3000

### Using Docker

```bash
docker-compose up --build
```

## API Configuration

### MuleSoft IDP
Set these environment variables in `api/.env`:
- `IDP_BASE_URL`: Your MuleSoft IDP endpoint
- `IDP_API_KEY`: Your IDP API key

### LLM API
Set these environment variables in `api/.env`:
- `LLM_BASE_URL`: Your LLM API endpoint (e.g., OpenAI)
- `LLM_API_KEY`: Your LLM API key

### Development Mode
If no API keys are provided, the application will use mock data for development.

## Usage

1. **Create a Job**: Define job title and requirements
2. **Upload Resumes**: Drag and drop multiple PDF files
3. **View Rankings**: See resumes ranked by match score
4. **Review Details**: Click on any resume for detailed analysis

## API Endpoints

### Jobs
- `POST /api/jobs` - Create a new job
- `GET /api/jobs/:jobId/rankings` - Get ranked resumes
- `POST /api/jobs/:jobId/resumes` - Upload resumes

### Resumes
- `GET /api/resumes/:resumeId` - Get resume details
- `GET /api/resumes/:resumeId/pdf` - Download PDF

## Data Models

### Job
```typescript
{
  jobId: string;
  title: string;
  jobDescription: string;
  createdAt: string;
}
```

### Resume
```typescript
{
  resumeId: string;
  jobId: string;
  filename: string;
  status: 'PENDING' | 'FAILED_IDP' | 'FAILED_GRADER' | 'DONE';
  errorText?: string;
  idpJson?: IdpResult;
  gradeJson?: GradeResult;
}
```

## Development

### Project Structure
```
resume-grader/
├── api/                 # Backend API
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── services/    # External integrations
│   │   └── index.ts     # Main server file
│   └── prisma/          # Database schema
├── web/                 # Frontend React app
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── services/    # API client
│   │   └── types/       # TypeScript types
└── storage/             # File storage
```

### Available Scripts

- `npm run dev` - Start both API and web in development mode
- `npm run build` - Build both applications
- `npm run dev:api` - Start only the API server
- `npm run dev:web` - Start only the web app

## Error Handling

The application handles various error scenarios:
- Invalid PDF files
- IDP processing failures
- LLM grading errors
- Network timeouts

Failed resumes are marked with appropriate error status and can be downloaded as JSON for debugging.

## Next Steps

After MVP completion:
- Progress websockets for real-time updates
- Retry mechanisms for failed processing
- PostgreSQL + S3 storage
- Simple authentication
- Pagination for large datasets
- CSV export functionality

## License

MIT



