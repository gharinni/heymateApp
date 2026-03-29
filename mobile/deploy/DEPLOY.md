# HeyMate — Deployment Guide

## Folder Structure

```
mobile/
├── .env.template                  # Environment variable template
├── .dockerignore                  # Docker build exclusions
├── Dockerfile                     # Multi-stage Docker build
├── nixpacks.toml                  # Nixpacks build config (Railway default)
├── railway.json                   # Railway deployment config
├── railwayignore                  # Railway upload exclusions
├── server.js                      # Express server (serves Expo web build)
├── package.json                   # Dependencies & scripts
├── deploy/
│   ├── install.sh                 # Bash installer (Linux/macOS)
│   └── install.ps1                # PowerShell installer (Windows)
└── .github/
    └── workflows/
        └── deploy.yml             # GitHub Actions CI/CD pipeline
```

---

## Quick Start

### Option A: Automated Installer (Recommended)

**Windows (PowerShell):**
```powershell
.\deploy\install.ps1
```

**Linux/macOS (Bash):**
```bash
chmod +x deploy/install.sh
./deploy/install.sh
```

**Flags:**
| Flag | Description |
|------|-------------|
| `--env staging` / `-Environment staging` | Target staging instead of production |
| `--skip-deploy` / `-SkipDeploy` | Local setup only, no Railway deploy |

### Option B: Manual Setup

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Create .env from template
cp .env.template .env
# Edit .env with your values

# 3. Install Railway CLI
npm install -g @railway/cli

# 4. Login and link project
railway login
railway link

# 5. Build
npx expo export --platform web --output-dir dist

# 6. Deploy
railway up
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 20 | https://nodejs.org |
| npm | (bundled) | comes with Node.js |
| Git | any | https://git-scm.com |
| Railway CLI | latest | `npm i -g @railway/cli` |

---

## Environment Variables

Copy `.env.template` to `.env` and fill in your values:

```bash
cp .env.template .env
```

**Required variables:**

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` or `staging` |
| `FRONTEND_URL` | Your Railway app URL |
| `BACKEND_URL` | Your backend API URL |
| `JWT_SECRET` | Random secret for auth tokens |
| `DATABASE_URL` | PostgreSQL connection string (if using DB) |

**Railway auto-injects:** `PORT`, `RAILWAY_*` variables.

---

## Deployment Methods

### 1. Railway CLI (Direct)

```bash
railway up            # Deploy from local
railway up --detach   # Deploy without waiting
railway logs          # View live logs
railway status        # Check deployment status
```

### 2. Git Push (Auto-deploy)

Railway auto-deploys when you push to connected branches:
- `main` → production
- `staging` → staging

```bash
git add .
git commit -m "feat: update feature"
git push origin main
```

### 3. GitHub Actions CI/CD

The pipeline at `.github/workflows/deploy.yml` runs automatically.

**Required GitHub Secrets** (Settings → Secrets → Actions):

| Secret | Where to find it |
|--------|-----------------|
| `RAILWAY_TOKEN` | railway.app → Account → Tokens |
| `RAILWAY_PROJECT_ID` | Railway project → Settings → General |
| `RAILWAY_SERVICE_ID` | Railway service → Settings (optional) |

**Pipeline flow:**
```
Push to main ──→ Build & Test ──→ Deploy to production ──→ Health check
Push to staging ─→ Build & Test ──→ Deploy to staging
Pull request ────→ Build & Test (no deploy)
```

### 4. Docker

```bash
# Build locally
docker build -t heymate .

# Run locally
docker run -p 3000:3000 -e PORT=3000 heymate

# Verify
curl http://localhost:3000/health
```

To use Docker on Railway, change the builder in `railway.json`:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

---

## Adding PostgreSQL

1. In Railway dashboard, click **+ New** → **Database** → **PostgreSQL**
2. Railway auto-injects `DATABASE_URL` into your service
3. Add a migration script to `package.json`:

```json
{
  "scripts": {
    "migrate": "node scripts/migrate.js"
  }
}
```

The installer will detect and run it automatically.

---

## Health Check

The app exposes `GET /health` which returns:
```json
{ "status": "UP" }
```

Railway uses this endpoint to verify the service is alive (configured in `railway.json`).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails on peer deps | Already handled: `--legacy-peer-deps` is set in `npmrc` |
| `railway up` says "not linked" | Run `railway link` and select your project |
| Port binding error | Railway sets `PORT` automatically; don't hardcode it |
| `dist/` missing after deploy | Ensure build command runs before `node server.js` |
| Health check fails | Verify `server.js` is listening on `0.0.0.0` (it is) |

---

## Reusing This Installer

To use this setup for another project:

1. Copy the `deploy/` folder and `.env.template` to your new project
2. Update `.env.template` with your project's variables
3. Update `railway.json` build/start commands for your stack
4. Update `.github/workflows/deploy.yml` with your URLs and branch names
5. Run the installer:
   ```bash
   ./deploy/install.sh --env production
   ```
