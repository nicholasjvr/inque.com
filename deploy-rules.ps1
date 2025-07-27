Write-Host "Deploying Firebase Rules..." -ForegroundColor Green
Write-Host ""

Write-Host "Deploying Firestore Rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

Write-Host ""
Write-Host "Deploying Storage Rules..." -ForegroundColor Yellow
firebase deploy --only storage

Write-Host ""
Write-Host "Rules deployment complete!" -ForegroundColor Green
Read-Host "Press Enter to continue" 