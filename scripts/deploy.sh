#!/bin/bash

# 🚀 One-Command Deployment Script
# Automates the deployment process with validation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Starting Deployment Process...${NC}\n"

# Step 1: Validate deployment
echo -e "${CYAN}Step 1: Validating deployment readiness...${NC}"
if command -v tsx &> /dev/null; then
  if npx tsx scripts/validate-deployment.ts; then
    echo -e "${GREEN}✅ Validation passed${NC}\n"
  else
    echo -e "${RED}❌ Validation failed. Please fix issues before deploying.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  tsx not found, skipping validation. Run 'npm run validate:deployment' manually.${NC}\n"
fi

# Step 2: Test build
echo -e "${CYAN}Step 2: Testing build...${NC}"
read -p "Run build test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}\n"
  else
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  Skipping build test${NC}\n"
fi

# Step 3: Check git status
echo -e "${CYAN}Step 3: Checking git status...${NC}"
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  No changes to commit${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
  fi
else
  echo -e "${GREEN}✅ Changes detected${NC}"
  git status --short
  echo
fi

# Step 4: Commit changes
echo -e "${CYAN}Step 4: Committing changes...${NC}"
read -p "Commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
  commit_msg="feat: Add retry logic, correlation IDs, and enhanced auth resilience"
fi

git add .
if git commit -m "$commit_msg"; then
  echo -e "${GREEN}✅ Changes committed${NC}\n"
else
  echo -e "${RED}❌ Commit failed${NC}"
  exit 1
fi

# Step 5: Deploy
echo -e "${CYAN}Step 5: Deploying to production...${NC}"
read -p "Push to origin/main? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if git push origin main; then
    echo -e "${GREEN}✅ Pushed to origin/main${NC}\n"
    echo -e "${GREEN}🎉 Deployment initiated!${NC}\n"
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "1. Monitor deployment: https://vercel.com/dashboard"
    echo -e "2. Wait for build to complete (~2-3 minutes)"
    echo -e "3. Verify: curl -I https://portal.thesmartpro.io/api/diagnostics/env-check"
    echo -e "4. Test login: https://portal.thesmartpro.io/en/auth/login"
    echo -e "5. Monitor logs: vercel logs production --follow"
  else
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  Deployment cancelled${NC}"
  exit 0
fi

echo -e "\n${GREEN}✅ Deployment process complete!${NC}"
