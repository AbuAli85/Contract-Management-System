# Google Service Account Setup (RECOMMENDED)

## Bypass OAuth Restricted Scope Issues

---

## **🎯 Why Service Account?**

**Problem:** `https://www.googleapis.com/auth/documents` is a **restricted scope** that requires:

- ❌ Google security assessment
- ❌ App verification (takes weeks)
- ❌ Not available without approval

**Solution:** Use a **Service Account** instead:

- ✅ No OAuth consent screen
- ✅ No restricted scope issues
- ✅ Works immediately
- ✅ Perfect for server-to-server operations
- ✅ No user authorization needed

---

## **📋 Step 1: Enable APIs**

1. **Go to:** https://console.cloud.google.com/

2. **Select your project** (or create one)

3. **Enable APIs:**
   - Go to: "APIs & Services" → "Library"
   - Search "Google Docs API" → Enable
   - Search "Google Drive API" → Enable

---

## **📋 Step 2: Create Service Account**

1. **Go to:** "IAM & Admin" → "Service Accounts"

2. **Create Service Account:**
   - Click "Create Service Account"
   - Service account name: `contract-generator`
   - Service account ID: `contract-generator` (auto-filled)
   - Click "Create and Continue"

3. **Grant permissions:**
   - Skip this (click "Continue")
   - We'll grant permissions through document sharing

4. **Done:**
   - Click "Done"

---

## **📋 Step 3: Create Service Account Key**

1. **Click on the service account** you just created

2. **Go to "Keys" tab**

3. **Create key:**
   - Click "Add Key" → "Create new key"
   - Key type: **JSON**
   - Click "Create"

4. **Save the file:**
   - A JSON file will download automatically
   - **Keep this file secure!** It contains credentials
   - Sample filename: `contract-system-abc123.json`

---

## **📋 Step 4: Share Template with Service Account**

This is **critical**! The service account needs permission to access your template.

1. **Open your Google Docs template:**
   - https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit

2. **Click "Share" button**

3. **Add service account email:**
   - Find the email in the JSON file: look for `"client_email"`
   - It looks like: `contract-generator@your-project-id.iam.gserviceaccount.com`
   - Or copy it from Google Cloud Console → Service Accounts page

4. **Set permission:**
   - Role: **Editor**
   - Uncheck "Notify people"
   - Click "Share"

✅ **Done!** The service account can now access the template.

---

## **📋 Step 5: Add Service Account Key to Environment**

1. **Open the downloaded JSON file**

2. **Copy the ENTIRE contents**

3. **Add to your `.env.local`:**

```env
# Google Service Account (for contract generation)
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"your-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"contract-generator@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"your-cert-url"}'

# Template Document ID
GOOGLE_DOCS_TEMPLATE_ID=1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0
```

**Important:**

- Wrap the entire JSON in **single quotes** `'...'`
- Keep it on **one line** (no line breaks)
- Or use a `.json` file and read it in code

---

## **📋 Step 6: Update Your Code**

Use the Service Account version:

```typescript
// In your contract generation route
import { googleDocsServiceSA } from '@/lib/google-docs-service-sa';

// Generate contract
const result = await googleDocsServiceSA.generateContract({
  ref_number: 'PAC-2025-001',
  contract_number: 'PAC-2025-001',
  first_party_name_ar: 'شركة اكسترا',
  first_party_name_en: 'eXtra',
  first_party_crn: '1234567',
  second_party_name_ar: 'شركة المورد',
  second_party_name_en: 'Vendor Co',
  second_party_crn: '7654321',
  promoter_name_ar: 'محمد أحمد',
  promoter_name_en: 'Mohammed Ahmed',
  id_card_number: '123456789',
  contract_start_date: '2025-01-01',
  contract_end_date: '2025-12-31',
});
```

---

## **📋 Step 7: Test**

Create a test endpoint:

```typescript
// app/api/test-google-sa/route.ts
import { googleDocsServiceSA } from '@/lib/google-docs-service-sa';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await googleDocsServiceSA.generateContract({
    ref_number: 'TEST-001',
    contract_number: 'TEST-001',
    first_party_name_ar: 'شركة اكسترا',
    first_party_name_en: 'eXtra',
    first_party_crn: '1234567',
    second_party_name_ar: 'شركة المورد',
    second_party_name_en: 'Vendor Co',
    second_party_crn: '7654321',
    promoter_name_ar: 'محمد أحمد',
    promoter_name_en: 'Mohammed Ahmed',
    id_card_number: '123456789',
    contract_start_date: '2025-01-01',
    contract_end_date: '2025-12-31',
  });

  return NextResponse.json(result);
}
```

Visit: `http://localhost:3000/api/test-google-sa`

**Expected result:**

```json
{
  "success": true,
  "documentId": "1abc...",
  "documentUrl": "https://docs.google.com/document/d/1abc.../edit",
  "pdfUrl": "https://docs.google.com/document/d/1abc.../export?format=pdf"
}
```

---

## **🔧 Troubleshooting**

### **Error: "Invalid JWT Signature"**

- Service account key is malformed
- Check the JSON is valid
- Make sure private_key has proper line breaks (`\n`)

### **Error: "Insufficient Permission" or "403 Forbidden"**

- Service account doesn't have access to template
- **Solution:** Share the template with service account email (Step 4)

### **Error: "The caller does not have permission"**

- APIs not enabled
- **Solution:** Enable Google Docs API and Google Drive API

### **Error: "File not found"**

- Wrong template ID
- **Solution:** Verify template ID is correct

---

## **📊 Service Account vs OAuth Comparison**

| Feature               | Service Account       | OAuth 2.0        |
| --------------------- | --------------------- | ---------------- |
| Setup Complexity      | ✅ Simple             | ⚠️ Complex       |
| Restricted Scopes     | ✅ No issues          | ❌ Blocked       |
| User Authorization    | ✅ Not needed         | ❌ Required      |
| Gmail Account Support | ✅ Yes                | ❌ No            |
| Security Review       | ✅ Not needed         | ❌ Required      |
| Best For              | ✅ Backend automation | User-facing apps |

**Recommendation:** Use **Service Account** for contract generation!

---

## **🔒 Security Best Practices**

1. **Never commit the JSON key file to Git**
   - Add `*.json` to `.gitignore`
   - Use environment variables

2. **Restrict service account permissions**
   - Only share specific documents with it
   - Don't make it owner of files

3. **Rotate keys periodically**
   - Create new key every 90 days
   - Delete old keys

4. **Store key securely in production**
   - Use Vercel Environment Variables
   - Or use secret management (Google Secret Manager)

---

## **🚀 Deployment to Vercel**

When deploying to Vercel:

1. **Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

2. **Add:**

   ```
   Name: GOOGLE_SERVICE_ACCOUNT_KEY
   Value: [Paste the entire JSON content]
   ```

3. **Redeploy** your app

---

## **✅ Summary**

**Total setup time:** ~10 minutes

**Steps:**

1. ✅ Enable APIs (2 min)
2. ✅ Create service account (2 min)
3. ✅ Create key (1 min)
4. ✅ Share template with service account (1 min)
5. ✅ Add key to `.env.local` (2 min)
6. ✅ Test (2 min)

**Result:** Contract generation works perfectly without any OAuth or scope restrictions! 🎉

---

**This is the BEST solution for your use case!** 🚀
