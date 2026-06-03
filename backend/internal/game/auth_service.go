package game

import "golang.org/x/crypto/bcrypt"

type AuthTokens struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type AuthService struct {
	store *Store
}

func NewAuthService(store *Store) *AuthService {
	return &AuthService{store: store}
}

func (s *AuthService) Register(username, email, password string) (AuthTokens, error) {
	if len(username) < 3 || len(password) < 6 {
		return AuthTokens{}, ErrInvalidInput
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return AuthTokens{}, err
	}

	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	if _, exists := s.store.usersByName[username]; exists {
		return AuthTokens{}, ErrConflict
	}

	user := defaultUser(username, email, hash)
	s.store.users[user.ID] = user
	s.store.usersByName[username] = user.ID
	return s.issueTokensLocked(user.ID), nil
}

func (s *AuthService) Login(username, password string) (AuthTokens, error) {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	userID, exists := s.store.usersByName[username]
	if !exists {
		return AuthTokens{}, ErrUnauthorized
	}
	user := s.store.users[userID]
	if bcrypt.CompareHashAndPassword(user.PasswordHash, []byte(password)) != nil {
		return AuthTokens{}, ErrUnauthorized
	}
	return s.issueTokensLocked(user.ID), nil
}

func (s *AuthService) Refresh(refreshToken string) (AuthTokens, error) {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	userID, exists := s.store.refreshTokens[refreshToken]
	if !exists {
		return AuthTokens{}, ErrUnauthorized
	}
	delete(s.store.refreshTokens, refreshToken)
	return s.issueTokensLocked(userID), nil
}

func (s *AuthService) UserIDForAccessToken(token string) (string, bool) {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()
	userID, ok := s.store.accessTokens[token]
	return userID, ok
}

func (s *AuthService) issueTokensLocked(userID string) AuthTokens {
	access := newID("at")
	refresh := newID("rt")
	s.store.accessTokens[access] = userID
	s.store.refreshTokens[refresh] = userID
	return AuthTokens{AccessToken: access, RefreshToken: refresh}
}
