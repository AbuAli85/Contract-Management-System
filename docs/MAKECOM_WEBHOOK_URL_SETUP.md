# Make.com Webhook URL Setup Guide

## 🚨 **Issue Identified**

Your contract generation is working perfectly, but Make.com webhook is failing because:

```json
"makecom": {
  "triggered": true,
  "success": false,
  "status": 0,
  "error": "Webhook URL not configured",
  "timestamp": "2025-10-22T11:52:37.822Z"
}
```

**Root Cause**: The `MAKECOM_WEBHOOK_URL` environment variable is not set.

---

## ✅ **Solution: Configure Environment Variable**

### **Step 1: Get Your Make.com Webhook URL**

1. **Go to Make.com Dashboard**
2. **Open your contract generation scenario**
3. **Click on the first module (Webhook trigger)**
4. **Copy the webhook URL** (looks like: `https://hook.eu2.make.com/xxxxxxxxxxxx`)

### **Step 2: Add Environment Variable**

**Option A: Add to Vercel (Recommended for Production)**

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add new variable:**
   - **Name**: `MAKECOM_WEBHOOK_URL`
   - **Value**: `https://hook.eu2.make.com/YOUR_WEBHOOK_ID`
   - **Environment**: Production, Preview, Development

**Option B: Add to .env.local (For Local Development)**

1. **Open your `.env.local` file**
2. **Add this line:**
   ```env
   MAKECOM_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_WEBHOOK_ID
   ```

### **Step 3: Redeploy**

After adding the environment variable:

```bash
# If using Vercel
git add .
git commit -m "Add MAKECOM_WEBHOOK_URL environment variable"
git push origin main

# Vercel will automatically redeploy with the new environment variable
```

---

## 🔧 **Complete Environment Variables Setup**

Here's the complete list of environment variables you need:

### **Required for Make.com Integration:**

```env
# Make.com Webhook URL (REQUIRED)
MAKECOM_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_WEBHOOK_ID

# Make.com Webhook Secret (Optional but recommended)
MAKE_WEBHOOK_SECRET=your-webhook-secret-here

# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Google Drive (For Make.com to save PDFs)
GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
```

---

## 🧪 **Test the Configuration**

### **Step 1: Check Environment Variable**

After adding the environment variable, test it:

```bash
# Check if the variable is set (in your terminal)
echo $MAKECOM_WEBHOOK_URL

# Or check in your app
console.log('Webhook URL:', process.env.MAKECOM_WEBHOOK_URL);
```

### **Step 2: Test Contract Generation**

1. **Go to Simple Contracts page**
2. **Fill out the form**
3. **Submit contract generation**
4. **Check the response** - should now show:

```json
{
  "success": true,
  "data": {
    "makecom": {
      "triggered": true,
      "success": true,
      "status": 200,
      "response": "Accepted",
      "webhook_url": "https://hook.eu2.make.com/YOUR_WEBHOOK_ID"
    }
  }
}
```

---

## 🔍 **Expected Results After Fix**

### **Before (Current):**
```json
"makecom": {
  "triggered": true,
  "success": false,
  "status": 0,
  "error": "Webhook URL not configured"
}
```

### **After (Fixed):**
```json
"makecom": {
  "triggered": true,
  "success": true,
  "status": 200,
  "response": "Accepted",
  "webhook_url": "https://hook.eu2.make.com/YOUR_WEBHOOK_ID"
}
```

---

## 🎯 **Make.com Scenario Requirements**

Your Make.com scenario should:

1. **Accept POST requests** from your webhook URL
2. **Process the contract data** (promoter info, party details, etc.)
3. **Generate PDF** using Google Docs template
4. **Return success response** (e.g., "Accepted" or `{"success": true}`)

### **Expected Webhook Payload:**

Your Make.com scenario will receive data like this:

```json
{
  "contract_id": "657f6212-bf31-4860-bc44-5e9621d11503",
  "contract_number": "PAC-22102025-5333",
  "contract_type": "full-time-permanent",
  "promoter_name_en": "Ahmed Al-Rashid",
  "promoter_name_ar": "أحمد الراشد",
  "stored_promoter_id_card_image_url": "https://reootcngcptfogfozlmz.supabase.co/...",
  "stored_promoter_passport_image_url": "https://reootcngcptfogfozlmz.supabase.co/...",
  "first_party_name_en": "ABC Company",
  "first_party_name_ar": "شركة ABC",
  "stored_first_party_logo_url": "https://reootcngcptfogfozlmz.supabase.co/...",
  "second_party_name_en": "XYZ Corporation",
  "second_party_name_ar": "شركة XYZ",
  "stored_second_party_logo_url": "https://via.placeholder.com/...",
  "job_title": "Sales Manager",
  "basic_salary": 5000,
  "contract_start_date": "2024-01-15T00:00:00.000Z",
  "contract_end_date": "2024-12-31T00:00:00.000Z"
}
```

---

## 🚀 **Quick Fix Steps**

1. **Get your Make.com webhook URL** from your scenario
2. **Add `MAKECOM_WEBHOOK_URL`** to Vercel environment variables
3. **Redeploy** your application
4. **Test contract generation** - should now work!

**Once you add the `MAKECOM_WEBHOOK_URL` environment variable, your Make.com integration will work perfectly!** 🎉

---

## 📞 **Need Help?**

If you need help finding your Make.com webhook URL:

1. **Go to Make.com** → Your scenario
2. **Click the first module** (usually a webhook icon)
3. **Look for "Webhook URL"** or "Copy URL" button
4. **Copy the URL** (starts with `https://hook.eu2.make.com/`)

The URL should look like: `https://hook.eu2.make.com/xxxxxxxxxxxxxxxx`
