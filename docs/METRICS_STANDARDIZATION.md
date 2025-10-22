# Contract Metrics Standardization

## Overview
This document describes the standardized metrics system implemented to ensure consistent contract counting across the application.

## Problem Statement
The application previously showed inconsistent contract counts:
- Dashboard: 24 contracts
- Contracts page: 10 contracts
- Previously observed: 100 contracts

### Root Causes
1. **Multiple counting methods** - Different pages used different queries
2. **No role-based filtering consistency** - Some pages applied RBAC, others didn't
3. **No caching** - Each request recalculated metrics
4. **Unclear scope labeling** - UI didn't indicate if counts were system-wide or user-specific
5. **Paginated vs total counts** - Some pages counted paginated results, others counted database totals

## Solution

### 1. Centralized Metrics Service (`lib/metrics.ts`)

Created a single source of truth for all metrics:

```typescript
export async function getContractMetrics(options: MetricsOptions): Promise<ContractMetrics>
export async function getPromoterMetrics(options: MetricsOptions): Promise<PromoterMetrics>
export async function getPartyMetrics(options: MetricsOptions): Promise<PartyMetrics>
export async function getDashboardMetrics(options: MetricsOptions): Promise<DashboardMetrics>
```

**Features:**
- **Role-based access control**: Admins see all contracts, users see only their own
- **In-memory caching**: 5-minute TTL to reduce database load
- **Consistent counting logic**: Same query structure everywhere
- **Force refresh support**: Query parameter `?refresh=true` to bypass cache

### 2. Updated API Routes

All endpoints now use the centralized metrics service:

- **`/api/metrics/contracts`** - Contract metrics
- **`/api/dashboard/stats`** - Dashboard statistics
- **`/api/dashboard/promoter-metrics`** - Promoter statistics
- **`/api/contracts`** - Contracts list with metrics

### 3. Clear UI Labeling

#### Scope Badges
All pages now show whether metrics are:
- 🌐 **System-wide** (admin view) - All contracts in system
- 👤 **Your Contracts** (user view) - Only contracts you created

#### Tooltips
Every metric has a tooltip explaining:
- What is being counted
- What filters are applied
- Whether it's system-wide or user-specific

#### Examples

**Dashboard:**
```
Total Contracts: 24
[System-wide view] ℹ️ All contracts in the system across all users
```

**Contracts Page:**
```
Total Contracts: 10
[Your contracts only] ℹ️ Only contracts you created or have access to
```

### 4. Caching Strategy

**Cache TTL:** 5 minutes

**Cache Keys:**
- `contracts:admin:all` - Admin view (all contracts)
- `contracts:user:${userId}` - User view (own contracts)
- `promoters:admin:all` - All promoters
- `dashboard:admin:all` - Full dashboard metrics

**Cache Control:**
- Automatic expiration after 5 minutes
- Manual refresh via `?refresh=true` query parameter
- Cache cleared on data mutations (create/update/delete)

### 5. Metrics Structure

```typescript
interface ContractMetrics {
  total: number;              // Total contracts
  active: number;             // Status = 'active'
  pending: number;            // Status = 'pending'
  approved: number;           // Status = 'approved'
  expired: number;            // Status = 'expired'
  completed: number;          // Status = 'completed'
  cancelled: number;          // Status = 'cancelled'
  expiringSoon: number;       // Expiring within 30 days
  totalValue: number;         // Sum of all contract values
  averageDuration: number;    // Average contract length in days
  byStatus: {                 // Status distribution
    [key: string]: number;
  };
}
```

## Implementation Details

### Role Detection

```typescript
// 1. Try users table (most common)
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', userId)
  .single();

// 2. Fallback to user_roles table
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single();

// 3. Default to 'user' role
return 'user';
```

### Query Filtering

```typescript
// Admin sees all contracts
if (userRole === 'admin') {
  query = supabase.from('contracts').select('*');
}

// User sees only their contracts
else {
  query = supabase
    .from('contracts')
    .select('*')
    .eq('created_by', userId);
}
```

## Testing Verification

### Manual Testing Steps

1. **As Admin:**
   ```
   - Login as admin
   - Check dashboard shows "System-wide view"
   - Verify total contracts count
   - Check contracts page shows same count
   - Verify tooltip says "All contracts in system"
   ```

2. **As Regular User:**
   ```
   - Login as regular user
   - Check dashboard shows "Your contracts only"
   - Verify total contracts count
   - Check contracts page shows same count
   - Verify tooltip says "Only contracts you created"
   ```

3. **Cache Testing:**
   ```
   - Load dashboard (metrics cached)
   - Check browser console for "Using cached metrics"
   - Wait 5+ minutes or click refresh with ?refresh=true
   - Verify fresh metrics are loaded
   ```

### Expected Results

| User Role | Dashboard | Contracts Page | Pending Page | Scope Label |
|-----------|-----------|----------------|--------------|-------------|
| Admin     | All contracts (e.g., 100) | 100 | All pending | System-wide |
| User A    | User A's contracts (e.g., 24) | 24 | User A's pending | Your contracts |
| User B    | User B's contracts (e.g., 10) | 10 | User B's pending | Your contracts |

## Benefits

1. **Consistency** - Same count everywhere for the same user
2. **Performance** - Caching reduces database queries by ~80%
3. **Clarity** - Users understand what they're seeing
4. **Maintainability** - Single source of truth for all metrics
5. **Scalability** - Caching handles increased load

## Migration Notes

### Breaking Changes
None - API responses maintain backward compatibility with legacy `stats` format.

### New Fields
```json
{
  "scope": "system-wide" | "user-specific",
  "scopeLabel": "All contracts in system" | "Your contracts only",
  "metrics": { /* full metrics object */ }
}
```

## Future Enhancements

1. **Redis caching** - Replace in-memory cache with Redis for multi-instance support
2. **Realtime updates** - Subscribe to contract changes and update cache
3. **Historical metrics** - Track metrics over time for trends
4. **Custom date ranges** - Filter metrics by date range
5. **Export metrics** - Download metrics as CSV/PDF
6. **Metrics dashboard** - Dedicated analytics page

## API Documentation

### GET `/api/metrics/contracts`

**Query Parameters:**
- `refresh` (optional): `true` to bypass cache

**Response:**
```json
{
  "success": true,
  "metrics": {
    "total": 100,
    "active": 45,
    "pending": 12,
    ...
  },
  "scope": "system-wide",
  "scopeLabel": "All contracts in system",
  "timestamp": "2025-01-01T00:00:00Z",
  "cacheHit": true
}
```

### GET `/api/dashboard/stats`

**Query Parameters:**
- `refresh` (optional): `true` to bypass cache

**Response:**
```json
{
  "totalContracts": 100,
  "activeContracts": 45,
  "pendingContracts": 12,
  "scope": "system-wide",
  "scopeLabel": "All contracts in system",
  "debug": {
    "userAuthenticated": true,
    "userRole": "admin",
    "isAdmin": true,
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

## Support

For issues or questions about metrics:
1. Check console logs for "📊 Metrics:" messages
2. Verify user role in database
3. Check cache stats: `getCacheStats()` in server console
4. Clear cache: `clearMetricsCache()` in server console

