package server

import (
	"context"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"hangrong/backend/internal/config"
	"hangrong/backend/internal/game"
	"hangrong/backend/internal/shared"
)

func NewRouter(service *game.Service, cfg config.Config) http.Handler {
	mux := http.NewServeMux()
	game.NewHandler(service).RegisterRoutes(mux)

	var handler http.Handler = mux
	handler = rateLimit(handler)
	handler = recoverer(handler)
	handler = accessLog(handler)
	handler = maxBodyBytes(handler, cfg.MaxBodyBytes)
	handler = requestTimeout(handler, cfg.RequestTimeout)
	handler = requestID(handler)
	handler = securityHeaders(handler, cfg.EnableHSTS)
	handler = cors(handler, cfg.AllowedOrigins)
	return handler
}

func requestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := strings.TrimSpace(r.Header.Get("X-Request-Id"))
		if requestID == "" || len(requestID) > 80 {
			requestID = shared.NewRequestID()
		}
		w.Header().Set("X-Request-Id", requestID)
		next.ServeHTTP(w, r.WithContext(shared.WithRequestID(r.Context(), requestID)))
	})
}

func requestTimeout(next http.Handler, timeout time.Duration) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), timeout)
		defer cancel()
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func securityHeaders(next http.Handler, enableHSTS bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-site")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Cache-Control", "no-store")
		}
		if enableHSTS {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		next.ServeHTTP(w, r)
	})
}

func cors(next http.Handler, allowedOrigins []string) http.Handler {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			allowed[origin] = struct{}{}
		}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if _, ok := allowed[origin]; ok {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-Id")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func maxBodyBytes(next http.Handler, maxBytes int64) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Body != nil && maxBytes > 0 {
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
		}
		next.ServeHTTP(w, r)
	})
}

func recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("panic recovered request_id=%s error=%v", shared.RequestID(r), rec)
				shared.WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Unexpected server error.")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func accessLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("request_id=%s method=%s path=%s latency=%s", shared.RequestID(r), r.Method, r.URL.Path, time.Since(start))
	})
}

type visitor struct {
	windowStart time.Time
	count       int
}

func rateLimit(next http.Handler) http.Handler {
	var mu sync.Mutex
	visitors := map[string]*visitor{}
	const limit = 300
	const window = time.Minute

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr
		}

		now := time.Now()
		mu.Lock()
		v := visitors[ip]
		if v == nil || now.Sub(v.windowStart) > window {
			v = &visitor{windowStart: now}
			visitors[ip] = v
		}
		v.count++
		allowed := v.count <= limit
		mu.Unlock()

		if !allowed {
			shared.WriteError(w, r, http.StatusTooManyRequests, "RATE_LIMITED", "Too many requests.")
			return
		}
		next.ServeHTTP(w, r)
	})
}
