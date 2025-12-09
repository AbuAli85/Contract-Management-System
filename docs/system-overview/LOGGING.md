# Logging Guide

This document describes the logging infrastructure and best practices for the Contract Management System.

## Overview

The system uses a structured logger located at `lib/utils/logger.ts` that provides:

- **Structured logging** with JSON output in production
- **Contextual information** (requestId, userId, endpoint, etc.)
- **Log levels** (debug, info, warn, error, fatal)
- **Specialized methods** for API requests, database queries, auth events
- **Scoped loggers** for consistent context across related operations

## Usage

### Import the Logger

```typescript
import { logger } from '@/lib/utils/logger';
```

### Basic Logging

```typescript
// Simple messages
logger.debug('Processing started');
logger.info('User created successfully');
logger.warn('Rate limit approaching');
logger.error('Failed to process request', undefined, error);
logger.fatal('Database connection lost', undefined, error);
```

### Logging with Context

```typescript
logger.info('Contract created', {
  contractId: contract.id,
  userId: user.id,
  contractType: 'full-time-permanent',
});
```

### API Request Logging

```typescript
// In API routes
const requestId = crypto.randomUUID();

// Start of request
logger.apiRequestStart(requestId, '/api/contracts', 'POST');

try {
  // ... process request ...

  // Success
  logger.apiRequestComplete(requestId, 200, Date.now() - startTime);
} catch (error) {
  logger.apiRequestError(requestId, error, { userId: user.id });
}
```

### Database Query Logging

```typescript
const start = Date.now();

const { data, error } = await supabase.from('contracts').select('*');

if (error) {
  logger.dbError('contracts', 'select', error);
} else {
  logger.dbQuery('contracts', 'select', Date.now() - start);
}
```

### Authentication Event Logging

```typescript
// Successful login
logger.authEvent('login', user.id, true, { method: 'password' });

// Failed login
logger.authEvent('login', undefined, false, { reason: 'invalid_password' });
```

### RBAC Check Logging

```typescript
logger.rbacCheck('contracts:create', user.id, hasPermission);
```

### Scoped Loggers

For request-specific logging with consistent context:

```typescript
const requestLogger = logger.createScoped({
  requestId: crypto.randomUUID(),
  endpoint: '/api/contracts',
  userId: user.id,
});

// All logs will include the scoped context
requestLogger.info('Processing contract');
requestLogger.debug('Validating data');
requestLogger.info('Contract saved');
```

## Log Levels

| Level   | Usage                                     |
| ------- | ----------------------------------------- |
| `debug` | Development only, detailed debugging info |
| `info`  | Normal operations, audit trail            |
| `warn`  | Potential issues, degraded performance    |
| `error` | Errors that were handled                  |
| `fatal` | Critical failures, system unavailable     |

## Best Practices

### DO

✅ Use structured context instead of string interpolation:

```typescript
// Good
logger.info('Contract created', { contractId: id, userId });

// Bad
console.log(`Contract ${id} created by ${userId}`);
```

✅ Include relevant context for debugging:

```typescript
logger.error(
  'Payment failed',
  {
    userId: user.id,
    amount: payment.amount,
    currency: payment.currency,
  },
  error
);
```

✅ Use appropriate log levels:

```typescript
logger.debug('Entering function'); // Development debugging
logger.info('User signed up'); // Business events
logger.warn('Retry attempt 2/3'); // Potential issues
logger.error('Payment failed'); // Errors
```

### DON'T

❌ Don't log sensitive data:

```typescript
// Bad - logs password
logger.info('Login attempt', { email, password });

// Good - omit sensitive data
logger.info('Login attempt', { email });
```

❌ Don't use console.log in production code:

```typescript
// Bad
console.log('User created:', user);

// Good
logger.info('User created', { userId: user.id });
```

❌ Don't log in tight loops:

```typescript
// Bad - logs thousands of times
for (const item of items) {
  logger.debug('Processing item', { itemId: item.id });
}

// Good - log summary
logger.info('Processing batch', { count: items.length });
```

## Environment-Specific Behavior

### Development

- Debug logs are shown
- Formatted with emojis and colors
- Full error stacks displayed

### Production

- Debug logs are suppressed
- JSON format for log aggregation
- Errors sent to external monitoring (TODO)

## Migration from console.log

When migrating existing code:

1. Replace `console.log` with appropriate logger method
2. Convert string messages to structured context
3. Add error objects to error/warn calls

```typescript
// Before
console.log('Error fetching contracts:', error);

// After
logger.error('Failed to fetch contracts', { userId }, error);
```

## Future Improvements

- [ ] Integration with Sentry for error tracking
- [ ] Integration with DataDog/LogRocket for log aggregation
- [ ] Request tracing across services
- [ ] Performance metrics logging
- [ ] Audit log persistence to database
