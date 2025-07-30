# GitHub Secrets Verification Guide

## Required Secrets for Vercel Deployment

To fix the `vercel-token` error, ensure these secrets are configured in your GitHub repository:

### 1. Go to your GitHub repository
- Navigate to: `https://github.com/[your-username]/Contract-Management-System`
- Click on **Settings** tab
- Click on **Secrets and variables** → **Actions** in the left sidebar

### 2. Verify these secrets exist:

#### Required for Vercel Deployment:
- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

#### Required for Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `SUPABASE_PROJECT_ID` - Your Supabase project ID
- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token

#### Optional but recommended:
- `FRONTEND_URL` - Your frontend URL

### 3. How to get Vercel credentials:

#### Get Vercel Token:
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token and add it as `VERCEL_TOKEN` secret

#### Get Vercel Org ID and Project ID:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → General
4. Copy the "Project ID"
5. For Org ID, check the URL or go to your organization settings

### 4. Test the configuration:

After adding the secrets, try pushing a commit to trigger the workflow:

```bash
git add .
git commit -m "test: trigger deployment workflow"
git push origin main
```

### 5. Check workflow status:

- Go to the **Actions** tab in your GitHub repository
- Look for the "Auto Deploy to Vercel" or "CI/CD Pipeline" workflow
- Check if the deployment step succeeds

## Troubleshooting

If you still get the `vercel-token` error:

1. **Double-check secret names**: Ensure the secret is named exactly `VERCEL_TOKEN` (case-sensitive)
2. **Check repository permissions**: Ensure the workflow has access to the secrets
3. **Verify token validity**: Make sure your Vercel token is still valid
4. **Check workflow syntax**: The updated workflow files should now work correctly

## Alternative: Use Vercel CLI directly

If the `amondnet/vercel-action@v25` continues to have issues, you can modify the workflow to use the Vercel CLI directly (like in the `deploy.yml` file):

```yaml
- name: Install Vercel CLI
  run: npm install --global vercel@latest

- name: Deploy to Vercel
  run: vercel --token ${{ secrets.VERCEL_TOKEN }} --prod
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
``` 