# 🚀 Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

#### Prerequisites:
- GitHub account
- Vercel account (free at [vercel.com](https://vercel.com))

#### Steps:

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**:
   - In Vercel dashboard → Project Settings → Environment Variables
   - Add all variables from `env.example`

4. **Deploy**:
   - Click "Deploy" - Vercel will build and deploy automatically

#### Alternative: Deploy via CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option 2: Netlify

#### Steps:
1. **Push to GitHub**
2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

3. **Build Settings**:
   - Build command: `pnpm build`
   - Publish directory: `.next`
   - Node version: 18 (or higher)

4. **Environment Variables**:
   - Add all variables from `env.example`

### Option 3: Railway

#### Steps:
1. **Push to GitHub**
2. **Connect to Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Environment Variables**:
   - Add all variables from `env.example`

4. **Deploy**:
   - Railway will auto-deploy on every push

### Option 4: DigitalOcean App Platform

#### Steps:
1. **Push to GitHub**
2. **Create App**:
   - Go to DigitalOcean App Platform
   - Click "Create App" → "Create App from Source Code"
   - Connect your GitHub repository

3. **Configure**:
   - Source: GitHub
   - Branch: main
   - Build command: `pnpm build`
   - Run command: `pnpm start`

4. **Environment Variables**:
   - Add all variables from `env.example`

## Environment Variables Setup

### Required Variables:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Make.com webhooks
MAKE_WEBHOOK_URL=your_make_webhook_url
NEXT_PUBLIC_MAKE_WEBHOOK_URL=your_make_webhook_url
MAKE_WEBHOOK_SECRET=your_make_webhook_secret

# Slack notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url
SLACK_WEBHOOK_SECRET=your_slack_webhook_secret
NEXT_PUBLIC_SLACK_WEBHOOK_URL=your_slack_webhook_url

# Google Docs API (optional)
GOOGLE_CREDENTIALS_JSON=your_google_credentials
GOOGLE_DOCS_TEMPLATE_ID=your_template_id

# SMTP (optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## Database Setup

### Supabase Setup:
1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down URL and keys

2. **Run Database Scripts**:
   ```bash
   # Run the database setup
   pnpm run db:setup
   ```

3. **Verify Setup**:
   ```bash
   # Test database connection
   pnpm run db:test
   ```

## Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database setup complete
- [ ] Build passes locally (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Code committed and pushed to GitHub
- [ ] Webhook URLs configured and tested

## Post-deployment Verification

1. **Check Application**:
   - Visit your deployed URL
   - Test login/signup functionality
   - Verify contract creation works
   - Check webhook integrations

2. **Monitor Logs**:
   - Check deployment platform logs
   - Monitor for any errors

3. **Performance**:
   - Run Lighthouse audit
   - Check Core Web Vitals

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Node.js version (use 18+)
   - Verify all dependencies installed
   - Check for TypeScript errors

2. **Environment Variables**:
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify Supabase keys are correct

3. **Database Connection**:
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure database is accessible

4. **Webhook Issues**:
   - Verify webhook URLs are correct
   - Check webhook secrets
   - Test webhook endpoints

### Support:
- Check deployment platform documentation
- Review application logs
- Test locally with production environment variables

## Security Considerations

1. **Environment Variables**:
   - Never commit sensitive keys to Git
   - Use platform-specific secret management
   - Rotate keys regularly

2. **Database**:
   - Enable Row Level Security (RLS)
   - Use service role key only on server
   - Regular backups

3. **Webhooks**:
   - Validate webhook signatures
   - Use HTTPS endpoints
   - Implement rate limiting

## Cost Optimization

### Vercel:
- Free tier: 100GB bandwidth/month
- Pro: $20/month for more resources

### Netlify:
- Free tier: 100GB bandwidth/month
- Pro: $19/month for more features

### Railway:
- Free tier: $5 credit/month
- Pay-as-you-go pricing

### DigitalOcean:
- App Platform: $5/month minimum
- Pay for resources used 