# ⚡ Vercel Quick Start - 5 Minutes to Deploy

## 🎯 Fastest Way to Deploy

### Option 1: One-Click Deploy Button (Recommended)

Click this button to deploy instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/Contract-Management-System&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&project-name=contract-management-system&repository-name=contract-management-system)

**After deployment**, add these environment variables:

```bash
# In Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
ALLOWED_ORIGINS=https://your-project.vercel.app
NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS=false
```

---

### Option 2: Vercel CLI (For Power Users)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Deploy to production
vercel --prod
```

---

### Option 3: GitHub Integration (Most Common)

1. **Push to GitHub** (if not already):

   ```bash
   git add .
   git commit -m "chore: ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repository
   - Click "Deploy"

3. **Add Environment Variables** (Critical):
   - Go to Settings → Environment Variables
   - Add required variables from `env.example`

---

## 🔑 Essential Environment Variables

### Minimum Required (Add these in Vercel):

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App URLs
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
ALLOWED_ORIGINS=https://your-project.vercel.app

# Security (IMPORTANT)
NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS=false
RBAC_ENFORCEMENT=true
```

### Recommended (Add these for full functionality):

```bash
# Rate Limiting (Get free at upstash.com)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# Webhooks
WEBHOOK_URL=https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn
```

---

## ✅ Post-Deployment Steps (5 minutes)

### 1. Update Supabase Auth Callback

In Supabase Dashboard:

```
Authentication → URL Configuration → Redirect URLs
Add: https://your-project.vercel.app/auth/callback
```

### 2. Test Your Deployment

- Visit your Vercel URL
- Try logging in
- Create a test contract
- Generate a PDF

### 3. Configure Custom Domain (Optional)

```
Vercel Dashboard → Settings → Domains
Add your domain → Follow DNS instructions
```

---

## 🐛 Quick Troubleshooting

| Issue              | Solution                                      |
| ------------------ | --------------------------------------------- |
| Build fails        | Check build logs in Vercel dashboard          |
| Can't login        | Verify Supabase callback URL is correct       |
| Images not loading | Check Supabase storage bucket is public       |
| CORS errors        | Update `ALLOWED_ORIGINS` with your Vercel URL |
| 404 errors         | Clear Vercel cache and redeploy               |

---

## 🎉 That's It!

Your app should be live in **under 5 minutes**!

For detailed configuration, see [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

---

## 📞 Need Help?

1. Check Vercel build logs
2. Review environment variables
3. Verify Supabase configuration
4. Check browser console for errors

**Tip**: Most issues are caused by missing environment variables! ✅
