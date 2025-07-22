# 🚀 Quick Deploy Script with Environment Variables

Write-Host "🚀 Quick Deploy with Environment Variables Setup" -ForegroundColor Green

# Environment variables to set
$envVars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "https://ekdjxzhujettocosgzql.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4emh1amV0dG9jb3NnenFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTkxMDYsImV4cCI6MjA2NDg5NTEwNn0.6VGbocKFVLNX_MCIOwFtdEssMk6wd_UQ5yNT1CfV6BA"
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4emh1amV0dG9jb3NnenFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMxOTEwNiwiZXhwIjoyMDY0ODk1MTA2fQ.dAf5W8m9Q8FGlLY19Lo2x8JYSfq3RuFMAsHaPcH3F7A"
    "MAKE_WEBHOOK_URL" = "https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4"
    "NEXT_PUBLIC_MAKE_WEBHOOK_URL" = "https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4"
    "MAKE_WEBHOOK_SECRET" = "71go2x4zwsnha4r1f4en1g9gjxpk3ts4"
    "SLACK_WEBHOOK_URL" = "https://hook.eu2.make.com/fwu4cspy92s2m4aw1vni46cu0m89xvp8"
    "SLACK_WEBHOOK_SECRET" = "fwu4cspy92s2m4aw1vni46cu0m89xvp8"
    "NEXT_PUBLIC_SLACK_WEBHOOK_URL" = "https://hook.eu2.make.com/fwu4cspy92s2m4aw1vni46cu0m89xvp8"
}

Write-Host "`n📋 Setting up environment variables..." -ForegroundColor Cyan

foreach ($key in $envVars.Keys) {
    Write-Host "Setting up $key..." -ForegroundColor Blue
    echo $envVars[$key] | npx vercel env add $key production
}

Write-Host "`n✅ Environment variables set up!" -ForegroundColor Green

Write-Host "`n🚀 Deploying to production..." -ForegroundColor Cyan
npx vercel --prod

Write-Host "`n🎉 Deployment completed!" -ForegroundColor Green 