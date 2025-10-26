# 🔐 Environment Variables Setup Guide

## Required Environment Variables

This project requires specific environment variables to function correctly. Follow this guide to set them up.

---

## 📋 Complete List

### 1. Supabase Configuration (Required)

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (Public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role Key (Secret - Server only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy the values

---

### 2. CSRF Protection (Required - NEW!)

```bash
# CSRF Secret for token generation
CSRF_SECRET=your-random-secret-here
```

**How to generate:**

**Option 1: Using OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Using PowerShell (Windows)**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Option 4: Online Generator**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated value

⚠️ **Important:** 
- Never commit this to Git
- Use different secrets for dev/staging/production
- Store securely (1Password, LastPass, etc.)

---

### 3. Environment Configuration

```bash
# Node Environment
NODE_ENV=production  # or 'development' locally
```

---

### 4. CORS Configuration (Optional)

```bash
# Allowed Origins (comma-separated)
ALLOWED_ORIGINS=https://portal.thesmartpro.io,https://www.thesmartpro.io
```

**Local Development:**
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

### 5. Build Configuration (Optional)

```bash
# Build ID for cache busting
BUILD_ID=v1.0.0  # or use 'dev' for development
```

---

## 🖥️ Local Development Setup

### Step 1: Create `.env.local`

```bash
# In project root
touch .env.local
```

### Step 2: Add Variables

Copy this template to `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CSRF Protection (generate new one!)
CSRF_SECRET=your-generated-secret-here

# Environment
NODE_ENV=development

# Local CORS
ALLOWED_ORIGINS=http://localhost:3000
```

### Step 3: Verify Setup

```bash
# Start development server
npm run dev

# Check for errors
# Should see: "Ready on http://localhost:3000"
```

**Common Issues:**

❌ `Missing Supabase environment variables`
- Solution: Check variable names match exactly
- Solution: Restart dev server after adding variables

❌ `Authentication service unavailable`
- Solution: Verify Supabase URL and keys are correct
- Solution: Check Supabase project is active

---

## ☁️ Vercel Deployment Setup

### Step 1: Add to Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables

### Step 2: Add Each Variable

For each environment variable:

**Variable Name:** `CSRF_SECRET`  
**Value:** (paste generated secret)  
**Environment:** 
- ✅ Production
- ✅ Preview  
- ✅ Development

Click "Save"

### Step 3: Required Variables for Production

Minimum required for production:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ CSRF_SECRET
✅ NODE_ENV (usually auto-set to 'production')
```

### Step 4: Redeploy

After adding variables:
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

Or push a new commit:
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

---

## 🔒 Security Best Practices

### DO ✅

- ✅ Use different secrets for dev/staging/prod
- ✅ Store secrets in password manager
- ✅ Rotate CSRF_SECRET periodically
- ✅ Use strong random values (32+ bytes)
- ✅ Add `.env.local` to `.gitignore`

### DON'T ❌

- ❌ Commit `.env.local` to Git
- ❌ Share secrets in Slack/Email
- ❌ Use simple/guessable secrets
- ❌ Reuse secrets across projects
- ❌ Log secrets to console

---

## 🧪 Testing Environment Variables

### Verify Variables are Loaded

Create a test file: `scripts/check-env.js`

```javascript
// Check environment variables (safe - doesn't log secrets)
console.log('Environment Check:');
console.log('================');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('CSRF Secret:', process.env.CSRF_SECRET ? '✅ Set' : '❌ Missing');
console.log('Node Environment:', process.env.NODE_ENV || 'Not set');
```

Run:
```bash
node scripts/check-env.js
```

Expected output:
```
Environment Check:
================
Supabase URL: ✅ Set
Supabase Anon Key: ✅ Set
Service Role Key: ✅ Set
CSRF Secret: ✅ Set
Node Environment: development
```

---

## 📱 Environment-Specific Configurations

### Development (`.env.local`)

```bash
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
# ... other dev values
```

**Features:**
- Hot reload enabled
- Source maps included
- Detailed error messages
- Cookies: secure=false (HTTP works)

### Production (Vercel)

```bash
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
# ... other prod values
```

**Features:**
- Optimized builds
- Minified code
- Production error handling
- Cookies: secure=true (HTTPS only)

---

## 🆘 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Check:**
1. Variable names are spelled correctly
2. No extra spaces in values
3. `.env.local` is in project root
4. Server was restarted after adding variables

**Fix:**
```bash
# Kill server (Ctrl+C)
# Restart
npm run dev
```

### Issue: "Invalid CSRF token"

**Check:**
1. `CSRF_SECRET` is set in environment
2. Value is at least 16 characters
3. No special characters breaking the value

**Fix:**
```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.local
CSRF_SECRET=new-secret-here

# Restart server
```

### Issue: Cookies not secure

**Development (Expected):**
- HTTP connections: `secure: false`
- This is normal in development

**Production (Must Fix):**
- Verify `NODE_ENV=production` in Vercel
- Check deployment logs for errors

### Issue: Environment variables not updating

**Vercel:**
1. Update variable in dashboard
2. **Important:** Redeploy the project
3. Variables only update on new deployments

**Local:**
1. Update `.env.local`
2. Restart dev server (`Ctrl+C`, then `npm run dev`)

---

## 📚 Reference

### Files that Use Environment Variables

```
lib/supabase/server.ts          → Supabase keys
lib/csrf.ts                     → CSRF_SECRET
middleware.ts                   → ALLOWED_ORIGINS
app/layout.tsx                  → NODE_ENV (indirectly)
```

### Variable Prefixes

**`NEXT_PUBLIC_*`**
- Exposed to browser
- Can be used in client components
- Bundled into JavaScript

**No prefix**
- Server-side only
- Never exposed to browser
- Secure for secrets

---

## ✅ Checklist

Before deploying, verify:

- [ ] All required variables are set
- [ ] CSRF_SECRET is generated (not default)
- [ ] Supabase credentials are correct
- [ ] `.env.local` is in `.gitignore`
- [ ] Vercel environment variables are configured
- [ ] Test deployment works
- [ ] Production cookies are secure

---

## 🔗 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Setup Guide](https://supabase.com/docs/guides/getting-started)
- [CSRF Protection Best Practices](https://owasp.org/www-community/attacks/csrf)

---

**Need Help?** Check the troubleshooting section or review `IMPLEMENTATION_SUMMARY.md` for context.

