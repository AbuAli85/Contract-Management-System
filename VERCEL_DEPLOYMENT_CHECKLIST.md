# ✅ Vercel Deployment Checklist

Copy this checklist and mark items as you complete them.

---

## 📋 Pre-Deployment

- [ ] All code committed to Git
- [ ] Pushed to GitHub/GitLab/Bitbucket
- [ ] `.env.local` is NOT committed (check `.gitignore`)
- [ ] All dependencies installed (`npm install`)
- [ ] Build works locally (`npm run build`)
- [ ] Test locally (`npm run start`)

---

## 🔐 Supabase Setup

- [ ] Supabase project created
- [ ] Database tables migrated
- [ ] RLS policies configured
- [ ] Storage buckets created
- [ ] API keys copied (anon key & service role key)
- [ ] Auth providers enabled (email, Google, etc.)

---

## 🚀 Vercel Setup

- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Project configured
  - Framework: Next.js
  - Build Command: `npm run build`
  - Root Directory: `./`

---

## 🔑 Environment Variables (Critical!)

### Required

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (your Vercel URL)
- [ ] `ALLOWED_ORIGINS` (your Vercel URL)
- [ ] `NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS=false`

### Recommended

- [ ] `UPSTASH_REDIS_REST_URL` (for rate limiting)
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `WEBHOOK_URL` (Make.com webhook)
- [ ] `RBAC_ENFORCEMENT=true`

### Optional

- [ ] `NEXT_PUBLIC_SENTRY_DSN` (error tracking)
- [ ] SMTP settings (for emails)
- [ ] Analytics tokens

---

## 🌐 Domain Configuration

- [ ] Custom domain added to Vercel (optional)
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] `NEXT_PUBLIC_APP_URL` updated to custom domain
- [ ] `ALLOWED_ORIGINS` updated to custom domain

---

## 🔄 Post-Deployment Configuration

### Supabase

- [ ] Auth callback URL updated:
  ```
  https://your-project.vercel.app/auth/callback
  ```
- [ ] CORS configured with Vercel URL
- [ ] Storage policies tested

### Make.com

- [ ] Webhook endpoint confirmed:
  ```
  https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn
  ```
- [ ] Test webhook connection
- [ ] Verify PDF generation works

---

## 🧪 Testing

- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard displays
- [ ] Create promoter
- [ ] Upload images (ID card, passport)
- [ ] Create contract
- [ ] Generate PDF (Sharaf DG form)
- [ ] Download PDF works
- [ ] Navigation works
- [ ] Mobile responsive
- [ ] All API routes working
- [ ] No console errors
- [ ] No 404 errors

---

## 🔐 Security Verification

- [ ] Test accounts disabled in production
- [ ] Security headers active (check with securityheaders.com)
- [ ] HTTPS enforced
- [ ] CSP configured correctly
- [ ] Rate limiting active
- [ ] Debug modes disabled:
  - [ ] `DEBUG=false`
  - [ ] `DEBUG_AUTH=false`
  - [ ] `DEBUG_RBAC=false`
  - [ ] `DEBUG_API=false`

---

## 📊 Monitoring Setup

- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring (optional)
- [ ] Performance monitoring
- [ ] Log aggregation

---

## 🚨 Emergency Procedures

- [ ] Know how to rollback deployment
- [ ] Have backup of environment variables
- [ ] Emergency contact configured
- [ ] Maintenance mode tested
- [ ] Team members added to Vercel project

---

## 📱 Nice-to-Have

- [ ] PWA manifest configured
- [ ] Open Graph tags set
- [ ] Favicon uploaded
- [ ] 404 page customized
- [ ] 500 page customized
- [ ] Loading states optimized
- [ ] Analytics configured

---

## ✅ Final Verification

Before announcing to users:

- [ ] All features tested in production
- [ ] Performance acceptable (< 3s load time)
- [ ] Mobile experience tested
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Data backup strategy in place
- [ ] User documentation ready
- [ ] Support process defined
- [ ] Changelog prepared

---

## 🎉 Go Live!

- [ ] Announce to team
- [ ] Send access links
- [ ] Monitor initial usage
- [ ] Be ready for quick fixes
- [ ] Gather user feedback

---

## 📞 Quick Reference

| Resource           | Link                              |
| ------------------ | --------------------------------- |
| Vercel Dashboard   | https://vercel.com/dashboard      |
| Supabase Dashboard | https://app.supabase.com          |
| Make.com Dashboard | https://www.make.com/en/scenarios |
| Upstash Dashboard  | https://console.upstash.com       |
| Sentry Dashboard   | https://sentry.io                 |

---

## 🐛 Common Issues

| Issue            | Quick Fix                              |
| ---------------- | -------------------------------------- |
| Build fails      | Check environment variables            |
| Can't login      | Verify Supabase callback URL           |
| 404 errors       | Clear Vercel cache, redeploy           |
| Images broken    | Check Supabase storage policies        |
| Slow performance | Check function timeouts in vercel.json |
| CORS errors      | Update ALLOWED_ORIGINS                 |

---

**Last Updated**: [Date]

**Deployed By**: [Your Name]

**Production URL**: https://********\_\_\_********

**Status**: [ ] In Progress [ ] Ready [ ] Live ✅
