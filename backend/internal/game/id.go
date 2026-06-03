package game

import (
	"crypto/rand"
	"encoding/hex"
)

func newID(prefix string) string {
	buf := make([]byte, 12)
	if _, err := rand.Read(buf); err != nil {
		return prefix + "_local"
	}
	return prefix + "_" + hex.EncodeToString(buf)
}
