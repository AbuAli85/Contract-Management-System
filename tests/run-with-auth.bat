@echo off
REM Quick Test Runner with Authentication (Windows)
REM 
REM This script makes it easy to run validation tests with authentication
REM without manually managing tokens.
REM
REM Usage:
REM   tests\run-with-auth.bat                    # Run against localhost
REM   tests\run-with-auth.bat production         # Run against production

setlocal enabledelayedexpansion

REM Configuration
set TARGET=%1
if "%TARGET%"=="" set TARGET=local

if "%TARGET%"=="production" (
    set API_BASE_URL=https://portal.thesmartpro.io
    echo [94m[INFO][0m Testing against PRODUCTION
) else if "%TARGET%"=="prod" (
    set API_BASE_URL=https://portal.thesmartpro.io
    echo [94m[INFO][0m Testing against PRODUCTION
) else (
    set API_BASE_URL=http://localhost:3000
    echo [94m[INFO][0m Testing against LOCALHOST
)

REM Check if .env.local exists
if not exist .env.local (
    echo [91m[ERROR][0m .env.local file not found
    echo Please create .env.local with your Supabase credentials
    exit /b 1
)

REM Load .env.local variables
for /f "usebackq tokens=1,2 delims==" %%a in (".env.local") do (
    set %%a=%%b
)

REM Check required environment variables
set MISSING=0
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo [91m[ERROR][0m Missing NEXT_PUBLIC_SUPABASE_URL
    set MISSING=1
)
if "%NEXT_PUBLIC_SUPABASE_ANON_KEY%"=="" (
    echo [91m[ERROR][0m Missing NEXT_PUBLIC_SUPABASE_ANON_KEY
    set MISSING=1
)
if "%TEST_USER_EMAIL%"=="" (
    echo [91m[ERROR][0m Missing TEST_USER_EMAIL
    set MISSING=1
)
if "%TEST_USER_PASSWORD%"=="" (
    echo [91m[ERROR][0m Missing TEST_USER_PASSWORD
    set MISSING=1
)

if %MISSING%==1 (
    echo.
    echo Add these to your .env.local file:
    echo   TEST_USER_EMAIL="your-test-user@example.com"
    echo   TEST_USER_PASSWORD="your-test-password"
    exit /b 1
)

REM Get authentication token
echo [94m[INFO][0m Getting authentication token...
for /f "delims=" %%i in ('node tests/get-auth-token.js 2^>nul') do set AUTH_TOKEN=%%i

if "%AUTH_TOKEN%"=="" (
    echo [91m[ERROR][0m Failed to get authentication token
    echo Run this to see error details:
    echo   node tests/get-auth-token.js
    exit /b 1
)

echo [92m[SUCCESS][0m Authentication successful
echo.

REM Run validation tests
echo [94m[INFO][0m Running validation tests...
echo.
set SUPABASE_AUTH_TOKEN=%AUTH_TOKEN%
node tests/performance-validation.js

REM Capture exit code
set EXIT_CODE=%ERRORLEVEL%

echo.
if %EXIT_CODE%==0 (
    echo [92m[SUCCESS][0m All tests passed!
) else (
    echo [91m[ERROR][0m Some tests failed
)

exit /b %EXIT_CODE%

