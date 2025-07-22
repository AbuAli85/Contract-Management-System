# 🚀 Quick Deployment Script for Contract Management System

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Check if git is clean
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Warning: You have uncommitted changes!" -ForegroundColor Yellow
    Write-Host "Changes found:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    $response = Read-Host "Do you want to commit changes before deploying? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        git add .
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        if (-not $commitMessage) {
            $commitMessage = "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        }
        git commit -m $commitMessage
        git push origin main
        Write-Host "✅ Changes committed and pushed!" -ForegroundColor Green
    }
}

# Check if build passes
Write-Host "🔨 Building project..." -ForegroundColor Blue
pnpm build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Ask for deployment method
    Write-Host "`n📋 Choose deployment method:" -ForegroundColor Cyan
    Write-Host "1. Vercel (Recommended)" -ForegroundColor White
    Write-Host "2. Netlify" -ForegroundColor White
    Write-Host "3. Railway" -ForegroundColor White
    Write-Host "4. Manual deployment" -ForegroundColor White
    
    $choice = Read-Host "Enter your choice (1-4)"
    
    switch ($choice) {
        "1" {
            Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
            Write-Host "Note: You'll need to:" -ForegroundColor Yellow
            Write-Host "1. Have a Vercel account" -ForegroundColor Yellow
            Write-Host "2. Be logged in to Vercel CLI" -ForegroundColor Yellow
            Write-Host "3. Configure environment variables" -ForegroundColor Yellow
            
            $deploy = Read-Host "Continue with Vercel deployment? (y/n)"
            if ($deploy -eq 'y' -or $deploy -eq 'Y') {
                npx vercel --prod
            }
        }
        "2" {
            Write-Host "🌐 Netlify deployment instructions:" -ForegroundColor Green
            Write-Host "1. Go to https://netlify.com" -ForegroundColor White
            Write-Host "2. Click 'New site from Git'" -ForegroundColor White
            Write-Host "3. Connect your GitHub repository" -ForegroundColor White
            Write-Host "4. Set build command: pnpm build" -ForegroundColor White
            Write-Host "5. Set publish directory: .next" -ForegroundColor White
            Write-Host "6. Add environment variables from env.example" -ForegroundColor White
        }
        "3" {
            Write-Host "🚂 Railway deployment instructions:" -ForegroundColor Green
            Write-Host "1. Go to https://railway.app" -ForegroundColor White
            Write-Host "2. Click 'New Project' > 'Deploy from GitHub repo'" -ForegroundColor White
            Write-Host "3. Select your repository" -ForegroundColor White
            Write-Host "4. Add environment variables from env.example" -ForegroundColor White
        }
        "4" {
            Write-Host "📖 Manual deployment steps:" -ForegroundColor Green
            Write-Host "1. Push code to GitHub" -ForegroundColor White
            Write-Host "2. Choose a deployment platform" -ForegroundColor White
            Write-Host "3. Connect your repository" -ForegroundColor White
            Write-Host "4. Configure environment variables" -ForegroundColor White
            Write-Host "5. Deploy!" -ForegroundColor White
        }
        default {
            Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Build failed! Please fix the errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Deployment process completed!" -ForegroundColor Green
Write-Host "📖 Check DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan 