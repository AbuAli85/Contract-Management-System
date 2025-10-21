# Error Handling Enhancement Guide

## 📚 Overview

This guide covers the comprehensive error handling system implemented for the Contract Management System. The system provides user-friendly error messages, automatic retry logic, and prevents application crashes through error boundaries.

## 🎯 Components

### 1. Error Boundary (`components/errors/error-boundary.tsx`)

React Error Boundary that catches errors in child components and displays a fallback UI.

**Features:**
- ✅ Catches React component errors
- ✅ Prevents entire app from crashing
- ✅ Logs errors to monitoring services
- ✅ Provides fallback UI
- ✅ Supports error recovery
- ✅ Tracks error count
- ✅ Section-based error isolation

**Usage:**

```tsx
import { ErrorBoundary } from '@/components/errors';

// Wrap any component
<ErrorBoundary section="Contracts">
  <ContractsPage />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary 
  section="Dashboard"
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    console.log('Error occurred:', error);
  }}
>
  <DashboardContent />
</ErrorBoundary>

// As HOC
const SafeComponent = withErrorBoundary(MyComponent, {
  section: 'User Profile',
});
```

### 2. Error Fallback UI (`components/errors/error-fallback.tsx`)

Beautiful, user-friendly error display with actionable guidance.

**Features:**
- ✅ Context-aware error guidance
- ✅ Actionable next steps
- ✅ Copy error details
- ✅ Contact support
- ✅ Retry functionality
- ✅ Technical details (collapsible)
- ✅ Multiple error types detection

**Error Types Detected:**
- Network errors
- Permission errors
- Not found errors
- Timeout errors
- Validation errors
- Generic errors

### 3. Specific Error Components (`components/errors/error-types.tsx`)

Pre-built error components for common scenarios.

**Available Components:**
- `<NetworkError />` - Connection issues
- `<PermissionError />` - 403 Forbidden
- `<NotFoundError />` - 404 Not Found
- `<TimeoutError />` - Request timeouts
- `<ValidationError />` - Input validation
- `<DatabaseError />` - Database issues
- `<ServerError />` - 500 errors
- `<RateLimitError />` - 429 Too Many Requests
- `<AutoError />` - Automatically selects type

**Usage:**

```tsx
import { NetworkError, PermissionError, AutoError } from '@/components/errors';

// Specific error type
{isNetworkError && (
  <NetworkError 
    message="Could not connect to server"
    onRetry={handleRetry}
  />
)}

// Auto-detect error type
{error && (
  <AutoError 
    error={error}
    onRetry={handleRetry}
    showRetry={true}
  />
)}

// Permission error
{!hasAccess && (
  <PermissionError 
    message="You need admin privileges"
    onRetry={checkPermissionsAgain}
  />
)}
```

### 4. Retry Utilities (`lib/utils/retry.ts`)

Intelligent retry mechanisms with exponential backoff.

**Features:**
- ✅ Exponential backoff
- ✅ Configurable attempts
- ✅ Error filtering
- ✅ Rate limit handling
- ✅ Circuit breaker pattern
- ✅ Batch operations
- ✅ Predefined strategies

**Usage:**

```typescript
import { retryAsync, RetryStrategies, CircuitBreaker } from '@/lib/utils/retry';

// Basic retry
const data = await retryAsync(
  () => fetch('/api/data').then(r => r.json()),
  {
    maxAttempts: 3,
    initialDelay: 1000,
  }
);

// With predefined strategy
const data = await retryAsync(
  () => fetchData(),
  RetryStrategies.networkOnly
);

// Custom retry logic
const data = await retryAsync(
  () => apiCall(),
  {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 5000,
    shouldRetry: (error, attempt) => {
      // Only retry on specific errors
      return error.status === 500 && attempt < 3;
    },
    onRetry: (error, attempt, delay) => {
      console.log(`Retrying in ${delay}ms...`);
    },
  }
);

// Circuit breaker
const breaker = new CircuitBreaker(5, 60000);
const data = await breaker.execute(
  () => apiCall(),
  { maxAttempts: 3 }
);
```

