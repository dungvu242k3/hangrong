package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Config struct {
	Addr            string
	AllowedOrigin   string
	AllowedOrigins  []string
	DatabaseURL     string
	RedisURL        string
	AssetBaseURL    string
	MaxBodyBytes    int64
	EnableHSTS      bool
	RequestTimeout  time.Duration
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration
}

func Load() Config {
	loadDotEnvFiles(
		filepath.Join("backend", ".env.local"),
		".env.local",
		filepath.Join("backend", ".env"),
		".env",
	)

	addr := os.Getenv("HR_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	origin := os.Getenv("HR_ALLOWED_ORIGIN")
	if origin == "" {
		origin = "http://localhost:3000"
	}
	origins := csvEnv("HR_ALLOWED_ORIGINS")
	if len(origins) == 0 {
		origins = []string{origin, "http://127.0.0.1:3000"}
	}

	return Config{
		Addr:            addr,
		AllowedOrigin:   origin,
		AllowedOrigins:  origins,
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		RedisURL:        os.Getenv("REDIS_URL"),
		AssetBaseURL:    os.Getenv("ASSET_BASE_URL"),
		MaxBodyBytes:    int64Env("HR_MAX_BODY_BYTES", 1<<20),
		EnableHSTS:      boolEnv("HR_ENABLE_HSTS", false),
		RequestTimeout:  durationEnv("HR_REQUEST_TIMEOUT", 5*time.Second),
		ReadTimeout:     durationEnv("HR_READ_TIMEOUT", 5*time.Second),
		WriteTimeout:    durationEnv("HR_WRITE_TIMEOUT", 10*time.Second),
		IdleTimeout:     durationEnv("HR_IDLE_TIMEOUT", 60*time.Second),
		ShutdownTimeout: durationEnv("HR_SHUTDOWN_TIMEOUT", 10*time.Second),
	}
}

func durationEnv(key string, fallback time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func int64Env(key string, fallback int64) int64 {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err == nil {
		return int64(parsed)
	}
	var out int64
	for _, ch := range value {
		if ch < '0' || ch > '9' {
			return fallback
		}
		out = out*10 + int64(ch-'0')
	}
	if out <= 0 {
		return fallback
	}
	return out
}

func boolEnv(key string, fallback bool) bool {
	value := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	if value == "" {
		return fallback
	}
	return value == "1" || value == "true" || value == "yes" || value == "on"
}

func csvEnv(key string) []string {
	value := os.Getenv(key)
	if value == "" {
		return nil
	}

	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

func loadDotEnvFiles(paths ...string) {
	for _, path := range paths {
		file, err := os.Open(path)
		if err != nil {
			continue
		}
		loadDotEnv(file)
		_ = file.Close()
	}
}

func loadDotEnv(file *os.File) {
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}

		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		value = strings.Trim(value, `"'`)
		if key == "" {
			continue
		}

		if _, exists := os.LookupEnv(key); !exists {
			_ = os.Setenv(key, value)
		}
	}
}
