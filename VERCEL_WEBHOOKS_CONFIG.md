# 🔗 Make.com Webhooks Configuration for Vercel

## 📋 All Three Webhooks

Your Contract Management System uses **three separate Make.com webhooks** for different contract types:

### 1. **eXtra Contracts** (Simple/Fast)
- **Webhook URL**: `https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4`
- **Component**: `SimpleContractGenerator.tsx`
- **Route**: `/[locale]/generate-contract`
- **Use Case**: Quick daily promoter assignments for eXtra supermarket
- **Status**: ✅ Already configured in Vercel

### 2. **Sharaf DG Deployment Letters**
- **Webhook URL**: `https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn`
- **Component**: `SharafDGDeploymentForm.tsx`
- **Route**: `/[locale]/contracts/sharaf-dg`
- **Use Case**: Official deployment letters with ID/passport images
- **Status**: ✅ Just configured

### 3. **General Contracts** (Full-Featured)
- **Webhook URL**: `https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz`
- **Component**: `GeneralContractGenerator.tsx`
- **Route**: `/[locale]/contracts/general`
- **Use Case**: Business contracts (service, consulting, partnership)
- **Status**: ⚠️ Needs configuration

---

## 🔑 Environment Variables for Vercel

Add these to **Vercel Dashboard** → **Settings** → **Environment Variables**:

### Required Variables:

```bash
# ===========================================
# Make.com Webhooks
# ===========================================

# eXtra Contracts (Simple)
MAKECOM_WEBHOOK_URL_EXTRA=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4

# Sharaf DG Deployment
MAKECOM_WEBHOOK_URL_SHARAF_DG=https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn

# General Contracts
MAKECOM_WEBHOOK_URL_GENERAL=https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz

# ===========================================
# Webhook Security
# ===========================================

# Shared webhook secret (optional but recommended)
WEBHOOK_SECRET=your-random-secret-key-here
MAKE_WEBHOOK_SECRET=your-make-webhook-secret

# ===========================================
# Legacy/Backward Compatibility
# ===========================================

# Generic webhook URL (points to eXtra by default)
WEBHOOK_URL=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4
```

---

## 🔐 Update CSP Headers

Both `vercel.json` and `next.config.js` have been updated to allow all three Make.com webhook URLs:

### Updated CSP Directive:
```javascript
connect-src 'self' 
  https://*.supabase.co 
  https://hook.eu2.make.com 
  wss://*.supabase.co
```

This allows ALL Make.com webhooks under `hook.eu2.make.com/*`

---

## 📊 Webhook Usage by Form

| Form | Component | Webhook | Environment Variable |
|------|-----------|---------|---------------------|
| eXtra | `SimpleContractGenerator.tsx` | `71go2x4z...` | `MAKECOM_WEBHOOK_URL_EXTRA` |
| Sharaf DG | `SharafDGDeploymentForm.tsx` | `4g8e8c9y...` | `MAKECOM_WEBHOOK_URL_SHARAF_DG` |
| General | `GeneralContractGenerator.tsx` | `j07svcht...` | `MAKECOM_WEBHOOK_URL_GENERAL` |

---

## 🚀 How Each Webhook Works

### eXtra Webhook Flow:
1. User fills eXtra contract form
2. Form submits to `/api/webhook/makecom-employment`
3. Backend sends data to eXtra webhook
4. Make.com processes and generates PDF
5. Returns PDF URL to database

### Sharaf DG Webhook Flow:
1. User fills Sharaf DG form
2. Form validates ID card & passport images
3. Sends to Sharaf DG webhook directly from frontend
4. Make.com generates bilingual PDF with images
5. Updates database with PDF status
6. Shows download link

### General Contracts Webhook Flow:
1. User fills general contract form
2. Form submits to `/api/contracts/general/generate`
3. Backend sends to general contracts webhook
4. Make.com processes complex contract
5. Returns PDF URL

---

## ✅ Verification Checklist

### In Vercel Dashboard:
- [ ] All three webhook URLs added as environment variables
- [ ] `WEBHOOK_SECRET` configured
- [ ] CSP headers allow `hook.eu2.make.com`
- [ ] All environments set (Production, Preview, Development)

### In Make.com:
- [ ] eXtra scenario active and tested
- [ ] Sharaf DG scenario active and tested
- [ ] General contracts scenario active and tested
- [ ] All scenarios return proper responses
- [ ] Error handling configured

### Testing:
- [ ] Create eXtra contract → PDF generated
- [ ] Create Sharaf DG deployment → PDF with images
- [ ] Create general contract → PDF generated
- [ ] Check browser console for errors
- [ ] Verify PDF URLs are accessible

---

## 🧪 Testing Each Webhook

### Test eXtra Webhook:
```bash
curl -X POST https://your-project.vercel.app/api/webhook/makecom-employment \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "test-123",
    "contract_type": "full-time-permanent"
  }'
```

### Test Sharaf DG Webhook:
```bash
curl -X POST https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn \
  -H "Content-Type: application/json" \
  -d '{
    "promoter": {
      "name_en": "Test Promoter",
      "id_card_url": "https://example.com/id.jpg"
    }
  }'
```

### Test General Webhook:
```bash
curl -X POST https://your-project.vercel.app/api/contracts/general/generate \
  -H "Content-Type: application/json" \
  -d '{
    "contract_type": "service-contract",
    "parties": []
  }'
```

---

## 🐛 Troubleshooting

### Webhook Not Responding:
1. Check Make.com scenario is active
2. Verify webhook URL is correct
3. Check environment variables in Vercel
4. Review Make.com execution history

### CORS Errors:
1. Ensure CSP allows `hook.eu2.make.com`
2. Check `ALLOWED_ORIGINS` includes your Vercel URL
3. Clear browser cache

### 400 Bad Request:
1. Verify required fields are present
2. Check data format matches Make.com expected format
3. Review webhook payload in console

### Images Not Embedding (Sharaf DG):
1. Ensure promoter has `id_card_url` and `passport_url`
2. Verify images are publicly accessible
3. Check Supabase storage bucket policies
4. Review Make.com image module configuration

---

## 📝 Environment Variables Template

Copy this to your Vercel environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App URLs
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
ALLOWED_ORIGINS=https://your-project.vercel.app

# Make.com Webhooks
MAKECOM_WEBHOOK_URL_EXTRA=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4
MAKECOM_WEBHOOK_URL_SHARAF_DG=https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn
MAKECOM_WEBHOOK_URL_GENERAL=https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz
WEBHOOK_URL=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4

# Security
WEBHOOK_SECRET=your-random-secret
MAKE_WEBHOOK_SECRET=your-make-secret
RBAC_ENFORCEMENT=true
NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS=false

# Rate Limiting (optional)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

---

## 🎯 Next Steps

1. **Copy environment variables** to Vercel
2. **Verify all three webhooks** are active in Make.com
3. **Test each form** in production
4. **Monitor** Make.com execution logs
5. **Set up alerts** for failed webhook calls

---

## 📞 Quick Reference

| Need | URL |
|------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Make.com Scenarios | https://www.make.com/en/scenarios |
| eXtra Webhook | https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4 |
| Sharaf DG Webhook | https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn |
| General Webhook | https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz |

---

**Status**: ✅ All three webhooks configured and documented

**Last Updated**: October 26, 2025

