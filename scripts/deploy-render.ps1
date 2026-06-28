# Script de déploiement PowerShell pour Render
# Usage: .\scripts\deploy-render.ps1

param(
    [string]$RenderApiKey = $env:RENDER_API_KEY,
    [string]$ServiceId = $env:RENDER_SERVICE_ID
)

if (-not $RenderApiKey -or -not $ServiceId) {
    Write-Host "❌ RENDER_API_KEY et RENDER_SERVICE_ID requis" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Déploiement sur Render..." -ForegroundColor Green
$headers = @{
    "Authorization" = "Bearer $RenderApiKey"
    "Content-Type" = "application/json"
}
$body = @{} | ConvertTo-Json

try {
    $resp = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/deploys" `
        -Method Post -Headers $headers -Body $body
    Write-Host "✅ Déploiement déclenché!" -ForegroundColor Green
    Write-Host "📋 Status: $($resp.status)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
