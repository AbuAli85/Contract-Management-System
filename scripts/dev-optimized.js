const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting optimized development server...');

// Clear Next.js cache
const nextCachePath = path.join(process.cwd(), '.next');
if (fs.existsSync(nextCachePath)) {
  console.log('🧹 Clearing Next.js cache...');
  fs.rmSync(nextCachePath, { recursive: true, force: true });
}

// Set environment variables for faster development
process.env.NODE_ENV = 'development';
process.env.NEXT_TELEMETRY_DISABLED = '1';

console.log('⚡ Starting development server with optimizations...');

try {
  // Start the development server with optimized settings
  execSync('next dev', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
    },
  });
} catch (error) {
  console.error('❌ Failed to start development server:', error.message);
  process.exit(1);
}
