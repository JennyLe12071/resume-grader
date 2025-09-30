# Resume Grader API - Complete Endpoints Documentation

## 🚀 **Base URL**
```
http://localhost:8080
```

## 📋 **Complete API Endpoints**

### **1. Health Check**
```
GET /health
```
**Purpose**: Check if the API server is running
**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### **2. Jobs Management**

#### **List All Jobs**
```
GET /api/jobs
```
**Purpose**: Get all job runs with their status and resume counts
**Response**:
```json
[
  {
    "jobId": "clx012jkl345mno",
    "title": "Business Development Manager",
    "jobDescription": "Lead business development initiatives...",
    "createdAt": "2024-01-15T11:00:00Z",
    "status": "READY",
    "resumeCount": 47,
    "completedCount": 47
  }
]
```

#### **Get Available Roles**
```
GET /api/jobs/roles
```
**Purpose**: Get all available job roles with completion status
**Response**:
```json
{
  "roles": [
    {
      "id": "12345",
      "title": "Business Development Manager",
      "jobNumber": "12345",
      "description": "Lead business development initiatives...",
      "completionPercentage": 100,
      "status": "READY",
      "lastRun": "2024-01-15T11:00:00Z",
      "resumeCount": 47,
      "jdCount": 1,
      "hasDocuments": true,
      "hasResumes": true
    }
  ]
}
```

#### **Create New Job Run**
```
POST /api/jobs
Content-Type: application/json
```
**Purpose**: Start a new job grading process
**Request Body**:
```json
{
  "external_job_ref": "12345"
}
```
**Response**:
```json
{
  "job_id": "clx012jkl345mno"
}
```

#### **Get Job Details**
```
GET /api/jobs/:jobId
```
**Purpose**: Get specific job information
**Response**:
```json
{
  "jobId": "clx012jkl345mno",
  "title": "Business Development Manager",
  "jobDescription": "Lead business development initiatives...",
  "createdAt": "2024-01-15T11:00:00Z",
  "status": "READY",
  "resumeCount": 47,
  "completedCount": 47
}
```

---

### **3. Job Processing & Status**

#### **Get Job Status (Real-time Progress)**
```
GET /api/jobs/:jobId/status
```
**Purpose**: Get real-time processing status with phase breakdown
**Response**:
```json
{
  "job_id": "clx012jkl345mno",
  "external_job_ref": "12345",
  "status": "READY",
  "phases": {
    "extract_jd": "DONE",
    "extract_resumes": {
      "done": 47,
      "total": 47
    },
    "grade": {
      "done": 47,
      "total": 47
    }
  }
}
```

#### **Get Job Rankings (Display Format)**
```
GET /api/jobs/:jobId/rankings
```
**Purpose**: Get ranked results for display in UI
**Query Parameters**:
- `failed` (optional): Set to "1" to get only failed resumes
**Response**:
```json
[
  {
    "resumeId": "clx789xyz012ghi",
    "filename": "Sarah Martinez",
    "status": "DONE",
    "finalScore": 85,
    "topReasons": [
      "Strong sales experience matches job requirements",
      "Skills align well with Microsoft Office requirements"
    ]
  }
]
```

#### **Get Job Results (Export Format)**
```
GET /api/jobs/:jobId/results
```
**Purpose**: Get final results in export-friendly format
**Response**:
```json
{
  "job_id": "clx012jkl345mno",
  "ranked": [
    {
      "resume_doc_id": "clx789xyz012ghi",
      "candidate": "Sarah Martinez",
      "score": 85,
      "reasons": [
        "Strong sales experience matches job requirements",
        "Skills align well with Microsoft Office requirements"
      ]
    }
  ]
}
```

---

### **4. Resume Management (Currently Stubbed)**

#### **Upload Resumes**
```
POST /api/jobs/:jobId/resumes
Content-Type: multipart/form-data
```
**Purpose**: Upload resume files (currently returns mock response)
**Request**: Multipart form with files
**Response**:
```json
{
  "accepted": [],
  "rejected": [],
  "resumeIds": []
}
```

---

### **5. IDP Integration (Stubbed)**

#### **IDP Webhook**
```
POST /api/idp/callback
Content-Type: application/json
```
**Purpose**: Receive callbacks from MuleSoft IDP (currently stubbed)
**Response**:
```json
{
  "status": "received"
}
```

---

## 🔄 **Typical API Workflow**

### **1. Check System Health**
```
GET /health
```

### **2. Get Available Roles**
```
GET /api/jobs/roles
```

### **3. Start Job Processing**
```
POST /api/jobs
{
  "external_job_ref": "12345"
}
```

### **4. Monitor Progress (Poll Every 2-5 seconds)**
```
GET /api/jobs/{jobId}/status
```

### **5. Get Final Results**
```
GET /api/jobs/{jobId}/results
```

---

## 📊 **Status Values**

### **Job Status**
- `PENDING` - Job created, not yet started
- `PROCESSING` - Currently being processed
- `READY` - Processing complete, results available
- `ERROR` - Processing failed

### **Phase Status**
- `PENDING` - Phase not started
- `DONE` - Phase completed

---

## 🚨 **Error Responses**

### **400 Bad Request**
```json
{
  "error": "Missing required field",
  "message": "external_job_ref is required"
}
```

### **404 Not Found**
```json
{
  "error": "Job not found",
  "message": "Job with ID clx012jkl345mno does not exist"
}
```

### **500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

---

## 🧪 **Testing with Postman**

### **Environment Variables**
- `base_url`: `http://localhost:8080`
- `job_id`: `clx012jkl345mno` (example job ID)

### **Collection Structure**
1. **Health Check** - Verify server is running
2. **Get Roles** - See available job roles
3. **Create Job** - Start new job processing
4. **Check Status** - Monitor progress
5. **Get Results** - Retrieve final rankings

---

## 📝 **Notes for API Developer**

- **Database**: SQLite with Prisma ORM
- **Authentication**: None (for MVP)
- **Rate Limiting**: None (for MVP)
- **CORS**: Enabled for all origins
- **Data Format**: All responses are JSON
- **Error Handling**: Global error middleware catches all errors
- **Logging**: Console logging for debugging

---

## 🔧 **Development Setup**

1. **Install dependencies**: `npm install`
2. **Set up environment**: Copy `env.example` to `.env`
3. **Start server**: `npm run dev`
4. **Test endpoints**: Use Postman or curl
5. **Check logs**: Console output shows all requests/responses
