#!/bin/bash

# ========================================
# 🚀 Real-Time Dashboard Development Setup
# ========================================

echo "🔧 Setting up Real-Time Dashboard Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}📝 Creating .env.local file...${NC}"
    cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NDQzODIsImV4cCI6MjA2OTAyMDM4Mn0.WQwDpYX2M4pyPaliUqTinwy1xWWFKm4OntN2HUfP6n0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE

# Development Configuration
NODE_ENV=development
EOL
    echo -e "${GREEN}✅ .env.local created successfully!${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Build the project
echo -e "${BLUE}🔨 Building the project...${NC}"
npm run build

# Check build status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Development environment setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "1. ${BLUE}Run test accounts SQL:${NC}"
echo -e "   - Open Supabase Dashboard → SQL Editor"
echo -e "   - Run: ${YELLOW}scripts/create-test-accounts.sql${NC}"
echo ""
echo -e "2. ${BLUE}Start development server:${NC}"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo -e "3. ${BLUE}Test login credentials:${NC}"
echo -e "   Provider: ${YELLOW}provider@test.com${NC} / ${YELLOW}TestPass123!${NC}"
echo -e "   Client: ${YELLOW}client@test.com${NC} / ${YELLOW}TestPass123!${NC}"
echo ""
echo -e "4. ${BLUE}Access dashboards:${NC}"
echo -e "   Provider: ${YELLOW}http://localhost:3000/en/dashboard/provider-comprehensive${NC}"
echo -e "   Client: ${YELLOW}http://localhost:3000/en/dashboard/client-comprehensive${NC}"
echo ""
echo -e "${GREEN}🚀 Happy coding!${NC}"