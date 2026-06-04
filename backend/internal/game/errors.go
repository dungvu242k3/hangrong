package game

import "errors"

var (
	ErrUnauthorized      = errors.New("unauthorized")
	ErrInvalidInput      = errors.New("invalid input")
	ErrNotFound          = errors.New("not found")
	ErrConflict          = errors.New("conflict")
	ErrInsufficientCoins = errors.New("insufficient coins")
	ErrInsufficientStock = errors.New("insufficient stock")
	ErrNotReady          = errors.New("not ready")
	ErrForbidden         = errors.New("forbidden")
	ErrInsufficientGems  = errors.New("insufficient gems")
)
