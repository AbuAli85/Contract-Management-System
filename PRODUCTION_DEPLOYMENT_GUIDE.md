# 🚀 Production Deployment Guide

## 🎯 **Overview**

This guide covers deploying your Contract Management System to production with proper CAPTCHA integration, security measures, and monitoring.

## 📋 **Pre-Deployment Checklist**

### ✅ **Environment Setup**

- [ ] Production environment variables configured
- [ ] CAPTCHA provider keys obtained and configured
- [ ] Supabase project configured for production
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Domain name configured

### ✅ **Security Configuration**

- [ ] CAPTCHA enabled and configured
- [ ] Rate limiting configured
- [ ] CORS settings configured
- [ ] Security headers enabled
- [ ] MFA configured (if required)
- [ ] Audit logging enabled

### ✅ **Monitoring Setup**

- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (Google Analytics)
- [ ] Logging service configured
- [ ] Uptime monitoring configured
- [ ] Performance monitoring configured

## 🔧 **Step-by-Step Deployment**

### Step 1: Configure CAPTCHA Provider

#### Option A: hCaptcha (Recommended)

1. **Sign up for hCaptcha**
   - Go to [https://www.hcaptcha.com/](https://www.hcaptcha.com/)
   - Create an account
   - Create a new site

2. **Get your keys**
   - Copy the Site Key
   - Copy the Secret Key

3. **Configure in Supabase**
   - Go to Supabase Dashboard → Authentication → Settings
   - Find CAPTCHA section
   - Select "hCaptcha"
   - Enter your Site Key and Secret Key
   - Enable CAPTCHA

#### Option B: Cloudflare Turnstile

1. **Sign up for Turnstile**
   - Go to [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
   - Navigate to Turnstile
   - Create a new site

2. **Get your keys**
   - Copy the Site Key
   - Copy the Secret Key

3. **Configure in Supabase**
   - Go to Supabase Dashboard → Authentication → Settings
   - Find CAPTCHA section
   - Select "Turnstile"
   - Enter your Site Key and Secret Key
   - Enable CAPTCHA

### Step 2: Configure Environment Variables

Create `.env.production.local` with the following:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# CAPTCHA (hCaptcha)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key
NEXT_PUBLIC_CAPTCHA_PROVIDER=hcaptcha

# Security
JWT_SECRET=your-super-secret-jwt-key
SECURITY_HEADERS_ENABLED=true
ENABLE_CONTENT_SECURITY_POLICY=true
ENABLE_HSTS=true

# Rate Limiting
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Feature Flags
FEATURE_CAPTCHA_ENABLED=true
FEATURE_MFA_ENABLED=true
FEATURE_RATE_LIMITING_ENABLED=true
FEATURE_AUDIT_LOGGING_ENABLED=true
```

### Step 3: Deploy to Vercel

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy to production**

   ```bash
   vercel --prod
   ```

4. **Configure environment variables in Vercel**
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add all production environment variables

### Step 4: Configure Domain

1. **Add custom domain in Vercel**
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings → Domains
   - Add your custom domain

2. **Update Supabase redirect URLs**
   - Go to Supabase Dashboard → Authentication → Settings
   - Update Site URL to your production domain
   - Add your production domain to redirect URLs

### Step 5: Configure Monitoring

#### Sentry Error Tracking

1. **Create Sentry project**
   - Go to [https://sentry.io/](https://sentry.io/)
   - Create a new project
   - Get your DSN

2. **Configure in your app**
   - Add SENTRY_DSN to environment variables
   - Sentry will automatically track errors

#### Google Analytics

1. **Create GA4 property**
   - Go to [https://analytics.google.com/](https://analytics.google.com/)
   - Create a new GA4 property
   - Get your Measurement ID

2. **Configure in your app**
   - Add NEXT_PUBLIC_GA_MEASUREMENT_ID to environment variables
   - Analytics will automatically track page views

## 🔒 **Security Configuration**

### CAPTCHA Configuration

```typescript
// In your production environment
NEXT_PUBLIC_CAPTCHA_PROVIDER = hcaptcha;
NEXT_PUBLIC_HCAPTCHA_SITE_KEY = your_site_key;
HCAPTCHA_SECRET_KEY = your_secret_key;
FEATURE_CAPTCHA_ENABLED = true;
```

### Rate Limiting

```typescript
// Configure rate limiting
UPSTASH_REDIS_REST_URL = your_redis_url;
UPSTASH_REDIS_REST_TOKEN = your_redis_token;
API_RATE_LIMIT_ENABLED = true;
API_RATE_LIMIT_WINDOW = 900000;
API_RATE_LIMIT_MAX_REQUESTS = 100;
```

### CORS Configuration

```typescript
// Configure CORS for production
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

## 📊 **Monitoring and Analytics**

### Error Tracking

- **Sentry**: Automatic error tracking and alerting
- **Console Logs**: Structured logging for debugging
- **Audit Logs**: Security event logging

### Performance Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Google Analytics**: User behavior tracking
- **Uptime Monitoring**: Service availability monitoring

### Security Monitoring

- **Failed Login Attempts**: Track and alert on suspicious activity
- **CAPTCHA Failures**: Monitor CAPTCHA verification failures
- **Rate Limiting**: Monitor API rate limiting triggers

## 🧪 **Testing Production Deployment**

### 1. Test Authentication Flow

```bash
# Test login with CAPTCHA
curl -X POST https://yourdomain.com/api/auth/production-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test CAPTCHA Configuration

```bash
# Get CAPTCHA configuration
curl https://yourdomain.com/api/auth/production-login
```

### 3. Test User Registration

```bash
# Test registration with CAPTCHA
curl -X POST https://yourdomain.com/api/auth/production-register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123","fullName":"New User","role":"user"}'
```

## 🔍 **Troubleshooting**

### Common Issues

#### CAPTCHA Not Working

1. **Check environment variables**
   - Verify CAPTCHA keys are set correctly
   - Check provider configuration

2. **Check Supabase configuration**
   - Verify CAPTCHA is enabled in Supabase
   - Check Site URL and redirect URLs

3. **Check browser console**
   - Look for CAPTCHA loading errors
   - Check network requests

#### Authentication Errors

1. **Check Supabase configuration**
   - Verify project URL and keys
   - Check authentication settings

2. **Check rate limiting**
   - Verify Redis configuration
   - Check rate limit settings

3. **Check CORS settings**
   - Verify allowed origins
   - Check domain configuration

### Debug Commands

```bash
# Check environment variables
vercel env ls

# Check deployment logs
vercel logs

# Check CAPTCHA configuration
npm run auth:fix-captcha
```

## 📈 **Performance Optimization**

### 1. Enable Caching

```typescript
// Configure Redis caching
REDIS_URL = your_redis_url;
REDIS_PASSWORD = your_redis_password;
```

### 2. Enable CDN

```typescript
// Configure CDN
CDN_URL=https://cdn.yourdomain.com
CDN_CACHE_TTL=3600
```

### 3. Optimize Images

- Use Next.js Image component
- Configure image optimization
- Use WebP format when possible

## 🔄 **Maintenance**

### Regular Tasks

1. **Monitor error rates**
2. **Check CAPTCHA success rates**
3. **Review security logs**
4. **Update dependencies**
5. **Monitor performance metrics**

### Backup Strategy

1. **Database backups** (handled by Supabase)
2. **Environment variable backups**
3. **Code repository backups**
4. **Configuration backups**

## 📞 **Support**

### Getting Help

1. **Check logs** in Vercel Dashboard
2. **Check Supabase logs** in Supabase Dashboard
3. **Check Sentry** for error details
4. **Review this guide** for common issues

### Emergency Contacts

- **Vercel Support**: [https://vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [https://supabase.com/support](https://supabase.com/support)
- **hCaptcha Support**: [https://www.hcaptcha.com/help](https://www.hcaptcha.com/help)

---

## ✅ **Deployment Complete!**

Your Contract Management System is now deployed to production with:

- ✅ CAPTCHA protection enabled
- ✅ Security measures configured
- ✅ Monitoring and analytics set up
- ✅ Performance optimization enabled
- ✅ Error tracking configured

**Status: 🚀 PRODUCTION DEPLOYMENT COMPLETE** 🎉
