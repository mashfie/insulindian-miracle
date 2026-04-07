# Run unit tests, then one CLI simulation. Use from repo root: pwsh -File scripts/smoke.ps1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
cargo test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
cargo run -- run --policy ucb1
exit $LASTEXITCODE
