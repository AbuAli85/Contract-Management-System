const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ULTRA-FAST development server...');

// Clear all possible caches
const cachesToClear = [
  '.next',
  'node_modules/.cache',
  '.turbo',
  'dist',
  'build'
];

cachesToClear.forEach(cachePath => {
  const fullPath = path.join(process.cwd(), cachePath);
  if (fs.existsSync(fullPath)) {
    console.log(`🧹 Clearing ${cachePath}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (error) {
      console.log(`⚠️  Could not clear ${cachePath}:`, error.message);
    }
  }
});

// Set aggressive environment variables for faster development
process.env.NODE_ENV = 'development';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_SHARP_PATH = 'false';
process.env.NEXT_DISABLE_SOURCEMAPS = '1';
process.env.NEXT_DISABLE_OPTIMIZATION = '1';

console.log('⚡ Starting ultra-fast development server...');

try {
  // Start the development server with ultra-aggressive settings
  execSync('next dev --turbo', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096 --no-warnings',
      NEXT_TURBO: '1',
      NEXT_DISABLE_SOURCEMAPS: '1',
      NEXT_DISABLE_OPTIMIZATION: '1',
      ESLINT_NO_DEV_ERRORS: 'true',
      TYPESCRIPT_IGNORE_BUILD_ERRORS: 'true',
    }
  });
} catch (error) {
  console.error('❌ Failed to start development server:', error.message);
  process.exit(1);
} 