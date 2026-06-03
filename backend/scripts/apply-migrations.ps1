param(
  [string]$EnvFile = "",
  [switch]$SkipCreateDatabase
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Resolve-Path (Join-Path $ScriptDir "..")

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
  $EnvFile = Join-Path $BackendDir ".env"
}

if (!(Test-Path -LiteralPath $EnvFile)) {
  throw "Env file not found: $EnvFile"
}

Get-Content -LiteralPath $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line.Length -eq 0 -or $line.StartsWith("#")) {
    return
  }

  $key, $value = $line.Split("=", 2)
  if ([string]::IsNullOrWhiteSpace($key) -or $null -eq $value) {
    return
  }

  $key = $key.Trim()
  $value = $value.Trim().Trim('"').Trim("'")
  [Environment]::SetEnvironmentVariable($key, $value, "Process")
}

$required = @("PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD")
foreach ($key in $required) {
  $value = [Environment]::GetEnvironmentVariable($key, "Process")
  if ([string]::IsNullOrWhiteSpace($value) -or $value -like "*YOUR_*") {
    throw "Please fill $key in $EnvFile before running migrations."
  }
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if ($null -eq $psql) {
  throw "psql was not found in PATH. Add PostgreSQL Desktop bin folder to PATH first."
}

if ($env:PGDATABASE -notmatch "^[A-Za-z0-9_-]+$") {
  throw "PGDATABASE contains unsupported characters for this helper script."
}

function Invoke-PsqlChecked {
  param(
    [string]$Database,
    [string[]]$Arguments
  )

  & psql `
    -h $env:PGHOST `
    -p $env:PGPORT `
    -U $env:PGUSER `
    -d $Database `
    -v ON_ERROR_STOP=1 `
    @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "psql failed with exit code $LASTEXITCODE."
  }
}

if (!$SkipCreateDatabase) {
  Write-Host "Checking database $env:PGDATABASE"
  $exists = & psql `
    -h $env:PGHOST `
    -p $env:PGPORT `
    -U $env:PGUSER `
    -d postgres `
    -tAc "SELECT 1 FROM pg_database WHERE datname = '$($env:PGDATABASE)';"

  if ($LASTEXITCODE -ne 0) {
    throw "Could not connect to maintenance database 'postgres'. Check PGHOST, PGPORT, PGUSER, and PGPASSWORD."
  }

  $existsValue = ($exists | Select-Object -First 1)
  if ($null -eq $existsValue -or $existsValue.Trim() -ne "1") {
    Write-Host "Creating database $env:PGDATABASE"
    Invoke-PsqlChecked -Database "postgres" -Arguments @("-c", "CREATE DATABASE ""$($env:PGDATABASE)"";")
  }
}

$MigrationDir = Join-Path $BackendDir "migrations"

Invoke-PsqlChecked -Database $env:PGDATABASE -Arguments @(
  "-c",
  "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, name TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());"
)

$migrations = Get-ChildItem -LiteralPath $MigrationDir -Filter "*.up.sql" | Sort-Object Name

$appliedCount = & psql `
  -h $env:PGHOST `
  -p $env:PGPORT `
  -U $env:PGUSER `
  -d $env:PGDATABASE `
  -tAc "SELECT count(*) FROM schema_migrations;"

if ($LASTEXITCODE -ne 0) {
  throw "Could not read schema_migrations."
}

$hasUsersTable = & psql `
  -h $env:PGHOST `
  -p $env:PGPORT `
  -U $env:PGUSER `
  -d $env:PGDATABASE `
  -tAc "SELECT to_regclass('public.users') IS NOT NULL;"

if ($LASTEXITCODE -ne 0) {
  throw "Could not inspect existing schema."
}

if (($appliedCount | Select-Object -First 1).Trim() -eq "0" -and ($hasUsersTable | Select-Object -First 1).Trim() -eq "t") {
  Write-Host "Existing schema detected without migration tracking. Baselining migrations as already applied."
  foreach ($migration in $migrations) {
    $version = $migration.Name.Replace(".up.sql", "")
    Invoke-PsqlChecked -Database $env:PGDATABASE -Arguments @(
      "-c",
      "INSERT INTO schema_migrations(version, name) VALUES ('$version', '$($migration.Name)') ON CONFLICT (version) DO NOTHING;"
    )
  }
}

foreach ($migration in $migrations) {
  $version = $migration.Name.Replace(".up.sql", "")
  $isApplied = & psql `
    -h $env:PGHOST `
    -p $env:PGPORT `
    -U $env:PGUSER `
    -d $env:PGDATABASE `
    -tAc "SELECT 1 FROM schema_migrations WHERE version = '$version';"

  if ($LASTEXITCODE -ne 0) {
    throw "Could not check migration $($migration.Name)."
  }

  if (($isApplied | Select-Object -First 1).Trim() -eq "1") {
    Write-Host "Skipping $($migration.Name)"
    continue
  }

  Write-Host "Applying $($migration.Name)"
  Invoke-PsqlChecked -Database $env:PGDATABASE -Arguments @("-f", $migration.FullName)
  Invoke-PsqlChecked -Database $env:PGDATABASE -Arguments @(
    "-c",
    "INSERT INTO schema_migrations(version, name) VALUES ('$version', '$($migration.Name)');"
  )
}

Write-Host "Migrations applied to $env:PGDATABASE."
