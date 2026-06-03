# Migrations

PostgreSQL migrations for Hang Rong.

These files use the `golang-migrate` naming convention:

```text
000001_name.up.sql
000001_name.down.sql
```

Example:

```bash
migrate -path backend/migrations -database "$DATABASE_URL" up
```

The current Go runtime still uses the in-memory store. These migrations are the target schema for the next repository/sqlc implementation step.

For local PowerShell usage, prefer the project helper:

```powershell
.\backend\scripts\apply-migrations.ps1
```

The helper creates `schema_migrations` and skips migrations that have already been applied. If you migrated once before this tracking table existed, it baselines the existing schema automatically.
