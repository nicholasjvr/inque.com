@echo off
echo Deploying Firebase Rules...
echo.

echo Deploying Firestore Rules...
firebase deploy --only firestore:rules

echo.
echo Deploying Storage Rules...
firebase deploy --only storage

echo.
echo Rules deployment complete!
pause 