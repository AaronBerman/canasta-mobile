# Prints the Expo Go connection URL for this machine (no QR needed).
# Run in a second terminal while `npx expo start` is running.

$ip = (
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.IPAddress -notlike '127.*' -and
    $_.IPAddress -notlike '169.254.*' -and
    $_.PrefixOrigin -ne 'WellKnown'
  } |
  Select-Object -First 1 -ExpandProperty IPAddress
)

if (-not $ip) {
  $ip = 'YOUR_PC_IP'
  Write-Host "Could not detect LAN IP. Run: ipconfig" -ForegroundColor Yellow
  Write-Host "Use the IPv4 address under your Wi-Fi adapter." -ForegroundColor Yellow
  Write-Host ""
}

$url = "exp://$ip`:8081"
Write-Host ""
Write-Host "=== Expo Go — connect manually ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Keep 'npx expo start' running in the other terminal"
Write-Host "2. Open Expo Go on your phone (same Wi-Fi as this PC)"
Write-Host "3. Tap 'Enter URL manually' (Android) or connect via the Projects tab"
Write-Host "4. Paste this URL:"
Write-Host ""
Write-Host "   $url" -ForegroundColor Green
Write-Host ""
Write-Host "If that fails, try tunnel mode:" -ForegroundColor Cyan
Write-Host "   npm run start:tunnel" -ForegroundColor White
Write-Host ""
