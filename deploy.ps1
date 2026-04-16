Write-Host "Starting Firebase deployment..." -ForegroundColor Green
Write-Host ""
Write-Host "Step 1: Logging into Firebase..." -ForegroundColor Yellow
firebase login
Write-Host ""
Write-Host "Step 2: Deploying to Firebase Hosting..." -ForegroundColor Yellow
firebase deploy
Write-Host ""
Write-Host "Deployment complete! Your app should be available at:" -ForegroundColor Green
Write-Host "https://rdp-final.web.app" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"
