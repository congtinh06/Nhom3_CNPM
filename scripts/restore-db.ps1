[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,

    [Parameter(Mandatory = $true)]
    [string]$Database,

    [string]$ContainerName = 'mssql'
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

try {
    if ([string]::IsNullOrWhiteSpace($env:MSSQL_SA_PASSWORD)) {
        throw 'MSSQL_SA_PASSWORD is not set. Set it before running database restore.'
    }

    $running = & docker inspect --format '{{.State.Running}}' $ContainerName 2>$null
    if ($LASTEXITCODE -ne 0 -or $running.Trim() -ne 'true') {
        throw "Container '$ContainerName' is not running."
    }

    if (-not (Test-Path -LiteralPath $BackupFile)) {
        throw "Backup file not found: $BackupFile"
    }

    $BackupFile = (Resolve-Path -LiteralPath $BackupFile).Path
    $fileName = Split-Path -Path $BackupFile -Leaf
    $containerPath = "/var/opt/mssql/backup/$fileName"

    & docker exec $ContainerName mkdir -p /var/opt/mssql/backup
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to prepare backup directory in container '$ContainerName'."
    }

    & docker cp $BackupFile "${ContainerName}:$containerPath"
    if ($LASTEXITCODE -ne 0) {
        throw "Restore copy failed for ${Database}: $LASTEXITCODE"
    }

    & docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $env:MSSQL_SA_PASSWORD -C -b -Q "RESTORE DATABASE [$Database] FROM DISK = N'$containerPath' WITH REPLACE, RECOVERY"
    if ($LASTEXITCODE -ne 0) {
        throw "Restore failed for ${Database}: $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}
