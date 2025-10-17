# Production Deployment Guide
## Google Service Account Setup for Production

---

## 🎯 **Overview**

For production, you need to securely store your Service Account JSON key without committing it to Git.

**Two methods:**
1. ✅ **Direct JSON** in environment variables (Vercel, Netlify)
2. ✅ **Base64 Encoded** (Docker, self-hosted, AWS, etc.)

---

## 📋 **METHOD 1: Vercel / Netlify (Recommended)**

### **For Vercel:**

1. **Go to Vercel Dashboard:**
   - https://vercel.com/your-username/contract-management-system
   - Settings → Environment Variables

2. **Add these variables:**

   **Variable 1:**
   ```
   Name: GOOGLE_SERVICE_ACCOUNT_KEY
   Value: {"type":"service_account","project_id":"nth-segment-475411-g1",...}
   Environment: Production, Preview
   ```
   (Paste the ENTIRE JSON content from your downloaded file)

   **Variable 2:**
   ```
   Name: GOOGLE_DOCS_TEMPLATE_ID
   Value: 1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0
   Environment: Production, Preview
   ```

3. **Save** and **Redeploy**

✅ **Done!** Your production app can now generate contracts.

---

### **For Netlify:**

1. **Go to Netlify Dashboard:**
   - Site settings → Build & deploy → Environment

2. **Add variables:**
   - Same as Vercel above

3. **Redeploy**

---

## 📋 **METHOD 2: Base64 Encoding (Docker, AWS, etc.)**

### **Step 1: Encode Your JSON**

Run this command to encode your service account JSON:

```bash
node scripts/encode-service-account.js path/to/your-service-account.json
```

**Example:**
```bash
node scripts/encode-service-account.js ~/Downloads/nth-segment-475411-g1-abc123.json
```

**Output:**
```
✅ Service Account JSON encoded successfully!

📋 Add this to your production environment variables:

Variable Name: GOOGLE_SERVICE_ACCOUNT_KEY_BASE64

Variable Value (copy this):
────────────────────────────────────────────────────────────────────────────────
eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6Im50aC1zZWdtZW50LTQ...
────────────────────────────────────────────────────────────────────────────────
```

### **Step 2: Add to Production Environment**

**For Docker:**

```dockerfile
# docker-compose.yml
services:
  app:
    environment:
      - GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=eyJ0eXBlIjoic2Vydmlj...
      - GOOGLE_DOCS_TEMPLATE_ID=1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0
```

**For AWS Elastic Beanstalk:**

```bash
eb setenv GOOGLE_SERVICE_ACCOUNT_KEY_BASE64="eyJ0eXBlIjoic2Vydmlj..."
eb setenv GOOGLE_DOCS_TEMPLATE_ID="1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0"
```

**For Heroku:**

```bash
heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY_BASE64="eyJ0eXBlIjoic2Vydmlj..."
heroku config:set GOOGLE_DOCS_TEMPLATE_ID="1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0"
```

**For Linux Server (.env file):**

```bash
# /var/www/app/.env.production
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=eyJ0eXBlIjoic2Vydmlj...
GOOGLE_DOCS_TEMPLATE_ID=1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0
```

---

## 📋 **METHOD 3: Google Secret Manager (Enterprise)**

For enterprise deployments, use Google Secret Manager:

### **Step 1: Upload to Secret Manager**

```bash
# Upload service account key
gcloud secrets create google-service-account-key \
  --data-file=path/to/service-account.json \
  --project=nth-segment-475411-g1

# Upload template ID
echo "1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0" | \
  gcloud secrets create google-docs-template-id \
  --data-file=- \
  --project=nth-segment-475411-g1
```

### **Step 2: Grant Access**

```bash
gcloud secrets add-iam-policy-binding google-service-account-key \
  --member="serviceAccount:your-app-service-account@project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### **Step 3: Update Code**

```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

