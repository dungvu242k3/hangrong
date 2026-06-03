#!/bin/bash
# =============================================================================
# init-db.sh — PostgreSQL initialization script
# Runs automatically the first time the database container starts.
# Creates the 'hangrong' database and applies all migration files in order.
# =============================================================================

set -e

echo "🏪 [init-db] Creating database '$POSTGRES_DB' if not exists..."

# Apply all migration .up.sql files in order
for migration in /docker-entrypoint-initdb.d/migrations/*.up.sql; do
  if [ -f "$migration" ]; then
    echo "📦 [init-db] Applying migration: $(basename "$migration")"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$migration"
  fi
done

echo "✅ [init-db] All migrations applied successfully!"
