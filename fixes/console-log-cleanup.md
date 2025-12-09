# Fix: Remove Excessive console.log Statements

## Issue

The production codebase contains 50+ `console.log` statements that clutter the browser console and may impact performance.

## Impact

- Performance overhead in production
- Cluttered browser console
- Unprofessional appearance
- Potential security risk (logging sensitive data)

## Solution

### Option 1: Remove All console.log Statements

**Step 1: Find all console statements**

```bash
grep -r "console\." app/ components/ lib/ --include="*.ts" --include="*.tsx" > console-statements.txt
```

**Step 2: Review and remove**

Manually review each file and remove or comment out console statements.

### Option 2: Use Environment-Based Logging (Recommended)

**Step 1: Create a logging utility**

Create `lib/logger.ts`:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};
```

**Step 2: Replace console.log with logger**

**Before:**

```typescript
console.log('🔍 Fetching contracts...');
```

**After:**

```typescript
import { logger } from '@/lib/logger';

logger.log('🔍 Fetching contracts...');
```

### Option 3: Use a Proper Logging Library

For production-grade logging, consider using:

- **Winston** - Flexible logging library
- **Pino** - High-performance logger
- **Sentry** - Error tracking and logging

**Example with Winston:**

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});
```

## Files with Most console.log Statements

Based on the scan, prioritize these files:

1. `app/[locale]/contracts/approved/page.tsx` - 10+ statements
2. `app/[locale]/contracts/pending/page.tsx` - 10+ statements
3. `app/[locale]/contracts/page.tsx` - Multiple statements
4. `app/api/compliance/documents/route.ts` - 4 statements
5. `middleware.ts` - Multiple statements

## Verification

1. Search for remaining console statements:
   ```bash
   grep -r "console\." app/ components/ lib/ --include="*.ts" --include="*.tsx"
   ```
2. Verify browser console is clean in production
3. Check that errors are still being logged appropriately

## ESLint Rule (Prevention)

Add this to `.eslintrc.json` to prevent future console.log statements:

```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["error", "warn"] }]
  }
}
```
