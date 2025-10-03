@echo off
echo Starting Local IDP-First Workflow Test
echo ======================================

echo.
echo 1. Starting Backend API...
start "Backend API" cmd /k "cd api && npm run dev"

echo.
echo 2. Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo 3. Running workflow test...
cd api
node test-complete-local-workflow.js

echo.
echo 4. Starting Frontend...
cd ..\web
start "Frontend" cmd /k "npm run dev"

echo.
echo ======================================
echo Local test environment is ready!
echo.
echo Backend API: http://localhost:8080
echo Frontend: http://localhost:3000 (or check the frontend window)
echo.
echo The workflow test has populated the database with sample data.
echo You can now interact with the frontend to see the dynamic job cards.
echo.
pause
