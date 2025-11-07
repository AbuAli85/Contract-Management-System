# 🔄 Migration Sync Guide

This guide explains how to handle migration mismatches between your local repository and remote Supabase database.

## Understanding the Problem

When you see the error:
```
Remote migration versions not found in local migrations directory.
```

This means:
- Your remote Supabase database has migrations that aren't in your local `supabase/migrations/` folder
- This typically happens when migrations were applied directly via Supabase Dashboard or another environment

## Solutions

### Option 1: Pull Remote Migrations (Recommended)

Sync your local repository with the remote database:

```bash
# 1. Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# 2. Pull remote migrations
supabase db pull --linked

# 3. Review the pulled migrations
# Check the new files in supabase/migrations/

# 4. Commit and push
git add supabase/migrations/
git commit -m "chore: sync migrations from remote database"
git push
```

**Note:** This will create new migration files based on the remote database schema.

---

### Option 2: Repair Migration History

If you know which migrations exist remotely but shouldn't be tracked:

```bash
# 1. Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# 2. Check migration status
supabase migration list --linked

# 3. Repair specific migrations (mark as reverted)
supabase migration repair --status reverted 001 003 006

# 4. Try pushing again
supabase db push --linked
```

---

### Option 3: Use --include-all Flag

The CI/CD workflow now uses `--include-all` flag automatically when a mismatch is detected. This pushes all local migrations even if they're not in the remote history.

**Manual usage:**
```bash
supabase db push --linked --include-all
```

---

## Prevention

To avoid migration mismatches:

1. ✅ **Always commit migrations before deploying**
   ```bash
   git add supabase/migrations/
   git commit -m "feat: add new migration"
   git push
   ```

2. ✅ **Use CI/CD for deployments** - Don't apply migrations manually via dashboard

3. ✅ **Keep local repo in sync** - Pull remote changes regularly

4. ✅ **Use migration validation** - Run `npm run supabase:validate-migrations` before deploying

---

## CI/CD Workflow Behavior

The GitHub Actions workflow (`migrate.yml`) will:

1. **Detect mismatches** automatically
2. **Use --include-all flag** to push all local migrations
3. **Provide clear error messages** if deployment fails
4. **Suggest manual fixes** if automatic sync fails

---

## Troubleshooting

### Error: "Remote migration versions not found"

**Cause:** Remote database has migrations not in local repo.

**Solution:**
```bash
# Pull remote migrations
supabase link --project-ref YOUR_PROJECT_REF
supabase db pull --linked
git add supabase/migrations/
git commit -m "chore: sync migrations"
git push
```

### Error: "Local migration versions not found in remote"

**Cause:** Local repo has migrations not applied to remote.

**Solution:**
```bash
# Push local migrations
supabase db push --linked --include-all
```

### Error: "Migration history table is corrupted"

**Cause:** Migration history got out of sync.

**Solution:**
```bash
# Repair the history
supabase migration repair --status reverted <migration_versions>
# Or reset and reapply
supabase db reset --linked
```

---

## Best Practices

1. **One migration per feature** - Keep migrations focused and atomic
2. **Test locally first** - Always test migrations on local Supabase before deploying
3. **Review before committing** - Check migration files before committing
4. **Use descriptive names** - Migration names should clearly describe what they do
5. **Don't modify applied migrations** - Once a migration is applied, create a new one for changes

---

## Additional Resources

- [Supabase Migration Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Migration Best Practices](https://supabase.com/docs/guides/database/migrations)

