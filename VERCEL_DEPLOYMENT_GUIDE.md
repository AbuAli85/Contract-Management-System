# 🚀 Vercel Deployment Guide - Contract Management System

## ✅ Pre-Deployment Checklist

Your project is **already configured** for Vercel! Here's what's ready:

- ✅ Next.js 14 application
- ✅ `vercel.json` configured with proper function timeouts
- ✅ `next.config.js` optimized for production
- ✅ Security headers configured
- ✅ Package.json with `vercel-build` script
- ✅ TypeScript and ESLint configured

---

## 📋 Step-by-Step Deployment

### Step 1: Prepare Your Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "chore: prepare for Vercel deployment"
git push origin main
```

### Step 2: Create Vercel Account & Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click **"Add New Project"**
4. Import your GitHub repository: `Contract-Management-System`
5. Select your repository and click **"Import"**

### Step 3: Configure Project Settings

#### Framework Preset

- **Framework**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

---

## 🔐 Step 4: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add these:

### 🌐 **Application Configuration**

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### 🔑 **Supabase Configuration** (REQUIRED)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL=https://your-project.vercel.app/auth/callback
```

### 🔐 **RBAC & Security**

```bash
RBAC_ENFORCEMENT=true
NEXT_PUBLIC_SESSION_TIMEOUT=3600000
ALLOWED_ORIGINS=https://your-project.vercel.app,https://your-custom-domain.com
```

### 🚀 **Performance (Upstash Redis for Rate Limiting)**

Get free Redis at [upstash.com](https://upstash.com):

```bash
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

### 📊 **Monitoring (Optional)**

```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
```

### 🔗 **Webhooks (Make.com Integration - All Three)**

```bash
# eXtra Contracts (Simple/Fast)
MAKECOM_WEBHOOK_URL_EXTRA=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4

# Sharaf DG Deployment Letters
MAKECOM_WEBHOOK_URL_SHARAF_DG=https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn

# General Contracts (Full-Featured)
MAKECOM_WEBHOOK_URL_GENERAL=https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz

# Legacy/Default (backwards compatibility)
WEBHOOK_URL=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4
```

### ⚠️ **Security Settings** (IMPORTANT)

```bash
# DISABLE test accounts in production
NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS=false

# Disable debug modes
DEBUG=false
DEBUG_AUTH=false
DEBUG_RBAC=false
DEBUG_API=false
```

### 📧 **Email Configuration (Optional)**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

---

## 🔧 Step 5: Advanced Configuration

### Update `vercel.json` for Your Domain

If you have issues with the CSP report-uri, update line 51 in `vercel.json`:

```json
"report-uri https://your-actual-domain.vercel.app/api/csp-report"
```

### Update `next.config.js` CORS Settings

In `next.config.js`, line 128, update the default allowed origin:

```javascript
value: process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://your-project.vercel.app',
```

---

## 🚀 Step 6: Deploy!

1. Click **"Deploy"** in Vercel dashboard
2. Wait for build to complete (~2-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

---

## 🌐 Step 7: Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS settings as instructed by Vercel
4. Update environment variables:
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
   ALLOWED_ORIGINS=https://your-custom-domain.com
   ```

---

## 🔄 Step 8: Post-Deployment Setup

### 1. Update Supabase Auth Callback URLs

In Supabase Dashboard → Authentication → URL Configuration, add:

```
https://your-project.vercel.app/auth/callback
https://your-custom-domain.com/auth/callback
```

### 2. Update CORS in Supabase

In Supabase Dashboard → Settings → API, add your Vercel URL to allowed origins.

### 3. Test the Make.com Webhook

The webhook is already configured at:

```
https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn
```

Test by creating a Sharaf DG contract and generating a PDF.

### 4. Verify Image URLs

Ensure Supabase storage buckets are configured correctly:

- Navigate to Storage → Policies
- Make sure buckets are accessible (public or with proper RLS policies)

---

## 🧪 Step 9: Test Your Deployment

### Test Checklist:

- [ ] Homepage loads
- [ ] Login/Authentication works
- [ ] Dashboard displays correctly
- [ ] Create a test contract
- [ ] Generate PDF (Make.com webhook)
- [ ] Upload promoter images
- [ ] Check Sharaf DG form
- [ ] Verify all API routes work
- [ ] Test mobile responsiveness

---

## 🐛 Common Issues & Solutions

### Issue 1: Build Fails with TypeScript Errors

**Solution**: Already configured in `next.config.js`:

```javascript
typescript: {
  ignoreBuildErrors: true,
}
```

### Issue 2: Function Timeout

**Solution**: Already configured in `vercel.json` with extended timeouts:

- Default API routes: 60 seconds
- PDF generation: 120 seconds
- Contract generation: 90 seconds

### Issue 3: Image Loading Issues

**Solution**: Verify Supabase domain in `next.config.js`:

```javascript
images: {
  domains: ['your-project.supabase.co'],
}
```

### Issue 4: CORS Errors

**Solution**: Update `ALLOWED_ORIGINS` environment variable with your Vercel URL.

### Issue 5: 404 on Direct URL Access

**Solution**: Already configured with proper rewrites in `vercel.json`.

---

## 📱 Automatic Deployments

Vercel automatically deploys:

- **Production**: Every push to `main` branch
- **Preview**: Every pull request
- **Development**: Every push to other branches

---

## 🔐 Security Recommendations

### Before Going Live:

1. **Update CSP Report URI**:
   - In both `vercel.json` and `next.config.js`
   - Change from `https://portal.thesmartpro.io` to your domain

2. **Disable Test Accounts**:

   ```bash
   NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS=false
   ```

3. **Enable Rate Limiting**:
   - Set up Upstash Redis (free tier available)
   - Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

4. **Set Up Error Monitoring**:
   - Create free Sentry account
   - Add Sentry DSN to environment variables

5. **Review CORS Settings**:
   - Only allow your production domains
   - Remove `localhost` from `ALLOWED_ORIGINS`

---

## 📊 Monitoring Your Deployment

### Vercel Analytics (Free)

- Automatically enabled
- View in Vercel Dashboard → Analytics

### Custom Monitoring

- Set up Sentry for error tracking
- Configure Google Analytics (optional)
- Monitor API performance in Vercel logs

---

## 🚨 Emergency Rollback

If something goes wrong:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click **⋯** → **Promote to Production**

---

## 📝 Quick Commands

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# View environment variables
vercel env ls
```

---

## ✅ Deployment Complete Checklist

- [ ] Vercel project created
- [ ] All environment variables configured
- [ ] Build successful
- [ ] Custom domain configured (if applicable)
- [ ] Supabase callbacks updated
- [ ] Make.com webhook tested
- [ ] Authentication tested
- [ ] PDF generation tested
- [ ] Mobile responsiveness verified
- [ ] Security headers verified
- [ ] Test accounts disabled
- [ ] Error monitoring configured
- [ ] Team members invited (if applicable)

---

## 🎉 Success!

Your Contract Management System is now live on Vercel!

**Next Steps:**

1. Share the URL with your team
2. Monitor initial usage
3. Set up custom domain
4. Configure email notifications
5. Enable advanced features

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Make.com Docs**: https://www.make.com/en/help

---

## 🔄 Continuous Deployment

Every time you push to GitHub:

1. Vercel automatically detects changes
2. Runs build process
3. Deploys to preview URL (for branches)
4. Deploys to production (for main branch)

Monitor all deployments in your Vercel dashboard.

---

**Happy Deploying! 🚀**
