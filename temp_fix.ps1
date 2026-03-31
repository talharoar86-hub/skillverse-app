$file = 'D:\This\skillverse\backend\controllers\publicProfileController.js'
$lines = [System.IO.File]::ReadAllLines($file)

# Find the exchange activity section boundaries
$startIdx = -1
$endIdx = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match 'Exchange Activity: posts that are skill') {
        $startIdx = $i
    }
    if ($startIdx -ne -1 -and $lines[$i] -match '^\s*\};\s*$' -and $endIdx -eq -1) {
        # Find the closing of exchangeActivity object
        if ($i -gt $startIdx + 5) {
            $endIdx = $i
            break
        }
    }
}

Write-Host "Start: $startIdx, End: $endIdx"
