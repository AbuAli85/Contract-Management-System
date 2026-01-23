# Fix npm offline mode and install dependencies

Write-Host "=== Fixing npm offline mode ===" -ForegroundColor Cyan
Write-Host ""

# Remove offline environment variable
if ($env:npm_config_offline) {
    Write-Host "Found npm_config_offline environment variable" -ForegroundColor Yellow
    Remove-Item Env:\npm_config_offline -ErrorAction SilentlyContinue
    Write-Host "✅ Removed npm_config_offline" -ForegroundColor Green
}

# Also check for npm_config_cache_mode
if ($env:npm_config_cache_mode) {
    Write-Host "Found npm_config_cache_mode environment variable" -ForegroundColor Yellow
    Remove-Item Env:\npm_config_cache_mode -ErrorAction SilentlyContinue
    Write-Host "✅ Removed npm_config_cache_mode" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Installing dependencies ===" -ForegroundColor Cyan
Write-Host ""

# Try to install
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now you can run: npm run dev" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Installation failed. Try these steps:" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Check your internet connection" -ForegroundColor Gray
    Write-Host "2. Check if any firewall/proxy is blocking npm" -ForegroundColor Gray
    Write-Host "3. Try: npm install --registry https://registry.npmjs.org/" -ForegroundColor Gray
    Write-Host "4. Or check your npm configuration: npm config list" -ForegroundColor Gray
}
