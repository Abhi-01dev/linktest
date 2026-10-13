$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"

$envFilePath = if (Test-Path ".\.env") { ".\.env" } elseif (Test-Path "..\backend\.env") { "..\backend\.env" } else { $null }
if ($envFilePath) {
    Get-Content $envFilePath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line -split "=", 2
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
        }
    }
}

$env:PORT = "8081"
.\mvnw.cmd spring-boot:run
