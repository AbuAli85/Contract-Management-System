# 🚀 Deploy to Vercel NOW - 3 Simple Steps

---

## Step 1: Push to GitHub (if not already)

```bash
git add .
git commit -m "ready for deployment"
git push origin main
```

---

## Step 2: Deploy to Vercel

### **Option A: Vercel Dashboard** (Easiest)

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **"Import Git Repository"**
3. Select **`Contract-Management-System`**
4. Click **"Deploy"**

### **Option B: Vercel CLI** (Fastest)

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Step 3: Add Environment Variables

**In Vercel Dashboard** → Settings → Environment Variables:

### Copy & Paste This (Update Values):

```bash
# === REQUIRED ===
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY
NEXT_PUBLIC_APP_URL=https://YOUR_PROJECT.vercel.app
ALLOWED_ORIGINS=https://YOUR_PROJECT.vercel.app
NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS=false
RBAC_ENFORCEMENT=true

# === OPTIONAL (but recommended) ===
UPSTASH_REDIS_REST_URL=https://YOUR_REDIS.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN

# Make.com Webhooks (All three)
MAKECOM_WEBHOOK_URL_EXTRA=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4
MAKECOM_WEBHOOK_URL_SHARAF_DG=https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn
MAKECOM_WEBHOOK_URL_GENERAL=https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz
WEBHOOK_URL=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4
```

**After adding variables, click "Redeploy"**

---

## ✅ Post-Deployment (5 minutes)

### Update Supabase Auth Callback:

```
1. Open Supabase Dashboard
2. Go to: Authentication → URL Configuration
3. Add Redirect URL: https://YOUR_PROJECT.vercel.app/auth/callback
4. Save
```

---

## 🧪 Test Your Deployment

Visit your Vercel URL and test:

- [ ] Homepage loads
- [ ] Can login
- [ ] Dashboard shows data
- [ ] Create a contract
- [ ] Generate PDF (Make.com webhook)

---

## 🎉 Done!

Your Contract Management System is now live!

**Need help?** Check:

- `VERCEL_QUICK_START.md` - Quick start guide
- `VERCEL_DEPLOYMENT_GUIDE.md` - Full documentation
- `VERCEL_DEPLOYMENT_CHECKLIST.md` - Complete checklist

---

## 🐛 Quick Troubleshooting

| Problem       | Fix                               |
| ------------- | --------------------------------- |
| Build fails   | Check environment variables       |
| Can't login   | Update Supabase callback URL      |
| PDF fails     | Verify Make.com webhook is active |
| Images broken | Check Supabase storage is public  |

---

**Deploy Time**: ~5 minutes
**Setup Time**: ~10 minutes
**Total Time to Live**: **~15 minutes** ⚡

---

## 📱 One More Thing...

After deployment:

1. **Get your URL**: `https://your-project.vercel.app`
2. **Share with team**: Send access links
3. **Test thoroughly**: Try all features
4. **Monitor**: Watch Vercel deployment logs

---

**That's it! You're live! 🚀**
