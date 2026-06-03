# ============================================================
# Hang Rong Backend — Multi-stage Dockerfile
# Development: uses cosmtrek/air for hot-reload
# Production:  minimal static binary
# ============================================================

# ── Stage 1: Development (hot-reload with Air) ──────────────
FROM golang:1.25-alpine AS development

# Install air for live-reload, postgresql-client for migrations, and basic tools
RUN apk add --no-cache postgresql-client && \
  go install github.com/air-verse/air@latest

WORKDIR /app

# Copy dependency files first for layer caching
COPY go.mod go.sum ./
RUN go mod download

# Source code will be bind-mounted at runtime (docker-compose volume)
# so we don't COPY here — air watches for changes automatically.

EXPOSE 8080

CMD ["sh", "-c", "chmod +x scripts/apply-migrations.sh && ./scripts/apply-migrations.sh && air -c .air.toml"]

# ── Stage 2: Builder ────────────────────────────────────────
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /hangrong-api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /hangrong-migrate ./cmd/migrate

# ── Stage 3: Production ────────────────────────────────────
FROM alpine:3.21 AS production

RUN addgroup -g 1001 -S hangrong && \
  adduser -S hangrong -u 1001 -G hangrong

WORKDIR /app
COPY --from=builder --chown=hangrong:hangrong /hangrong-api .
COPY --from=builder --chown=hangrong:hangrong /hangrong-migrate .
COPY --from=builder --chown=hangrong:hangrong /app/migrations ./migrations

USER 1001

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/healthz || exit 1

CMD ["./hangrong-api"]

