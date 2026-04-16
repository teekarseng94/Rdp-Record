@echo off
echo Starting Firebase deployment...
echo.
echo Step 1: Logging into Firebase...
firebase login
echo.
echo Step 2: Deploying to Firebase Hosting...
firebase deploy
echo.
echo Deployment complete! Your app should be available at:
echo https://rdp-final.web.app
echo.
pause
