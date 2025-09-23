# Test API endpoints

Write-Host "🧪 Testing Resume Grader API..." -ForegroundColor Green

$baseUrl = "http://localhost:8080"

# Test health endpoint
Write-Host "Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health check passed: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test create job
Write-Host "Testing job creation..." -ForegroundColor Yellow
try {
    $jobData = @{
        title = "Test Software Engineer"
        jobDescription = "Looking for a skilled software engineer with experience in React and Node.js"
    } | ConvertTo-Json

    $job = Invoke-RestMethod -Uri "$baseUrl/api/jobs" -Method POST -Body $jobData -ContentType "application/json"
    Write-Host "✅ Job created: $($job.jobId)" -ForegroundColor Green
    $jobId = $job.jobId
} catch {
    Write-Host "❌ Job creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test get rankings (should be empty)
Write-Host "Testing rankings endpoint..." -ForegroundColor Yellow
try {
    $rankings = Invoke-RestMethod -Uri "$baseUrl/api/jobs/$jobId/rankings" -Method GET
    Write-Host "✅ Rankings retrieved: $($rankings.Count) resumes" -ForegroundColor Green
} catch {
    Write-Host "❌ Rankings failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 API tests completed!" -ForegroundColor Green
Write-Host "Job ID: $jobId" -ForegroundColor Cyan
Write-Host "You can now test the web interface at http://localhost:3000" -ForegroundColor Cyan



