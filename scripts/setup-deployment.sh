#!/bin/bash

# Deployment Environment Setup Script
# This script helps configure and verify the deployment environment

set -e

echo "🚀 Contract Management System - Deployment Setup"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check environment variable
check_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        print_status "error" "Missing environment variable: $var_name"
        return 1
    else
        print_status "success" "Environment variable $var_name is set"
        return 0
    fi
}

echo ""
print_status "info" "Checking prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "success" "Node.js found: $NODE_VERSION"
else
    print_status "error" "Node.js not found. Please install Node.js 20+"
    exit 1
fi

# Check pnpm
if command_exists pnpm; then
    PNPM_VERSION=$(pnpm --version)
    print_status "success" "pnpm found: $PNPM_VERSION"
else
    print_status "error" "pnpm not found. Please install pnpm"
    exit 1
fi

# Check Supabase CLI
if command_exists supabase; then
    SUPABASE_VERSION=$(supabase --version)
    print_status "success" "Supabase CLI found: $SUPABASE_VERSION"
else
    print_status "warning" "Supabase CLI not found. Install with: npm install -g supabase"
fi

# Check Vercel CLI
if command_exists vercel; then
    VERCEL_VERSION=$(vercel --version)
    print_status "success" "Vercel CLI found: $VERCEL_VERSION"
else
    print_status "warning" "Vercel CLI not found. Install with: npm install -g vercel"
fi

echo ""
print_status "info" "Checking environment variables..."

# Check required environment variables
ENV_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

MISSING_VARS=0
for var in "${ENV_VARS[@]}"; do
    if ! check_env_var "$var"; then
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
done

if [ $MISSING_VARS -gt 0 ]; then
    print_status "error" "Missing $MISSING_VARS required environment variables"
    echo ""
    print_status "info" "Please set the following environment variables:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
    print_status "info" "You can copy from env.example and update with your values:"
    echo "  cp env.example .env.local"
    exit 1
fi

echo ""
print_status "info" "Checking project dependencies..."

# Check if node_modules exists
if [ -d "node_modules" ]; then
    print_status "success" "Dependencies installed"
else
    print_status "warning" "Dependencies not installed. Installing now..."
    pnpm install
fi

echo ""
print_status "info" "Running health checks..."

# Run database health check
if command_exists tsx; then
    print_status "info" "Running database health check..."
    if pnpm run db:health-check > /dev/null 2>&1; then
        print_status "success" "Database health check passed"
    else
        print_status "error" "Database health check failed"
        print_status "info" "Run 'pnpm run db:health-check' for detailed output"
    fi
else
    print_status "warning" "tsx not found. Install with: npm install -g tsx"
fi

# Run linting
print_status "info" "Running linting check..."
if pnpm run lint > /dev/null 2>&1; then
    print_status "success" "Linting passed"
else
    print_status "warning" "Linting failed. Run 'pnpm run lint' for details"
fi

# Run unit tests
print_status "info" "Running unit tests..."
if pnpm run test:unit > /dev/null 2>&1; then
    print_status "success" "Unit tests passed"
else
    print_status "warning" "Unit tests failed. Run 'pnpm run test:unit' for details"
fi

echo ""
print_status "info" "Checking deployment configuration..."

# Check Vercel configuration
if [ -f "vercel.json" ]; then
    print_status "success" "Vercel configuration found"
else
    print_status "error" "vercel.json not found"
fi

# Check vercel-build.json
if [ -f "vercel-build.json" ]; then
    print_status "success" "Vercel build configuration found"
else
    print_status "error" "vercel-build.json not found"
fi

# Check GitHub Actions workflows
if [ -d ".github/workflows" ]; then
    WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" | wc -l)
    print_status "success" "Found $WORKFLOW_COUNT GitHub Actions workflows"
else
    print_status "error" "GitHub Actions workflows directory not found"
fi

echo ""
print_status "info" "Deployment setup summary:"

echo ""
echo "📋 Next Steps:"
echo "=============="

if [ -f ".env.local" ]; then
    print_status "success" "Environment file (.env.local) exists"
else
    print_status "warning" "Create .env.local file: cp env.example .env.local"
fi

if command_exists vercel; then
    print_status "info" "To deploy to Vercel:"
    echo "  pnpm run deploy:preview     # Preview deployment"
    echo "  pnpm run deploy:production  # Production deployment"
else
    print_status "warning" "Install Vercel CLI: npm install -g vercel"
fi

if command_exists supabase; then
    print_status "info" "To manage database:"
    echo "  pnpm run supabase:deploy    # Deploy migrations"
    echo "  pnpm run db:health-check    # Check database health"
else
    print_status "warning" "Install Supabase CLI: npm install -g supabase"
fi

print_status "info" "To run full CI pipeline locally:"
echo "  pnpm run ci:full"

echo ""
print_status "info" "For detailed deployment information, see:"
echo "  docs/DEPLOYMENT_GUIDE.md"

echo ""
print_status "success" "Deployment setup check completed!"
echo ""

# Check if running in CI environment
if [ -n "$CI" ]; then
    print_status "info" "Running in CI environment - skipping interactive setup"
else
    read -p "Would you like to run a full deployment validation? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        print_status "info" "Running full deployment validation..."
        pnpm run deploy:validate
    fi
fi