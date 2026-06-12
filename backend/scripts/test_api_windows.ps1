param(
    [string]$BaseUrl = "http://127.0.0.1:8081",
    [string]$ApiKey = "change-me-agent-key"
)

$headers = @{ "X-Agent-Key" = $ApiKey }

Write-Host "Health:" -ForegroundColor Cyan
Invoke-RestMethod "$BaseUrl/api/v1/health" | ConvertTo-Json -Depth 5

Write-Host "Telemetry:" -ForegroundColor Cyan
Invoke-RestMethod "$BaseUrl/api/v1/telemetry" -Headers $headers | ConvertTo-Json -Depth 5

Write-Host "Opening mock door for 0.2 seconds:" -ForegroundColor Cyan
$body = @{ duration_seconds = 0.2; reason = "windows-test" } | ConvertTo-Json
Invoke-RestMethod "$BaseUrl/api/v1/door/open" -Method Post -Headers $headers -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 5

Write-Host "Saving camera snapshot to test_snapshot.jpg" -ForegroundColor Cyan
Invoke-WebRequest "$BaseUrl/api/v1/camera/snapshot" -Headers $headers -OutFile "test_snapshot.jpg"

Write-Host "Events:" -ForegroundColor Cyan
Invoke-RestMethod "$BaseUrl/api/v1/events" -Headers $headers | ConvertTo-Json -Depth 5
