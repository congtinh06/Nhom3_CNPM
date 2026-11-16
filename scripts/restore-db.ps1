[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,

    [Parameter(Mandatory = $true)]
    [string]$Database
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

try {
    if ([string]::IsNullOrWhiteSpace($env:MSSQL_SA_PASSWORD)) {
        throw 'MSSQL_SA_PASSWORD is not set. Set it before running database restore.'
    }

    if (-not (Test-Path -LiteralPath $BackupFile)) {
        throw "Backup file not found: $BackupFile"
    }

    $BackupFile = (Resolve-Path -LiteralPath $BackupFile).Path
    $fileName = Split-Path -Path $BackupFile -Leaf
    $containerPath = "/var/opt/mssql/backup/$fileName"

    $running = & docker compose ps --status running --services 2>$null
    if ($LASTEXITCODE -ne 0 -or ($running -notcontains 'mssql')) {
        throw "Service 'mssql' is not running. Start it with 'docker compose up -d mssql'."
    }

    & docker cp $BackupFile "mssql:$containerPath"
    if ($LASTEXITCODE -ne 0) {
        throw "Restore copy failed for ${Database}: $LASTEXITCODE"
    }

    & docker compose exec -T mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $env:MSSQL_SA_PASSWORD -C -b -Q "RESTORE DATABASE [$Database] FROM DISK = N'$containerPath' WITH REPLACE"
    if ($LASTEXITCODE -ne 0) {
        throw "Restore failed for ${Database}: $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}
