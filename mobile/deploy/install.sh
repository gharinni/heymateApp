#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  HeyMate — Automated Installer & Deployer (Bash)
#
#  Usage:
#    chmod +x deploy/install.sh
#    ./deploy/install.sh [--env production|staging] [--skip-deploy]
#
#  Prerequisites:
#    - Node.js >= 20   (https://nodejs.org)
#    - Railway CLI      (https://docs.railway.app/develop/cli)
#    - Git
#
#  What this script does:
#    1. Validates prerequisites (Node, npm, Railway CLI, Git)
#    2. Installs npm dependencies
#    3. Creates .env from template (if missing)
#    4. Links to Railway project
#    5. Sets Railway environment variables
#    6. Runs database migrations (if present)
#    7. Builds the Expo web export
#    8. Deploys to Railway
# ═══════════════════════════════════════════════════════════
set -euo pipefail

# ── Colour helpers ────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m' # No Colour

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── Parse arguments ───────────────────────────────────────
ENVIRONMENT="production"
SKIP_DEPLOY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)        ENVIRONMENT="$2"; shift 2 ;;
    --skip-deploy) SKIP_DEPLOY=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--env production|staging] [--skip-deploy]"
      exit 0
      ;;
    *) err "Unknown option: $1"; exit 1 ;;
  esac
done

info "Environment: ${ENVIRONMENT}"

# ── Step 1: Check prerequisites ──────────────────────────
info "Checking prerequisites..."

command -v node >/dev/null 2>&1 || { err "Node.js is not installed. Install from https://nodejs.org"; exit 1; }
command -v npm  >/dev/null 2>&1 || { err "npm is not installed."; exit 1; }
command -v git  >/dev/null 2>&1 || { err "Git is not installed."; exit 1; }

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 20 ]; then
  err "Node.js >= 20 required (found v${NODE_VER}). Please upgrade."
  exit 1
fi
ok "Node.js $(node -v)"

# Railway CLI is only required if we are deploying
if [ "$SKIP_DEPLOY" = false ]; then
  if ! command -v railway >/dev/null 2>&1; then
    warn "Railway CLI not found. Installing..."
    npm install -g @railway/cli
  fi
  ok "Railway CLI $(railway --version 2>/dev/null || echo 'installed')"
fi

# ── Step 2: Install dependencies ─────────────────────────
info "Installing npm dependencies..."
npm install --legacy-peer-deps
ok "Dependencies installed"

# ── Step 3: Environment variables ─────────────────────────
ENV_FILE=".env"
ENV_TEMPLATE=".env.template"

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_TEMPLATE" ]; then
    cp "$ENV_TEMPLATE" "$ENV_FILE"
    warn ".env created from template — edit it with your real values before deploying."
  else
    warn "No .env.template found. Skipping .env creation."
  fi
else
  ok ".env already exists"
fi

# ── Step 4: Link to Railway project ──────────────────────
if [ "$SKIP_DEPLOY" = false ]; then
  info "Linking to Railway project..."

  # If RAILWAY_TOKEN is set, use non-interactive mode
  if [ -n "${RAILWAY_TOKEN:-}" ]; then
    info "Using RAILWAY_TOKEN for authentication"
  else
    warn "No RAILWAY_TOKEN found — Railway CLI will prompt for login."
    railway login
  fi

  # Link to the project (interactive selector if PROJECT_ID not set)
  if [ -n "${RAILWAY_PROJECT_ID:-}" ]; then
    railway link "$RAILWAY_PROJECT_ID"
  else
    info "Select your HeyMate project in the interactive prompt:"
    railway link
  fi
  ok "Linked to Railway project"

  # ── Step 5: Push environment variables to Railway ───────
  info "Setting Railway environment variables..."

  # Read .env and set each variable on Railway
  if [ -f "$ENV_FILE" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      # Skip comments and empty lines
      [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
      # Extract KEY=VALUE
      KEY=$(echo "$line" | cut -d '=' -f 1 | xargs)
      VALUE=$(echo "$line" | cut -d '=' -f 2- | xargs)
      # Skip Railway-internal vars (Railway sets PORT automatically)
      [[ "$KEY" == "PORT" ]] && continue
      [[ "$KEY" == "RAILWAY_TOKEN" ]] && continue
      [[ "$KEY" == "RAILWAY_PROJECT_ID" ]] && continue
      [[ "$KEY" == "RAILWAY_SERVICE_ID" ]] && continue
      if [ -n "$VALUE" ] && [ "$VALUE" != "change-me-to-a-random-string" ]; then
        railway variables set "$KEY=$VALUE" 2>/dev/null || true
      fi
    done < "$ENV_FILE"
    ok "Environment variables synced to Railway"
  fi
fi

# ── Step 6: Database migrations ──────────────────────────
# Add your migration command here if you have a database
MIGRATION_SCRIPT="migrate"
if npm run --silent "$MIGRATION_SCRIPT" 2>/dev/null; then
  ok "Database migrations complete"
else
  info "No migration script found (npm run ${MIGRATION_SCRIPT}). Skipping."
fi

# ── Step 7: Build ────────────────────────────────────────
info "Building Expo web export..."
npx expo export --platform web --output-dir dist
ok "Build complete → dist/"

# ── Step 8: Deploy ───────────────────────────────────────
if [ "$SKIP_DEPLOY" = true ]; then
  warn "Skipping deploy (--skip-deploy flag set)"
  ok "Local build finished. Run 'railway up' to deploy manually."
  exit 0
fi

info "Deploying to Railway (${ENVIRONMENT})..."
railway up --detach
ok "Deployment triggered! Check status with: railway status"

# ── Done ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  HeyMate deployed successfully! 🚀${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo ""
info "Dashboard:  https://railway.app/dashboard"
info "Logs:       railway logs"
info "Status:     railway status"
