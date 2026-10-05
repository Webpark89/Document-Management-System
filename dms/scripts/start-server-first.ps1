# start-server-first.ps1
# Starts NestJS backend first, waits for port 4000 to be ready, then starts Next.js client.
# Usage: pwsh -File scripts/start-server-first.ps1 (from monorepo root)

param(
  [int]$TimeoutSeconds = 120,
  [int]$Port = 4000
)

$root = Split-Path $PSScriptRoot -Parent

Write-Host "[DMS] Killing existing processes on ports 3000 and 4000..." -ForegroundColor Yellow
try { & npx kill-port 3000 4000 2>$null } catch {}
Start-Sleep -Milliseconds 500

Write-Host "[DMS] Starting NestJS server (port $Port)..." -ForegroundColor Blue
$serverJob = Start-Process -FilePath "npm" `
  -ArgumentList "run", "start:dev", "--workspace=server" `
  -WorkingDirectory $root `
  -NoNewWindow -PassThru

Write-Host "[DMS] Waiting for backend on port $Port (timeout=${TimeoutSeconds}s)..." -ForegroundColor Yellow

$elapsed = 0
$ready = $false
while ($elapsed -lt $TimeoutSeconds) {
  try {
    $conn = New-Object System.Net.Sockets.TcpClient
    $conn.Connect("127.0.0.1", $Port)
    $conn.Close()
    $ready = $true
    break
  } catch {
    Start-Sleep -Seconds 1
    $elapsed++
    if ($elapsed % 5 -eq 0) {
      Write-Host "[DMS] Still waiting... ${elapsed}s elapsed" -ForegroundColor DarkYellow
    }
  }
}

if (-not $ready) {
  Write-Host "[DMS] ERROR: Backend did not start in ${TimeoutSeconds}s." -ForegroundColor Red
  Stop-Process -Id $serverJob.Id -Force -ErrorAction SilentlyContinue
  exit 1
}

Write-Host "[DMS] Backend ready! Starting Next.js client..." -ForegroundColor Green
Start-Process -FilePath "npm" `
  -ArgumentList "run", "dev", "--workspace=client" `
  -WorkingDirectory $root `
  -NoNewWindow -Wait

Stop-Process -Id $serverJob.Id -Force -ErrorAction SilentlyContinue
