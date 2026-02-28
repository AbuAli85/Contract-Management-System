# Operational runbook

## Post-deploy checklist

### After applying RBAC/permissions migrations

When you add or change permissions in Supabase (e.g. new rows in `permissions`, changes to `role_permissions`), the permission cache must be refreshed or new permissions will not be enforced.

1. **Refresh permission cache**
   - In Supabase SQL Editor or your migration runner, execute:
   - `SELECT refresh_user_permissions_cache();`
   - (Or the RPC name your project uses, e.g. `refresh_user_permissions`.)

2. **Optional: verify**
   - Confirm the new permission exists:  
     `SELECT name FROM permissions WHERE name = 'your:new:permission';`
   - Confirm it is attached to the intended role(s):  
     `SELECT r.name, p.name FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE p.name = 'your:new:permission';`

If users report “permission denied” immediately after a permissions migration, run the cache refresh step first.
