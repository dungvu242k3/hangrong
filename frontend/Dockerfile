# ============================================================
# Hang Rong Frontend — Multi-stage Dockerfile
# Development: next dev with hot-reload via volume mount
# Production:  optimized standalone Next.js build
# ============================================================

# ── Stage 1: Development (hot-reload) ───────────────────────
FROM node:22-alpine AS development

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --no-audit --prefer-offline

# Source code will be bind-mounted via docker-compose
# so we don't need to COPY the full source here.

EXPOSE 3000

# WATCHPACK_POLLING enables file-watching inside Docker (required for bind mounts on Windows)
ENV WATCHPACK_POLLING=true
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev"]

# ── Stage 2: Builder ────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --no-audit --prefer-offline

COPY . .
RUN npm run build

# ── Stage 3: Production ────────────────────────────────────
FROM node:22-alpine AS production

RUN addgroup -g 1001 -S nextjs && \
    adduser -S nextjs -u 1001 -G nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nextjs /app/package.json ./
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

USER 1001

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["npm", "run", "start"]
