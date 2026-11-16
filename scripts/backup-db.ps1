[CmdletBinding()]
param(
    [string]$BackupDir = 'F:\echora-backup'
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

try {
    if ([string]::IsNullOrWhiteSpace($env:MSSQL_SA_PASSWORD)) {
        throw 'MSSQL_SA_PASSWORD is not set. Set it before running database backup.'
    }

    $running = & docker compose ps --status running --services 2>$null
    if ($LASTEXITCODE -ne 0 -or ($running -notcontains 'mssql')) {
        throw "Service 'mssql' is not running. Start it with 'docker compose up -d mssql'."
    }

    if (-not (Test-Path -LiteralPath $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }

    $BackupDir = (Resolve-Path -LiteralPath $BackupDir).Path
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $databases = @(
        'echora_auth_db',
        'echora_content_db',
        'echora_translation_db',
        'echora_analytics_db',
        'echora_order_db'
    )

    foreach ($db in $databases) {
        $fileName = "${db}_$stamp.bak"
        $containerPath = "/var/opt/mssql/backup/$fileName"

        & docker compose exec -T mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $env:MSSQL_SA_PASSWORD -C -b -Q "BACKUP DATABASE [$db] TO DISK = N'$containerPath'"
        if ($LASTEXITCODE -ne 0) {
            throw "Backup failed for ${db}: $LASTEXITCODE"
        }

        & docker cp "mssql:$containerPath" (Join-Path -Path $BackupDir -ChildPath $fileName)
        if ($LASTEXITCODE -ne 0) {
            throw "Backup copy failed for ${db}: $LASTEXITCODE"
        }
    }

    Write-Host "Database backups created in $BackupDir"
}
finally {
    Pop-Location
}
