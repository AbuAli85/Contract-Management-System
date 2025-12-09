# 🔐 GitHub Secrets Setup for Deployment

This guide explains how to set up the required GitHub secrets for automated Supabase deployments.

## Required Secrets

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

### 1. SUPABASE_ACCESS_TOKEN (Required)

Your Supabase access token for API authentication.

**How to get it:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click your profile icon (top right)
3. Go to **Account Settings** → **Access Tokens**
4. Click **Generate New Token**
5. Copy the token and add it as `SUPABASE_ACCESS_TOKEN`

**Example:** `sbp_1234567890abcdefghijklmnopqrstuvwxyz`

---

### 2. SUPABASE_PROJECT_REF (Required)

Your Supabase project reference ID (not the project ID).

**How to get it:**

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon in sidebar)
3. Go to **General** tab
4. Find **Reference ID** (looks like: `abcdefghijklmnopqrst`)
5. Copy this value and add it as `SUPABASE_PROJECT_REF`

**Example:** `abcdefghijklmnopqrst`

**Note:** This is different from the Project ID. Make sure you use the Reference ID.

---

### 3. SUPABASE_STAGING_PROJECT_REF (Optional)

If you have a separate staging environment, add this secret with your staging project's reference ID.

**How to get it:**

- Same process as above, but use your staging project's Reference ID

---

### 4. SUPABASE_DB_PASSWORD (Required for some projects)

Your database password. **Required if you get authentication errors during linking.**

**How to get it:**

1. Go to your Supabase project dashboard
2. Click **Settings** → **Database**
3. Find **Database Password** section
4. If you don't remember it, you can reset it (be careful!)
5. Copy the password exactly as shown

**Important Notes:**

- Some Supabase projects require the database password for CLI operations
- If you see "failed SASL auth" or "timeout" errors, add this secret
- The password is different from your Supabase account password
- Make sure there are no extra spaces when copying the password
- If password contains special characters, ensure they're properly escaped in the secret
- If linking still fails, try resetting the database password in Supabase Dashboard

---

## Quick Setup Checklist

- [ ] Go to GitHub repository → Settings → Secrets and variables → Actions
- [ ] Add `SUPABASE_ACCESS_TOKEN` secret
- [ ] Add `SUPABASE_PROJECT_REF` secret
- [ ] (Optional) Add `SUPABASE_STAGING_PROJECT_REF` if using staging
- [ ] (Optional) Add `SUPABASE_DB_PASSWORD` if required
- [ ] Test the workflow by pushing a migration or manually triggering it

---

## Verification

After adding the secrets, you can verify they're set correctly by:

1. **Manual Workflow Trigger:**
   - Go to **Actions** tab in GitHub
   - Select **Database Migration** workflow
   - Click **Run workflow**
   - Select environment (production/staging)
   - Click **Run workflow**

2. **Check Workflow Logs:**
   - The workflow should show: `✅ Required secrets are configured`
   - It should show your project ref (first 8 characters): `✅ Using project ref: abcdefgh...`

---

## Troubleshooting

### Error: "Invalid project ref format"

**Cause:** The `SUPABASE_PROJECT_REF` secret is empty or incorrectly formatted.

**Solution:**

1. Verify you're using the **Reference ID**, not the Project ID
2. Check that the secret name is exactly `SUPABASE_PROJECT_REF` (case-sensitive)
3. Ensure there are no extra spaces when copying the value

### Error: "Authentication failed"

**Cause:** Invalid or expired `SUPABASE_ACCESS_TOKEN`.

**Solution:**

1. Generate a new access token in Supabase Dashboard
2. Update the `SUPABASE_ACCESS_TOKEN` secret with the new token

### Error: "Link failed"

**Cause:** Database password might be required or project ref is incorrect.

**Solution:**

1. Try adding `SUPABASE_DB_PASSWORD` secret
2. Verify the project ref is correct
3. Check that your access token has the correct permissions

---

## Security Best Practices

1. ✅ **Never commit secrets to code** - Always use GitHub Secrets
2. ✅ **Use different tokens for different environments** - Don't reuse production tokens
3. ✅ **Rotate tokens regularly** - Update access tokens every 90 days
4. ✅ **Limit token permissions** - Only grant necessary permissions
5. ✅ **Use environment-specific secrets** - Separate staging and production secrets

---

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Project Settings](https://app.supabase.com/project/_/settings/general)
