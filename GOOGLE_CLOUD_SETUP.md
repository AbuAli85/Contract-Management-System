# Google Cloud Setup Guide
## For Backend Contract Generation (Bypasses Make.com Restrictions)

---

## **🎯 Why This Approach?**

Make.com doesn't allow restricted Google API scopes with Gmail (@gmail.com) accounts.

**Solution:** Your backend will handle Google Docs operations directly using:
- ✅ Google Docs API (copy and replace text)
- ✅ Google Drive API (file management)
- ✅ OAuth 2.0 authentication
- ✅ Works with ANY Google account (Gmail or Workspace)

---

## **📋 Step 1: Create Google Cloud Project**

1. **Go to:** https://console.cloud.google.com/

2. **Create a new project:**
   - Click "Select a project" → "New Project"
   - Project name: `Contract Management System`
   - Click "Create"

3. **Wait for project creation** (takes ~30 seconds)

4. **Select your new project** from the dropdown

---

## **📋 Step 2: Enable Required APIs**

1. **Go to:** "APIs & Services" → "Library"

2. **Enable these APIs:**
   - Search "Google Docs API" → Click → Enable
   - Search "Google Drive API" → Click → Enable

---

## **📋 Step 3: Create OAuth 2.0 Credentials**

1. **Go to:** "APIs & Services" → "Credentials"

2. **Configure OAuth Consent Screen:**
   - Click "Configure Consent Screen"
   - User Type: **External** → Create
   - App name: `Contract Management System`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Click "Add or Remove Scopes"
     - Select: `https://www.googleapis.com/auth/documents`
     - Select: `https://www.googleapis.com/auth/drive.file`
   - Click "Save and Continue"
   - Test users: Add your email (luxsess2001@gmail.com)
   - Click "Save and Continue"

3. **Create OAuth 2.0 Client:**
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `Contract System Backend`
   - Authorized redirect URIs: Add:
     - `http://localhost:3000/api/auth/google/callback`
     - `https://your-app-domain.com/api/auth/google/callback`
   - Click "Create"

4. **Save credentials:**
   - You'll see Client ID and Client Secret
   - **Copy both** - you'll need them!

---

## **📋 Step 4: Get Access Token and Refresh Token**

### **Method 1: Use OAuth Playground**

1. **Go to:** https://developers.google.com/oauthplayground/

2. **Configure:**
   - Click settings (gear icon)
   - Check "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret
   - Close settings

3. **Authorize:**
   - In "Step 1", scroll to "Drive API v3"
   - Select:
     - `https://www.googleapis.com/auth/documents`
     - `https://www.googleapis.com/auth/drive.file`
   - Click "Authorize APIs"
   - Sign in with your Google account
   - Click "Allow"

4. **Get tokens:**
   - Click "Exchange authorization code for tokens"
   - You'll see:
     - `access_token`: (copy this)
     - `refresh_token`: (copy this)
   - **Save both tokens!**

---

## **📋 Step 5: Add Environment Variables**

Add these to your `.env.local` file:

```env
# Google Cloud OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Google OAuth Tokens
GOOGLE_ACCESS_TOKEN=ya29.a0AfB_byD...
GOOGLE_REFRESH_TOKEN=1//0gX...

# Template Document ID
GOOGLE_DOCS_TEMPLATE_ID=1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0
```

---

## **📋 Step 6: Test the Setup**

Create a test endpoint:

```typescript
// app/api/test-google/route.ts
import { googleDocsService } from '@/lib/google-docs-service';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await googleDocsService.generateContract({
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

Visit: `http://localhost:3000/api/test-google`

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

### **Error: "invalid_client"**
- Check Client ID and Secret are correct
- Make sure they're from the same project

### **Error: "redirect_uri_mismatch"**
- Add the redirect URI to OAuth consent screen
- Must match exactly (including http/https)

### **Error: "Invalid Credentials"**
- Access token expired (they expire in ~1 hour)
- Refresh token should get a new access token automatically
- If refresh token is missing, redo OAuth flow

### **Error: "insufficient permissions"**
- Make sure you authorized the correct scopes:
  - `https://www.googleapis.com/auth/documents`
  - `https://www.googleapis.com/auth/drive.file`

---

## **🎯 Next Steps**

Once the Google Docs service is working:

1. ✅ Test contract generation
2. ✅ Update contract generation endpoint to use this service
3. ✅ Remove Make.com dependency
4. ✅ Add image insertion (if needed)
5. ✅ Add PDF conversion
6. ✅ Upload PDFs to Supabase storage

---

## **🔄 Token Refresh (Automatic)**

The googleapis library automatically refreshes access tokens using the refresh token, so you don't need to worry about token expiration!

---

## **📊 Comparison: Make.com vs Backend**

| Feature | Make.com | Backend (This Solution) |
|---------|----------|------------------------|
| Gmail Support | ❌ Restricted | ✅ Full support |
| Text Replacement | ⚠️ UI issues | ✅ Direct API |
| Image Support | ⚠️ Complex | ✅ Easier |
| Error Handling | ❌ Limited | ✅ Full control |
| Cost | 💰 Per operation | ✅ Free (just Google API) |
| Reliability | ⚠️ Depends on Make | ✅ Your control |

---

**This backend approach is more reliable and gives you full control!** 🚀

