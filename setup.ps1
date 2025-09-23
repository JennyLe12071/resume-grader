# Resume Grader Setup Script for Windows PowerShell (ASCII-safe)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "Setting up Resume Grader v0.1..."

function Invoke-Tool {
    param(
        [Parameter(Mandatory=$true)][string]$FileName,
        [Parameter(Mandatory=$true)][string[]]$Args
    )
    # Prefer .cmd on Windows to avoid PowerShell execution-policy shim issues
    $cmd = $FileName
    if ($FileName -eq 'npm' -or $FileName -eq 'npx') { $cmd = "$FileName.cmd" }
    & $cmd @Args
}

# --- Check Node.js ---
try {
    $nodeVersion = (& node --version) 2>$null
    if (-not $nodeVersion) { throw "Node.js not found" }
    # Require v20+
    $ver = $nodeVersion.TrimStart('v')
    if ([version]$ver -lt [version]'20.0.0') {
        throw "Node.js $nodeVersion found, but version 20+ is required."
    }
    Write-Host "Node.js found: $nodeVersion"
}
catch {
    Write-Host "Node.js not found or too old. Please install Node.js 20+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# --- Root deps ---
Write-Host "Installing root dependencies..."
Invoke-Tool npm @('install')

# --- API deps ---
Write-Host "Installing API dependencies..."
Push-Location -Path 'api'
Invoke-Tool npm @('install')
Pop-Location

# --- Web deps ---
Write-Host "Installing Web dependencies..."
Push-Location -Path 'web'
Invoke-Tool npm @('install')
Pop-Location

# --- .env bootstrap ---
if (-not (Test-Path 'api/.env')) {
    Write-Host "Creating api/.env from api/env.example..."
    if (-not (Test-Path 'api/env.example')) {
        Write-Host "Warning: api/env.example not found. Creating an empty api/.env." -ForegroundColor Yellow
        New-Item -ItemType File -Path 'api/.env' | Out-Null
    } else {
        Copy-Item 'api/env.example' 'api/.env'
    }
    Write-Host "Created api/.env - please edit with your API keys"
} else {
    Write-Host "api/.env already exists"
}

# --- Initialize DB ---
Write-Host "Initializing database..."
Push-Location -Path 'api'
Invoke-Tool npx @('prisma','generate')
Invoke-Tool npx @('prisma','db','push')
# If you don't have a seed script, comment the next line out or define "db:seed" in api/package.json
Invoke-Tool npm @('run','db:seed')
Pop-Location

Write-Host ""
Write-Host "Setup complete!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1) Edit api/.env with your API keys (optional for dev)"
Write-Host "2) Run: npm run dev   (from repo root) "
Write-Host "3) Open: http://localhost:3000"
Write-Host ""
Write-Host "API:    http://localhost:8080"
Write-Host "Web:    http://localhost:3000"