**Predefined Strategies:**
- `RetryStrategies.networkOnly` - Retry network errors only
- `RetryStrategies.serverErrors` - Retry 5xx errors
- `RetryStrategies.timeouts` - Retry timeouts
- `RetryStrategies.aggressive` - More attempts, faster
- `RetryStrategies.conservative` - Fewer attempts, slower
- `RetryStrategies.none` - No retries

### 5. React Hooks (`hooks/use-retry.ts`)

Easy-to-use React hooks for retry logic.

**Available Hooks:**
- `useRetry` - Generic retry hook
- `useFetchWithRetry` - Fetch with retry
- `useMutationWithRetry` - Mutations with retry

**Usage:**

```tsx
import { useRetry, useFetchWithRetry, useMutationWithRetry } from '@/hooks/use-retry';

// Generic retry hook
function MyComponent() {
  const { data, error, isLoading, isRetrying, retryAttempt, execute } = useRetry(
    async (id: string) => {
      const res = await fetch(`/api/contracts/${id}`);
      return res.json();
    },
    { maxAttempts: 3, initialDelay: 1000 }
  );

  useEffect(() => {
    execute('contract-123');
  }, []);

  if (isRetrying) {
    return <div>Retrying... (Attempt {retryAttempt})</div>;
  }

  return <div>{data}</div>;
}

// Fetch with retry
function ContractsList() {
  const { data, error, isLoading, execute: refetch } = useFetchWithRetry(
    '/api/contracts',
    { method: 'GET' },
    { maxAttempts: 3 }
  );

  if (error) {
    return <AutoError error={error} onRetry={refetch} />;
  }

  return <div>{/* render data */}</div>;
}

// Mutation with retry
function CreateContract() {
  const { mutate, isLoading, error } = useMutationWithRetry(
    async (data) => {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    {
      maxAttempts: 2,
      onSuccess: (data) => {
        toast({ title: 'Contract created!' });
      },
      onError: (error) => {
        toast({ title: 'Failed to create contract', variant: 'destructive' });
      },
    }
  );

  return (
    <Button onClick={() => mutate({ name: 'New Contract' })}>
      {isLoading ? 'Creating...' : 'Create Contract'}
    </Button>
  );
}
```

## 🚀 Implementation Steps

### Step 1: Wrap Major Sections with Error Boundaries

```tsx
// app/[locale]/contracts/page.tsx
import { ErrorBoundary } from '@/components/errors';

export default function ContractsPage() {
  return (
    <ErrorBoundary section="Contracts">
      <ContractsContent />
    </ErrorBoundary>
  );
}
```

### Step 2: Add Error Boundaries to Layout

```tsx
// app/[locale]/layout.tsx
import { ErrorBoundary } from '@/components/errors';

export default function DashboardLayout({ children }) {
  return (
    <ErrorBoundary section="Dashboard">
      {children}
    </ErrorBoundary>
  );
}
```

### Step 3: Replace Generic Error Messages

**Before:**
```tsx
if (error) {
  return <div>Oops! Something went wrong.</div>;
}
```

**After:**
```tsx
import { AutoError } from '@/components/errors';

if (error) {
  return <AutoError error={error} onRetry={refetch} />;
}
```

### Step 4: Add Retry Logic to API Calls

**Before:**
```tsx
const fetchContracts = async () => {
  const res = await fetch('/api/contracts');
  return res.json();
};
```

**After:**
```tsx
import { retryAsync, RetryStrategies } from '@/lib/utils/retry';

const fetchContracts = async () => {
  return retryAsync(
    async () => {
      const res = await fetch('/api/contracts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    RetryStrategies.networkOnly
  );
};
```

### Step 5: Update React Query Hooks

