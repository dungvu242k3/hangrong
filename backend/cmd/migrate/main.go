package main

import (
	"database/sql"
	"log"
	"sort"
	"strings"

	_ "github.com/lib/pq"
	"hangrong/backend/internal/config"
	"hangrong/backend/migrations"
)

func main() {
	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	log.Println("🔌 Connecting to database for migrations...")
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}
	log.Println("✅ Connected to database.")

	// Create schema_migrations table if not exists
	log.Println("🛠️ Ensuring schema_migrations table exists...")
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
	`)
	if err != nil {
		log.Fatalf("failed to create schema_migrations table: %v", err)
	}

	// Read migrations from embedded FS
	entries, err := migrations.FS.ReadDir(".")
	if err != nil {
		log.Fatalf("failed to read embedded migrations: %v", err)
	}

	var upMigrations []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			upMigrations = append(upMigrations, entry.Name())
		}
	}

	// Sort migrations to execute in order
	sort.Strings(upMigrations)

	log.Printf("Found %d migrations to process.", len(upMigrations))

	for _, name := range upMigrations {
		// Version is the prefix (e.g. 000001)
		parts := strings.Split(name, "_")
		if len(parts) == 0 || parts[0] == "" {
			log.Fatalf("invalid migration name format: %s", name)
		}
		version := parts[0]

		// Check if already applied
		var exists bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)", version).Scan(&exists)
		if err != nil {
			log.Fatalf("failed to check if migration %s is applied: %v", name, err)
		}

		if exists {
			log.Printf("⏭️ Migration %s already applied.", name)
			continue
		}

		log.Printf("🚀 Applying migration %s...", name)
		sqlBytes, err := migrations.FS.ReadFile(name)
		if err != nil {
			log.Fatalf("failed to read migration file %s: %v", name, err)
		}

		sqlContent := string(sqlBytes)

		// Start a transaction for each migration file to ensure atomicity
		tx, err := db.Begin()
		if err != nil {
			log.Fatalf("failed to start transaction: %v", err)
		}

		// Execute migration
		_, err = tx.Exec(sqlContent)
		if err != nil {
			_ = tx.Rollback()
			log.Fatalf("failed to execute migration %s: %v", name, err)
		}

		// Record migration as applied
		_, err = tx.Exec("INSERT INTO schema_migrations (version, name) VALUES ($1, $2)", version, name)
		if err != nil {
			_ = tx.Rollback()
			log.Fatalf("failed to record migration %s: %v", name, err)
		}

		if err := tx.Commit(); err != nil {
			log.Fatalf("failed to commit transaction for migration %s: %v", name, err)
		}

		log.Printf("✅ Migration %s applied successfully.", name)
	}

	log.Println("🎉 All migrations applied successfully!")
}
