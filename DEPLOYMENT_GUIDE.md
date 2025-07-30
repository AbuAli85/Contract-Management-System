# 🚀 Deployment Guide - Contract Management System

This guide will walk you through setting up automatic deployment to Vercel for the enhanced authentication system.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ GitHub repository with the enhanced authentication system
- ✅ Vercel account (free tier available)
- ✅ Supabase project with the required migrations applied
- ✅ Node.js 18+ installed locally

## 🔧 Step 1: Vercel Project Setup

### 1.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 1.2 Login to Vercel

```bash
vercel login
```

### 1.3 Link Your Project

```bash
# Navigate to your project directory
cd contract-management-system

# Link to Vercel
vercel link
```

Follow the prompts to:

- Select your Vercel account/team
- Choose "Link to existing project" or "Create new project"
- Set the project name (e.g., "contract-management-system")

## 🔐 Step 2: Configure Environment Variables

### 2.1 Get Your Vercel Project Info

```bash
vercel env ls
```

Note down your:

- **Project ID** (e.g., `prj_abc123...`)
- **Organization ID** (e.g., `team_xyz789...`)

### 2.2 Set Environment Variables in Vercel

```bash
# Set Supabase configuration
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Set frontend URL
vercel env add FRONTEND_URL

# Optional: Set Sentry DSN for error tracking
vercel env add SENTRY_DSN
```

**Example values:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://your-app.vercel.app
```

### 2.3 Verify Environment Variables

```bash
vercel env ls
```

## 🔑 Step 3: Generate Vercel Token

### 3.1 Create Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it "GitHub Actions Deployment"
4. Set expiration to "No expiration" (or choose a date)
5. Copy the token (you won't see it again!)

## 🐙 Step 4: Configure GitHub Secrets

### 4.1 Add Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name                     | Value                                     | Description                  |
| ------------------------------- | ----------------------------------------- | ---------------------------- |
| `VERCEL_TOKEN`                  | `your_vercel_token`                       | Vercel API token from Step 3 |
| `VERCEL_ORG_ID`                 | `team_xyz789...`                          | Your Vercel organization ID  |
| `VERCEL_PROJECT_ID`             | `prj_abc123...`                           | Your Vercel project ID       |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://your-project.supabase.co`        | Supabase project URL         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase anonymous key       |
| `SUPABASE_SERVICE_ROLE_KEY`     | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase service role key    |
| `FRONTEND_URL`                  | `https://your-app.vercel.app`             | Your production frontend URL |

## 🗄️ Step 5: Deploy Database Migrations

### 5.1 Deploy Supabase Migrations

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Deploy migrations
npm run db:migrate
```

### 5.2 Deploy Edge Functions

```bash
# Deploy the session expiry reminder function
npm run functions:deploy
```

## 🚀 Step 6: Test Deployment

### 6.1 Manual Test Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 6.2 Verify Deployment

1. Check your Vercel dashboard for the deployment
2. Visit the deployed URL
3. Test the authentication system:
   - Sign up/login
   - Session refresh
   - Error handling
   - Logout

## 🔄 Step 7: Enable Automatic Deployment

### 7.1 Push to Trigger Deployment

```bash
# Add your changes
git add .

# Commit with conventional commit message
git commit -m "feat: enhanced authentication system ready for production"

# Push to main branch to trigger automatic deployment
git push origin main
```

### 7.2 Monitor GitHub Actions

1. Go to your GitHub repository
2. Click "Actions" tab
3. Watch the deployment workflow run:
   - ✅ Tests pass
   - ✅ Build succeeds
   - ✅ Deployment completes

## 📊 Step 8: Post-Deployment Verification

### 8.1 Health Checks

```bash
# Test the health endpoint
curl https://your-app.vercel.app/api/health
```

### 8.2 Authentication Tests

1. **Sign Up Flow**: Create a new account
2. **Login Flow**: Sign in with existing account
3. **Session Refresh**: Wait for automatic token refresh
4. **Error Handling**: Test invalid credentials
5. **Logout**: Verify proper cleanup

### 8.3 Database Verification

```sql
-- Check RLS policies are active
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'users', 'session_reminders');

-- Check session reminder cron job
SELECT * FROM get_session_reminder_status();
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Check build logs
vercel logs

# Test build locally
npm run build
```

#### 2. Environment Variable Issues

```bash
# Verify environment variables
vercel env ls

# Check if variables are available in build
echo $NEXT_PUBLIC_SUPABASE_URL
```

#### 3. Database Connection Issues

```bash
# Test Supabase connection
npm run db:health-check

# Verify migrations
supabase db diff
```

#### 4. Authentication Issues

- Check Supabase project settings
- Verify RLS policies are applied
- Test with Supabase dashboard

### Debug Commands

```bash
# View deployment logs
vercel logs

# Check environment variables
vercel env ls

# Test local build
npm run build

# Run tests locally
npm run test

# Check database health
npm run db:health-check
```

## 📈 Monitoring & Analytics

### 8.1 Vercel Analytics

- **Performance**: Core Web Vitals
- **Errors**: Function errors and logs
- **Usage**: Bandwidth and function calls

### 8.2 Supabase Monitoring

- **Database**: Query performance
- **Auth**: Login attempts and failures
- **Edge Functions**: Execution logs

### 8.3 Custom Monitoring

```sql
-- Check session reminder statistics
SELECT * FROM get_reminder_statistics(7);

-- View recent auth activity
SELECT * FROM recent_session_reminders;
```

## 🔒 Security Checklist

### Pre-Deployment

- [ ] Environment variables are secure
- [ ] RLS policies are applied
- [ ] No sensitive data in code
- [ ] HTTPS is enforced
- [ ] CORS is configured

### Post-Deployment

- [ ] Authentication works correctly
- [ ] Session refresh is working
- [ ] Error boundaries catch errors
- [ ] Logout clears all data
- [ ] No console errors

## 🎉 Success!

Your enhanced authentication system is now deployed and ready for production use!

### Next Steps

1. **Monitor**: Watch for any issues in the first few days
2. **Scale**: Add more features as needed
3. **Optimize**: Monitor performance and optimize
4. **Backup**: Set up regular database backups

### Support

If you encounter any issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the [documentation](docs/)
3. Create an issue on GitHub
4. Check Vercel and Supabase status pages

---

**🚀 Your enhanced authentication system is now live and ready for users!**
