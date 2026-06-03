package game

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte(getEnv("JWT_SECRET", "super-secret-key-123-change-in-prod"))

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

type AuthTokens struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type Claims struct {
	UserID string `json:"sub"`
	jwt.RegisteredClaims
}

type AuthService struct {
	db *sql.DB
}

func NewAuthService(db *sql.DB) *AuthService {
	return &AuthService{db: db}
}

func hashToken(token string) string {
	h := sha256.New()
	h.Write([]byte(token))
	return hex.EncodeToString(h.Sum(nil))
}

func generateRefreshToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (s *AuthService) issueTokens(userID string) (AuthTokens, error) {
	// 1. Generate Access Token (JWT)
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString(jwtSecret)
	if err != nil {
		return AuthTokens{}, err
	}

	// 2. Generate Refresh Token
	refreshToken, err := generateRefreshToken()
	if err != nil {
		return AuthTokens{}, err
	}

	// 3. Store hashed refresh token in DB
	hashedRefresh := hashToken(refreshToken)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	_, err = s.db.Exec(`
		INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, userID, hashedRefresh, expiresAt)
	if err != nil {
		return AuthTokens{}, err
	}

	return AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) Register(username, email, password string) (AuthTokens, error) {
	if len(username) < 3 || len(password) < 6 {
		return AuthTokens{}, ErrInvalidInput
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return AuthTokens{}, err
	}

	// Start atomic registration transaction
	tx, err := s.db.Begin()
	if err != nil {
		return AuthTokens{}, err
	}
	defer tx.Rollback()

	// Check if username or email already exists
	var count int
	err = tx.QueryRow("SELECT COUNT(*) FROM users WHERE username = $1 OR email = $2", username, email).Scan(&count)
	if err != nil {
		return AuthTokens{}, err
	}
	if count > 0 {
		return AuthTokens{}, ErrConflict
	}

	// 1. Insert user
	var userID string
	err = tx.QueryRow(`
		INSERT INTO users (username, email, password_hash, display_name)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, username, email, string(hash), username).Scan(&userID)
	if err != nil {
		return AuthTokens{}, err
	}

	// 2. Insert wallet (1200 coins, 5 gems)
	_, err = tx.Exec(`
		INSERT INTO user_wallets (user_id, coins, gems)
		VALUES ($1, 1200, 5)
	`, userID)
	if err != nil {
		return AuthTokens{}, err
	}

	// 3. Insert stall
	var stallID string
	err = tx.QueryRow(`
		INSERT INTO stalls (user_id, name)
		VALUES ($1, $2)
		RETURNING id
	`, userID, fmt.Sprintf("Sap cua %s", username)).Scan(&stallID)
	if err != nil {
		return AuthTokens{}, err
	}

	// 4. Insert default slots (slot1, slot2, slot3)
	for i := 1; i <= 3; i++ {
		_, err = tx.Exec(`
			INSERT INTO stall_slots (stall_id, slot_index, status)
			VALUES ($1, $2, 'empty')
		`, stallID, i)
		if err != nil {
			return AuthTokens{}, err
		}
	}

	// 5. Insert starter quests
	_, err = tx.Exec(`
		INSERT INTO user_quests (user_id, quest_id)
		SELECT $1, id FROM quests WHERE is_active = TRUE
	`, userID)
	if err != nil {
		return AuthTokens{}, err
	}

	// 6. Insert starter inventory (3 Banh Mi, 3 Tra Da)
	_, err = tx.Exec(`
		INSERT INTO inventory (user_id, product_id, quantity)
		SELECT $1, id, 3 FROM products WHERE code IN ('BANH_MI', 'TRA_DA')
	`, userID)
	if err != nil {
		return AuthTokens{}, err
	}

	if err := tx.Commit(); err != nil {
		return AuthTokens{}, err
	}

	return s.issueTokens(userID)
}

func (s *AuthService) Login(username, password string) (AuthTokens, error) {
	var userID string
	var hash string
	var status string
	err := s.db.QueryRow("SELECT id, password_hash, status FROM users WHERE username = $1", username).Scan(&userID, &hash, &status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return AuthTokens{}, ErrUnauthorized
		}
		return AuthTokens{}, err
	}
	if status == "banned" {
		return AuthTokens{}, ErrForbidden
	}

	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return AuthTokens{}, ErrUnauthorized
	}

	return s.issueTokens(userID)
}

func (s *AuthService) Refresh(refreshToken string) (AuthTokens, error) {
	hashedRefresh := hashToken(refreshToken)

	var sessionID string
	var userID string
	var expiresAt time.Time
	var revokedAt sql.NullTime

	err := s.db.QueryRow(`
		SELECT id, user_id, expires_at, revoked_at
		FROM auth_sessions
		WHERE refresh_token_hash = $1
	`, hashedRefresh).Scan(&sessionID, &userID, &expiresAt, &revokedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return AuthTokens{}, ErrUnauthorized
		}
		return AuthTokens{}, err
	}

	if revokedAt.Valid || time.Now().After(expiresAt) {
		return AuthTokens{}, ErrUnauthorized
	}

	// Revoke old refresh token (rotate)
	_, err = s.db.Exec("UPDATE auth_sessions SET revoked_at = now() WHERE id = $1", sessionID)
	if err != nil {
		return AuthTokens{}, err
	}

	return s.issueTokens(userID)
}

func (s *AuthService) UserIDForAccessToken(token string) (string, bool) {
	claims := &Claims{}
	t, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !t.Valid {
		return "", false
	}
	return claims.UserID, true
}

