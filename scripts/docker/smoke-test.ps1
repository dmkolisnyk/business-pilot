[CmdletBinding()]
param(
    [int]$TimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI was not found. Install Docker Desktop from the official Docker website."
}

function Get-ComposeContainers {
    $raw = docker compose ps --format json
    if ($LASTEXITCODE -ne 0) {
        throw 'docker compose ps failed.'
    }

    $containers = @()
    foreach ($line in $raw) {
        if ($line) {
            $parsed = $line | ConvertFrom-Json
            $containers += @($parsed)
        }
    }

    return $containers
}

docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
    throw 'docker compose up failed.'
}

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$requiredServices = @('postgres', 'redis', 'api', 'web')
$missingServices = $requiredServices

while ((Get-Date) -lt $deadline) {
    $containers = Get-ComposeContainers
    $healthyServices = @(
        $containers |
            Where-Object { $_.Service -in $requiredServices -and $_.Health -eq 'healthy' } |
            Select-Object -ExpandProperty Service
    )

    $missingServices = @($requiredServices | Where-Object { $_ -notin $healthyServices })
    if ($missingServices.Count -eq 0) {
        break
    }

    Start-Sleep -Seconds 3
}

if ($missingServices.Count -gt 0) {
    docker compose ps
    docker compose logs --tail 100 $missingServices
    throw "Docker services did not become healthy within $TimeoutSeconds seconds: $($missingServices -join ', ')."
}

$api = Invoke-RestMethod -Uri 'http://localhost:4000/health' -Method Get
if ($api.status -ne 'ok') {
    throw 'API health endpoint did not return status=ok.'
}

$web = Invoke-WebRequest -Uri 'http://localhost:3000' -Method Get -UseBasicParsing
if ($web.StatusCode -ne 200) {
    throw "Web application returned HTTP $($web.StatusCode)."
}

Write-Host 'Docker smoke test passed.'
Write-Host 'Web: http://localhost:3000'
Write-Host 'API: http://localhost:4000/health'
