@echo off
setlocal enabledelayedexpansion

echo 🐳 Contract Management System - Docker Quick Start
echo ==================================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from example...
    if exist env.docker.example (
        copy env.docker.example .env >nul
        echo ✅ Created .env from env.docker.example
        echo 📝 Please edit .env file with your actual Supabase credentials before continuing.
        echo    Required variables:
        echo    - NEXT_PUBLIC_SUPABASE_URL
        echo    - NEXT_PUBLIC_SUPABASE_ANON_KEY
        echo    - SUPABASE_SERVICE_ROLE_KEY
        echo.
        pause
    ) else (
        echo ❌ env.docker.example not found. Please create .env file manually.
        pause
        exit /b 1
    )
)

:menu
echo.
echo Choose an option:
echo 1) 🚀 Start Development Environment (with hot reload)
echo 2) 🚀 Start Production Environment
echo 3) 🛑 Stop All Services
echo 4) 📊 Show Service Status
echo 5) 📋 Show Recent Logs
echo 6) 🧹 Clean Up Docker Resources
echo 7) ❌ Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto start_dev
if "%choice%"=="2" goto start_prod
if "%choice%"=="3" goto stop_services
if "%choice%"=="4" goto show_status
if "%choice%"=="5" goto show_logs
if "%choice%"=="6" goto cleanup
if "%choice%"=="7" goto exit
echo ❌ Invalid choice. Please enter a number between 1-7.
goto menu

:start_dev
echo 🚀 Starting development environment...
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
goto end

:start_prod
echo 🚀 Starting production environment...
docker-compose up --build
goto end

:stop_services
echo 🛑 Stopping all services...
docker-compose down
goto menu

:show_status
echo 📊 Service Status:
docker-compose ps
goto menu

:show_logs
echo 📋 Recent logs:
docker-compose logs --tail=20
goto menu

:cleanup
echo 🧹 Cleaning up Docker resources...
docker-compose down -v
docker system prune -f
goto menu

:exit
echo 👋 Goodbye!
exit /b 0

:end
echo.
echo ✅ Setup complete! Your application should be running at:
echo    🌐 http://localhost:3000
echo    🗄️  Database: localhost:5432
echo.
echo 📚 For more information, see DOCKER_SETUP.md
echo 🔍 To view logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
pause
