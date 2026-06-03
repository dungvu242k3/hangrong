# Security Notes

## Secrets

Never commit real secrets.

Ignored local env files:

```text
backend/.env
backend/.env.local
frontend/.env
frontend/.env.local
.env
.env.local
```

Use the example files for sharing:

```text
backend/.env.example
frontend/.env.example
```

Before committing, run:

```powershell
.\scripts\check-secrets.ps1
```

If the script reports a tracked or staged env file, stop and untrack it before pushing.

## Local Postgres Desktop

Keep these values local only:

```text
DATABASE_URL
PGPASSWORD
REDIS_URL
```

Rotate the Postgres password if it has ever been pasted into chat, committed, or shared.

## HTTP Security Defaults

The backend now enables:

```text
request id propagation
strict CORS allowlist from HR_ALLOWED_ORIGINS
JSON/body size limit via HR_MAX_BODY_BYTES
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy for camera/microphone/geolocation
Cache-Control: no-store for /api/*
optional HSTS via HR_ENABLE_HSTS=true
```

For local HTTP, keep:

```text
HR_ENABLE_HSTS=false
```

For HTTPS production, set:

```text
HR_ENABLE_HSTS=true
HR_ALLOWED_ORIGINS=https://your-frontend-domain.example
```

## Before Production

Required before real public traffic:

```text
persist refresh tokens in auth_sessions
store only refresh token hashes
move rate limit/cooldown to Redis
require requestId on money/inventory actions
write currency_ledger for every wallet mutation
log security_events for auth/rate/object-access issues
use HTTPS only
disable demo account seed
```