```tsx
import { useQuery } from '@tanstack/react-query';
import { retryAsync, RetryStrategies } from '@/lib/utils/retry';

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: () => retryAsync(
      () => fetch('/api/contracts').then(r => r.json()),
      RetryStrategies.networkOnly
    ),
    // React Query's built-in retry is also good, but our retry provides more control
    retry: false, // Disable React Query retry, use our own
  });
}
```

## 📋 Error Message Guidelines

### ✅ Good Error Messages

```
❌ Bad: "Error occurred"
✅ Good: "Unable to load contracts. Please check your internet connection."

❌ Bad: "Failed"
✅ Good: "Failed to save contract. The server may be temporarily unavailable. Please try again in a moment."

❌ Bad: "Access denied"
✅ Good: "You don't have permission to view this contract. Please contact your administrator for access."
```

### Error Message Template

```
[What happened] + [Why it might have happened] + [What to do next]

Example:
"Unable to connect to the server. Your internet connection may be unstable. Please check your connection and try again."
```

## 🎨 Error Display Best Practices

1. **Always provide context** - Tell users what they were trying to do
2. **Be specific** - "Unable to load contracts" not "Error loading data"
3. **Provide actions** - Always offer "Try Again" or "Go Back"
4. **Show progress** - Display retry attempts: "Retrying... (Attempt 2 of 3)"
5. **Technical details** - Make them available but collapsed by default
6. **Contact option** - Always provide a way to reach support

## 🔧 Configuration

### Environment Variables

```env
# Error Handling
NEXT_PUBLIC_MAX_RETRY_ATTEMPTS=3
NEXT_PUBLIC_RETRY_INITIAL_DELAY=1000
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true

# Monitoring (optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Global Error Handler

```tsx
// app/providers.tsx
import { ErrorBoundary } from '@/components/errors';

export function Providers({ children }) {
  return (
    <ErrorBoundary section="Application">
      {children}
    </ErrorBoundary>
  );
}
```

## 📊 Monitoring Integration

### Sentry Integration (Optional)

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

export function initMonitoring() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });
  }
}

// In error-boundary.tsx
private logErrorToService(error: Error, errorInfo: ErrorInfo) {
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        section: this.props.section,
      },
    });
  }
}
```

## ✅ Acceptance Criteria Checklist

- [ ] No generic "Oops!" or "Something went wrong" messages
- [ ] All errors include specific information
- [ ] All errors provide actionable next steps
- [ ] Error boundaries prevent page crashes
- [ ] Retry logic handles transient failures
- [ ] Users can contact support with pre-filled error details
- [ ] Technical details available but not intrusive
- [ ] Retry attempts are visible to users
- [ ] Network errors automatically retry
- [ ] Rate limit errors show wait time
- [ ] Permission errors guide users to correct action

## 🎯 Testing Error Handling

### Manual Testing

```tsx
// Test component for error scenarios
function ErrorTest() {
  const [errorType, setErrorType] = useState<string | null>(null);

  if (errorType === 'network') {
    throw new Error('Failed to fetch: Network error');
  }

  if (errorType === 'permission') {
    throw new Error('Permission denied: 403 Forbidden');
  }

  return (
    <div>
      <Button onClick={() => setErrorType('network')}>
        Test Network Error
      </Button>
      <Button onClick={() => setErrorType('permission')}>
        Test Permission Error
      </Button>
    </div>
  );
}
```

### Automated Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/errors';

describe('ErrorBoundary', () => {
  it('catches errors and displays fallback', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary section="Test">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });
});
```

## 📚 Additional Resources

- **Error Boundary Component**: `components/errors/error-boundary.tsx`
- **Error Fallback UI**: `components/errors/error-fallback.tsx`
- **Error Types**: `components/errors/error-types.tsx`
- **Retry Utilities**: `lib/utils/retry.ts`
- **React Hooks**: `hooks/use-retry.ts`

---

**Status**: ✅ Complete  
**Last Updated**: October 21, 2025  
**Version**: 1.0.0

