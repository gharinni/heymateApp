# ═══════════════════════════════════════════════════════════
#  HeyMate — Multi-stage Docker Build
#  Stage 1: Install dependencies & build the Expo web export
#  Stage 2: Lightweight production image serving with Express
# ═══════════════════════════════════════════════════════════

# ── Stage 1: Build ────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package.json package-lock.json* npmrc ./

# Install all dependencies (including devDependencies for the build)
RUN npm install --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Build the Expo web export to /app/dist
RUN node node_modules/expo/bin/cli export --platform web --output-dir dist

# ── Stage 2: Production ──────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -S heymate && adduser -S heymate -G heymate

# Copy dependency manifests and install production-only deps
COPY package.json package-lock.json* npmrc ./
RUN npm install --legacy-peer-deps --omit=dev && npm cache clean --force

# Copy the built static assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy the Express server
COPY server.js ./

# Switch to non-root user
USER heymate

# Railway injects PORT; default to 3000
EXPOSE 3000

# Health check — hits the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/health || exit 1

CMD ["node", "server.js"]