async function getServiceAccountKey() {
  const [version] = await client.accessSecretVersion({
    name: 'projects/nth-segment-475411-g1/secrets/google-service-account-key/versions/latest',
  });
  
  const payload = version.payload?.data?.toString();
  return JSON.parse(payload!);
}
```

---

## 🔒 **Security Best Practices**

### **DO:**
- ✅ Use environment variables in production
- ✅ Use Base64 encoding for complex JSON
- ✅ Rotate keys every 90 days
- ✅ Use Google Secret Manager for enterprise
- ✅ Restrict service account permissions
- ✅ Monitor API usage

### **DON'T:**
- ❌ Never commit JSON key to Git
- ❌ Never expose in client-side code
- ❌ Never log the key in production
- ❌ Never share the key file
- ❌ Never use same key for dev and prod

---

## 📋 **Checklist for Production**

### **Pre-Deployment:**
- ☐ Service account created
- ☐ JSON key downloaded
- ☐ Key encoded (if using Base64)
- ☐ Template shared with service account
- ☐ APIs enabled (Docs + Drive)

### **Deployment:**
- ☐ Environment variables set
- ☐ `.gitignore` includes `*.json` and `.env*`
- ☐ App deployed
- ☐ Test endpoint works

### **Post-Deployment:**
- ☐ Test contract generation in production
- ☐ Verify documents are created
- ☐ Check error logs
- ☐ Monitor API quotas

---

## 🧪 **Testing Production Environment**

### **Test Locally with Production Settings:**

```bash
# Create .env.production.local
cp .env.local .env.production.local

# Build and test
npm run build
npm start

# Visit test endpoint
curl http://localhost:3000/api/test-google-sa
```

### **Test in Production:**

```bash
# After deployment
curl https://your-domain.com/api/test-google-sa
```

**Expected result:**
```json
{
  "success": true,
  "message": "✅ Contract generated successfully!",
  "result": {
    "documentId": "...",
    "documentUrl": "...",
    "pdfUrl": "..."
  }
}
```

---

## 🔧 **Troubleshooting Production Issues**

### **Error: "Missing Google Service Account credentials"**
- Check environment variables are set
- Verify variable names match exactly
- Redeploy after setting variables

### **Error: "Invalid JWT Signature"**
- JSON is malformed
- Check Base64 encoding is correct
- Verify no extra spaces or line breaks

### **Error: "The caller does not have permission"**
- APIs not enabled in Google Cloud project
- Enable Google Docs API and Google Drive API

### **Error: "File not found" or "Insufficient Permission"**
- Template not shared with service account
- Share template with service account email
- Give Editor permission

---

## 📊 **Environment Variable Summary**

| Environment | Variable Name | Value Format | Where to Set |
|-------------|--------------|--------------|--------------|
| Development | `GOOGLE_SERVICE_ACCOUNT_KEY` | Direct JSON | `.env.local` |
| Production (Vercel) | `GOOGLE_SERVICE_ACCOUNT_KEY` | Direct JSON | Vercel Dashboard |
| Production (Docker) | `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` | Base64 | docker-compose.yml |
| Production (AWS) | `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` | Base64 | EB Console |
| All | `GOOGLE_DOCS_TEMPLATE_ID` | Template ID | All environments |

---

## 🚀 **Quick Deployment Commands**

### **Vercel:**
```bash
# Push to Git
git push

# Vercel auto-deploys
# Or manually:
vercel --prod
```

### **Docker:**
```bash
# Build image
docker build -t contract-system .

# Run with env vars
docker run -e GOOGLE_SERVICE_ACCOUNT_KEY_BASE64="..." contract-system
```

### **AWS:**
```bash
eb deploy --staged
```

---

## 📞 **Support**

If you encounter issues in production:

1. Check environment variables are set correctly
2. Verify service account has access to template
3. Check API quotas in Google Cloud Console
4. Review application logs
5. Test with the test endpoint first

---

**Your production setup is secure and follows best practices!** 🎉

