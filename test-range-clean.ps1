# Test Range Request for Audio (PowerShell approach)
# Since Invoke-WebRequest doesn't support Range header directly, use WebClient

$url = "https://invitelyfinal-cpkot1j5w-haruts-projects-9810c546.vercel.app/api/audio/serve/Indila%20-%20Love%20Story_1756335711694.mp3"

try {
    $client = New-Object System.Net.WebClient
    $client.Headers.Add("Range", "bytes=0-1023")
    $client.Headers.Add("DNT", "1") # Simulate incognito
    $client.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    
    $response = $client.DownloadData($url)
    $responseHeaders = $client.ResponseHeaders
    
    Write-Host "Range request successful!" -ForegroundColor Green
    Write-Host "Downloaded bytes: $($response.Length)" -ForegroundColor Cyan
    Write-Host "Content-Type: $($responseHeaders['Content-Type'])" -ForegroundColor Cyan
    Write-Host "Content-Range: $($responseHeaders['Content-Range'])" -ForegroundColor Cyan
    Write-Host "Accept-Ranges: $($responseHeaders['Accept-Ranges'])" -ForegroundColor Cyan
    Write-Host "Access-Control-Allow-Origin: $($responseHeaders['Access-Control-Allow-Origin'])" -ForegroundColor Cyan
    
} catch {
    Write-Host "Range request failed: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($client) { $client.Dispose() }
}