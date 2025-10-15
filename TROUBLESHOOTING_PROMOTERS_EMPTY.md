# 🔧 Troubleshooting: Promoters Not Displaying

## Problem
The promoters page shows "No promoters yet" even though data exists in the database.

## Root Cause
Missing Supabase environment variables in `.env.local` file.

---

## ✅ Solution

### Step 1: Create `.env.local` File

Create a file named `.env.local` in the root directory with your Supabase credentials:

```bash
# ========================================
# 🔑 SUPABASE CONFIGURATION (REQUIRED)
# ========================================

# Your Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase Anon Key (public key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your Supabase Service Role Key (private key - never expose!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Auth Redirect URL
NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

### Step 2: Get Your Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Step 3: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 4: Check the Console Logs

Open your browser console (F12) and check the terminal for these logs:

✅ **Success logs:**
```
🔍 API /api/promoters called
🔑 Environment check: { hasUrl: true, hasServiceKey: true, ... }
📊 Executing Supabase query...
✅ Successfully fetched 100 promoters
```

❌ **Error logs:**
```
❌ Missing Supabase credentials!
NEXT_PUBLIC_SUPABASE_URL: MISSING
```

---

## 🧪 Quick Test

After setting up `.env.local`, test the API directly:

1. Open: http://localhost:3000/api/promoters
2. You should see:
```json
{
  "success": true,
  "promoters": [
    {
      "id": "...",
      "name_en": "...",
      ...
    }
  ],
  "count": 100,
  "timestamp": "2025-10-15T..."
}
```

---

## 🔍 Additional Debugging

### Check Environment Variables in Terminal

```bash
# Windows PowerShell
$env:NEXT_PUBLIC_SUPABASE_URL

# Linux/Mac
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Enable Debug Mode

Add to `.env.local`:
```bash
DEBUG=true
DEBUG_API=true
```

### Check Supabase Connection

Create a test file `test-supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('promoters')
    .select('count');
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Success:', data);
  }
}

test();
```

Run it:
```bash
node test-supabase.js
```

---

## 📝 Common Issues

### Issue 1: "Missing Supabase environment variables"
**Solution:** Create `.env.local` with correct credentials

### Issue 2: "Failed to fetch promoters"
**Possible causes:**
- Wrong Supabase URL or keys
- Database table `promoters` doesn't exist
- Row Level Security (RLS) blocking access
- Network/firewall issues

**Solution:** Check Supabase dashboard → SQL Editor:
```sql
-- Check if promoters table exists
SELECT COUNT(*) FROM promoters;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'promoters';
```

### Issue 3: Empty array despite data in database
**Possible causes:**
- RLS policies filtering out data
- Using anon key without proper policies
- Wrong database/project

**Solution:** Use service role key which bypasses RLS

### Issue 4: Works on Vercel but not locally
**Solution:** 
- Check Vercel environment variables
- Copy them to `.env.local`
- Make sure `.env.local` is in `.gitignore`

---

## 🎯 Verification Checklist

- [ ] `.env.local` file created in project root
- [ ] All 3 Supabase variables set (URL, ANON_KEY, SERVICE_ROLE_KEY)
- [ ] Development server restarted
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] Console shows success logs
- [ ] `/api/promoters` returns data with `success: true`
- [ ] Promoters page displays data

---

## 🆘 Still Not Working?

1. **Check terminal output** for detailed error messages
2. **Check browser console** (F12 → Console tab)
3. **Check Network tab** (F12 → Network tab) and inspect the `/api/promoters` request
4. **Verify Supabase dashboard** that data exists
5. **Test with Supabase SQL Editor** to ensure connectivity

---

## 📞 Need Help?

If you're still experiencing issues, provide:
1. Terminal output (sanitize any sensitive data)
2. Browser console errors
3. Network tab response for `/api/promoters`
4. Supabase project status (active/paused?)

