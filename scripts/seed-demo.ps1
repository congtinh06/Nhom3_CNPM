[CmdletBinding()]
param(
    [string]$ContainerName = 'mssql'
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

try {
    if ([string]::IsNullOrWhiteSpace($env:MSSQL_SA_PASSWORD)) {
        throw 'MSSQL_SA_PASSWORD is not set. Set it before running demo seeds.'
    }

    $running = & docker inspect --format '{{.State.Running}}' $ContainerName 2>$null
    if ($LASTEXITCODE -ne 0 -or $running.Trim() -ne 'true') {
        throw "Container '$ContainerName' is not running."
    }

    $seedDir = Join-Path -Path $RepoRoot -ChildPath 'docker/demo-seed'
    $files = Get-ChildItem -Path $seedDir -Filter '*.sql' | Sort-Object -Property Name

    foreach ($file in $files) {
        $containerFile = "/tmp/$($file.Name)"
        & docker cp $file.FullName "${ContainerName}:$containerFile"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to copy seed file $($file.Name)."
        }

        & docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $env:MSSQL_SA_PASSWORD -C -b -i $containerFile
        if ($LASTEXITCODE -ne 0) {
            throw "Seed failed for $($file.Name)."
        }
    }
}
finally {
    Pop-Location
}
