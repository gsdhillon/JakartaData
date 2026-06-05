param(
    [string]$Domain = "domain1",
    [int]$TimeoutSeconds = 90
)

$ErrorActionPreference = "Continue"

function Test-PayaraAdmin {
    & asadmin list-applications *> $null
    return $LASTEXITCODE -eq 0
}

if (Test-PayaraAdmin) {
    Write-Host "Payara admin is already available."
    exit 0
}

$asadminCommand = Get-Command asadmin -ErrorAction SilentlyContinue

if (-not $asadminCommand) {
    Write-Error "asadmin was not found on PATH."
    exit 1
}

Write-Host "Starting Payara domain $Domain..."
$process = Start-Process `
    -FilePath $asadminCommand.Source `
    -ArgumentList @("start-domain", $Domain) `
    -PassThru `
    -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

while ((Get-Date) -lt $deadline) {
    if (Test-PayaraAdmin) {
        Write-Host "Payara admin is available."
        exit 0
    }

    if ($process.HasExited -and $process.ExitCode -ne 0) {
        Write-Error "asadmin start-domain exited with code $($process.ExitCode)."
        exit $process.ExitCode
    }

    Start-Sleep -Seconds 2
}

Write-Error "Timed out waiting for Payara admin on domain $Domain. Check the Payara server.log."
exit 1