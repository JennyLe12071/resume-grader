Write-Host "Starting Local IDP-First Workflow Test" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

Write-Host "`n1. Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; npm run dev"

Write-Host "`n2. Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n3. Running workflow test..." -ForegroundColor Yellow
Set-Location api
node test-complete-local-workflow.js

Write-Host "`n4. Starting Frontend..." -ForegroundColor Yellow
Set-Location ..\web
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "`n======================================" -ForegroundColor Green
Write-Host "Local test environment is ready!" -ForegroundColor Green
Write-Host "`nBackend API: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000 (or check the frontend window)" -ForegroundColor Cyan
Write-Host "`nThe workflow test has populated the database with sample data." -ForegroundColor White
Write-Host "You can now interact with the frontend to see the dynamic job cards." -ForegroundColor White
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
