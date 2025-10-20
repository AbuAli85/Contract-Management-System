# 🚀 Production Environment Setup for Google Service Account

## 🔴 **Current Issue:**

Your **local development** has the service account configured, but **production** (`https://portal.thesmartpro.io`) does NOT have the environment variables set.

`.env.local` files are **NEVER deployed** to production (they're gitignored for security).

---

## ✅ **SOLUTION: Configure Production Environment Variables**

### **Step 1: Encode Your Service Account Key for Production**

Run this command to create a Base64-encoded version (safe for single-line environment variables):

```bash
node scripts/encode-service-account.js .env.local
```

**Or create a new script to extract from .env.local:**

```bash
# Run this command
node -e "require('dotenv').config({path:'.env.local'}); console.log(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY).toString('base64'))"
```

**Copy the output** - it will be a long Base64 string like:

```
eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6Im50aC1zZWdtZW50LTQ3NTQxMS1nMSIsInByaXZh...
```

---

### **Step 2: Add to Your Production Platform**

Depending on where you're hosting:

#### **If using Vercel:**

1. **Go to:** https://vercel.com/your-username/your-project/settings/environment-variables

2. **Add these environment variables:**

| Name                                | Value                                          | Environment |
| ----------------------------------- | ---------------------------------------------- | ----------- |
| `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` | `<paste the Base64 string>`                    | Production  |
| `GOOGLE_DOCS_TEMPLATE_ID`           | `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0` | Production  |

3. **Click "Save"**

4. **Redeploy:**
   - Go to "Deployments" tab
   - Click the three dots on latest deployment
   - Click "Redeploy"

---

#### **If using Railway:**

1. **Go to your project dashboard**

2. **Click "Variables" tab**

3. **Add:**
   - `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` = `<Base64 string>`
   - `GOOGLE_DOCS_TEMPLATE_ID` = `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`

4. **Redeploy** (happens automatically)

---

#### **If using Netlify:**

1. **Go to:** Site settings → Environment variables

2. **Add:**
   - `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` = `<Base64 string>`
   - `GOOGLE_DOCS_TEMPLATE_ID` = `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`

3. **Redeploy** (trigger a new deploy)

---

#### **If using your own server:**

Add to your server's environment variables or `.env` file:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64='<paste Base64 string here>'
GOOGLE_DOCS_TEMPLATE_ID='1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0'
```

Then restart your application.

---

### **Step 3: Verify Template is Shared**

Make sure your Google Docs template is shared with the service account:

1. **Open:** https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit

2. **Click "Share"**

3. **Add:** `contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com`

4. **Permission:** Editor

5. **Uncheck** "Notify people"

6. **Click "Done"**

---

### **Step 4: Test Production**

After setting environment variables and redeploying:

```
https://portal.thesmartpro.io/api/test-google-sa
```

**Expected result:**

```json
{
  "success": true,
  "message": "✅ Contract generated successfully!",
  "result": {
    "documentId": "...",
    "documentUrl": "https://docs.google.com/document/d/.../edit",
    "pdfUrl": "https://docs.google.com/document/d/.../export?format=pdf"
  }
}
```

---

## 🔧 **Quick Helper Script**

Let me create a script to generate the Base64 string for you:
