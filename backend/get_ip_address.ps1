# PowerShell script to get your local IP address
# This is needed for connecting to the backend from a physical device via Expo Go

Write-Host "Finding your local IP address..." -ForegroundColor Cyan
Write-Host ""

$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -eq "Dhcp"
} | Select-Object -ExpandProperty IPAddress

if ($ipAddresses) {
    Write-Host "Your local IP address(es):" -ForegroundColor Green
    foreach ($ip in $ipAddresses) {
        Write-Host "  - $ip" -ForegroundColor Yellow
        Write-Host "    Use: http://$ip:8080" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "For Expo Go on physical devices, update your API URL to use one of these IPs." -ForegroundColor Cyan
} else {
    Write-Host "Could not find a local IP address." -ForegroundColor Red
    Write-Host "Make sure you're connected to a Wi-Fi network." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")




