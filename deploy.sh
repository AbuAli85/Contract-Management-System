#!/bin/bash

echo "🚀 Starting deployment process..."

# Clean build cache
echo "🧹 Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the project
echo "🔨 Building the project..."
pnpm build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update Supabase project settings with your production domain"
echo "2. Verify environment variables in Vercel dashboard"
echo "3. Test authentication flow"
echo ""
echo "🔗 Supabase Dashboard: https://supabase.com/dashboard"
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard" 