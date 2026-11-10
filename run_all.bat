@echo off
echo =======================================================
echo   Launching Signal Messenger Fullstack Application
echo =======================================================
echo Backend:  http://localhost:8000 (Swagger docs at /docs)
echo Frontend: http://localhost:3000
echo =======================================================
start "Signal Backend" cmd /k run_backend.bat
start "Signal Frontend" cmd /k run_frontend.bat

