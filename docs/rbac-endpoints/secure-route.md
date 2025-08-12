# RBAC Protection for app\api\contracts\secure-route.ts

## Endpoint Information

- **File**: `app\api\contracts\secure-route.ts`
- **Resource Type**: `contract`
- **HTTP Methods**: GET, POST
- **Actions**: read, create

## Required Permissions

The following permissions should be checked before allowing access:

- `contract:read:own`
- `contract:read:organization`
- `contract:read:provider`
- `contract:read:all`
- `contract:create:own`
- `contract:create:organization`
- `contract:create:provider`
- `contract:create:all`

## Implementation Example

```typescript
import { permissionEvaluator } from '@/lib/rbac/evaluate';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: any }) {
  try {
    // Extract user ID from authenticated session
    const userId = await getUserIdFromSession(request);

    // Check permission
    const decision = await permissionEvaluator.evaluatePermission(
      userId,
      'contract:read:own', // Adjust scope as needed
      {
        context: {
          user: { id: userId },
          params,
          resourceType: 'contract',
          resourceId: params.id,
          request,
        },
      }
    );

    if (!decision.allowed) {
      return new Response('Forbidden', { status: 403 });
    }

    // Proceed with endpoint logic
    // ... your existing code here
  } catch (error) {
    console.error('Permission check failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

## Permission Decision

The permission check returns a `PermissionDecision` object with:

- `allowed`: boolean indicating if access is granted
- `reason`: string explaining the decision
- `permission`: the permission that was checked
- `resource`: the resource type
- `action`: the action being performed
- `scope`: the scope of access
- `user_id`: the user making the request
- `user_roles`: array of user's roles
- `user_permissions`: array of user's permissions

## Testing

Test this endpoint with users having different permission levels:

1. **No permissions**: Should return 403 Forbidden
2. **Own scope only**: Should allow access to own resources
3. **Organization scope**: Should allow access to organization resources
4. **All scope**: Should allow access to all resources

## Notes

- Adjust the scope (`own`, `organization`, `provider`, `all`) based on your security requirements
- Consider implementing resource-level ownership checks for `own` scope
- Log all permission decisions for audit purposes
- Cache user permissions to improve performance
