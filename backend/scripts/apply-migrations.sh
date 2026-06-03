#!/bin/sh
# =============================================================================
# apply-migrations.sh — Shell migration runner for Linux/Docker
# Mimics apply-migrations.ps1 but runs in the Alpine container.
# =============================================================================

set -e

# Ensure PostgreSQL client variables are set, fallback to compose values
DB_HOST=${PGHOST:-db}
DB_PORT=${PGPORT:-5432}
DB_NAME=${PGDATABASE:-hangrong}
DB_USER=${PGUSER:-postgres}
DB_PASS=${PGPASSWORD:-sat24042003}

export PGPASSWORD=$DB_PASS

echo "🔌 [migration-runner] Checking database connection to $DB_HOST:$DB_PORT..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "⏳ [migration-runner] Database not ready yet, retrying in 2 seconds..."
  sleep 2
done

echo "⚙️ [migration-runner] Ensuring database '$DB_NAME' exists..."
# Create database if not exists (handling postgres catalog query)
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';")
if [ "$DB_EXISTS" != "1" ]; then
  echo "🚀 [migration-runner] Creating database '$DB_NAME'..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
fi

echo "⚙️ [migration-runner] Ensuring schema_migrations tracking table exists..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);"

# Check if users table exists to handle baselining
HAS_USERS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT to_regclass('public.users') IS NOT NULL;")
APPLIED_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM schema_migrations;")

# Baselining
if [ "$APPLIED_COUNT" = "0" ] && [ "$HAS_USERS" = "t" ]; then
  echo "⚠️ [migration-runner] Existing schema detected without tracking. Baselining migrations..."
  for migration in /app/migrations/*.up.sql; do
    if [ -f "$migration" ]; then
      filename=$(basename "$migration")
      version="${filename%%_*}"
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c \
        "INSERT INTO schema_migrations(version, name) VALUES ('$version', '$filename') ON CONFLICT (version) DO NOTHING;"
    fi
  done
fi

echo "📦 [migration-runner] Scanning and applying pending migrations..."
# Iterate migrations in alphabetical/version order
for migration in $(ls /app/migrations/*.up.sql | sort); do
  if [ -f "$migration" ]; then
    filename=$(basename "$migration")
    version=$(echo "$filename" | cut -d'_' -f1)
    
    # Check if migration is already applied
    IS_APPLIED=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1 FROM schema_migrations WHERE version = '$version';")
    
    if [ "$IS_APPLIED" = "1" ]; then
      echo "⏭️ [migration-runner] Skipping: $filename (already applied)"
    else
      echo "🚀 [migration-runner] Applying: $filename"
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$migration"
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c \
        "INSERT INTO schema_migrations(version, name) VALUES ('$version', '$filename');"
    fi
  fi
done

echo "✅ [migration-runner] Migration check complete!"
