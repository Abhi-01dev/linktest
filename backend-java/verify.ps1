$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"

if (Test-Path ".\.env") {
    Get-Content ".\.env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line -split "=", 2
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
        }
    }
}

.\mvnw.cmd clean verify
