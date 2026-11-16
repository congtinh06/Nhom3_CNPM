[CmdletBinding()]
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

try {
    $running = & docker compose ps --status running --services 2>$null
    if ($LASTEXITCODE -ne 0 -or ($running -notcontains 'mssql')) {
        throw "Service 'mssql' is not running. Start it with 'docker compose up -d mssql'."
    }

    $seedDir = Join-Path -Path $RepoRoot -ChildPath 'docker/demo-seed'
    $files = Get-ChildItem -Path $seedDir -Filter '*.sql' | Sort-Object -Property Name

    foreach ($file in $files) {
        $containerFile = "/tmp/$($file.Name)"
        & docker cp $file.FullName "mssql:$containerFile"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to copy seed file $($file.Name)."
        }

        & docker compose exec -T mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $env:MSSQL_SA_PASSWORD -C -b -i $containerFile
        if ($LASTEXITCODE -ne 0) {
            throw "Seed failed for $($file.Name)."
        }
    }
}
finally {
    Pop-Location
}
