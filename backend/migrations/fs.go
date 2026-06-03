package migrations

import "embed"

// FS embeds all SQL files in the migrations directory
//go:embed *.sql
var FS embed.FS
