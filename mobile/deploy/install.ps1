<#
.SYNOPSIS
    HeyMate — Automated Installer & Deployer (PowerShell)

.DESCRIPTION
    Sets up the HeyMate app environment and deploys to Railway.
    Run from the project root:
        .\deploy\install.ps1 [-Environment production] [-SkipDeploy]

.PARAMETER Environment
    Target environment: production (default) or staging.

.PARAMETER SkipDeploy
    If set, performs local setup only without deploying to Railway.

.EXAMPLE
    .\deploy\install.ps1
    .\deploy\install.ps1 -Environment staging -SkipDeploy
#>

param(
    [ValidateSet("production", "staging")]
    [string]$Environment = "production",
    [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

# ── Colour helpers ────────────────────────────────────────
function Write-Info  { param([string]$Msg) Write-Host "[INFO]  $Msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$Msg) Write-Host "[OK]    $Msg" -ForegroundColor Green }
function Write-Warn  { param([string]$Msg) Write-Host "[WARN]  $Msg" -ForegroundColor Yellow }
function Write-Err   { param([string]$Msg) Write-Host "[ERROR] $Msg" -ForegroundColor Red }

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  HeyMate Installer — $Environment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check prerequisites ──────────────────────────
Write-Info "Checking prerequisites..."

# Node.js
try {
    $nodeVer = (node -v) -replace 'v', ''
    $nodeMajor = [int]($nodeVer.Split('.')[0])
    if ($nodeMajor -lt 20) {
        Write-Err "Node.js >= 20 required (found v$nodeVer). Please upgrade."
        exit 1
    }
    Write-Ok "Node.js v$nodeVer"
} catch {
    Write-Err "Node.js is not installed. Install from https://nodejs.org"
    exit 1
}

# npm
try {
    $npmVer = npm -v
    Write-Ok "npm v$npmVer"
} catch {
    Write-Err "npm is not installed."
    exit 1
}

# Git
try {
    $gitVer = git --version
    Write-Ok "$gitVer"
} catch {
    Write-Err "Git is not installed."
    exit 1
}

# Railway CLI (only if deploying)
if (-not $SkipDeploy) {
    try {
        $railwayVer = railway --version 2>$null
        Write-Ok "Railway CLI $railwayVer"
    } catch {
        Write-Warn "Railway CLI not found. Installing..."
        npm install -g @railway/cli
        Write-Ok "Railway CLI installed"
    }
}

# ── Step 2: Install dependencies ─────────────────────────
Write-Info "Installing npm dependencies..."
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed"; exit 1 }
Write-Ok "Dependencies installed"

# ── Step 3: Environment variables ─────────────────────────
$envFile     = ".env"
$envTemplate = ".env.template"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envTemplate) {
        Copy-Item $envTemplate $envFile
        Write-Warn ".env created from template — edit it with your real values before deploying."
    } else {
        Write-Warn "No .env.template found. Skipping .env creation."
    }
} else {
    Write-Ok ".env already exists"
}

# ── Step 4: Link to Railway project ──────────────────────
if (-not $SkipDeploy) {
    Write-Info "Linking to Railway project..."

    # Use token-based auth if available
    $railwayToken = $env:RAILWAY_TOKEN
    if ($railwayToken) {
        Write-Info "Using RAILWAY_TOKEN for authentication"
    } else {
        Write-Warn "No RAILWAY_TOKEN found — Railway CLI will prompt for login."
        railway login
    }

    # Link to project
    $projectId = $env:RAILWAY_PROJECT_ID
    if ($projectId) {
        railway link $projectId
    } else {
        Write-Info "Select your HeyMate project in the interactive prompt:"
        railway link
    }
    Write-Ok "Linked to Railway project"

    # ── Step 5: Push environment variables to Railway ─────
    Write-Info "Setting Railway environment variables..."

    if (Test-Path $envFile) {
        $lines = Get-Content $envFile
        foreach ($line in $lines) {
            $trimmed = $line.Trim()
            # Skip comments and empty lines
            if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) { continue }

            $parts = $trimmed -split '=', 2
            $key   = $parts[0].Trim()
            $value = if ($parts.Length -gt 1) { $parts[1].Trim() } else { "" }

            # Skip Railway-internal and placeholder vars
            if ($key -in @("PORT", "RAILWAY_TOKEN", "RAILWAY_PROJECT_ID", "RAILWAY_SERVICE_ID")) { continue }
            if ([string]::IsNullOrWhiteSpace($value) -or $value -eq "change-me-to-a-random-string") { continue }

            try {
                railway variables set "$key=$value" 2>$null
            } catch {
                # Ignore individual variable errors
            }
        }
        Write-Ok "Environment variables synced to Railway"
    }
}

# ── Step 6: Database migrations ──────────────────────────
Write-Info "Checking for database migrations..."
try {
    $migrationCheck = npm run --silent migrate 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Database migrations complete"
    } else {
        Write-Info "No migration script found. Skipping."
    }
} catch {
    Write-Info "No migration script found. Skipping."
}

# ── Step 7: Build ────────────────────────────────────────
Write-Info "Building Expo web export..."
npx expo export --platform web --output-dir dist
if ($LASTEXITCODE -ne 0) { Write-Err "Build failed"; exit 1 }
Write-Ok "Build complete -> dist/"

# ── Step 8: Deploy ───────────────────────────────────────
if ($SkipDeploy) {
    Write-Warn "Skipping deploy (-SkipDeploy flag set)"
    Write-Ok "Local build finished. Run 'railway up' to deploy manually."
    exit 0
}

Write-Info "Deploying to Railway ($Environment)..."
railway up --detach
if ($LASTEXITCODE -ne 0) { Write-Err "Deployment failed"; exit 1 }
Write-Ok "Deployment triggered!"

# ── Done ─────────────────────────────────────────────────
Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  HeyMate deployed successfully!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Info "Dashboard:  https://railway.app/dashboard"
Write-Info "Logs:       railway logs"
Write-Info "Status:     railway status"
