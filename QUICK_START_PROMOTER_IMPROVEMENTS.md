# Quick Start Guide - Promoter System Improvements

## 🚀 Get Started in 5 Minutes

This guide will get your promoter improvements up and running quickly.

---

## Prerequisites

- ✅ Supabase project set up
- ✅ Next.js application running
- ✅ Database access configured

---

## Step 1: Database Setup (2 minutes)

### Option A: Using Supabase CLI (Recommended)

```bash
cd supabase
supabase db push
```

### Option B: Manual SQL Execution

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/20250127_create_promoter_notifications_table.sql`
4. Click "Run"

---

## Step 2: Storage Setup (1 minute)

Execute this in Supabase SQL Editor:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('promoter-documents', 'promoter-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Add policies
CREATE POLICY "Authenticated users can manage promoter documents"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'promoter-documents')
WITH CHECK (bucket_id = 'promoter-documents');
```

---

## Step 3: Build & Test (2 minutes)

```bash
# Build to verify no errors
npm run build

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

---

## Step 4: Quick Test

1. **Navigate to Manage Promoters** (`/manage-promoters`)

2. **Test File Upload:**
   - Click "Add New Promoter"
   - Upload an ID card image
   - Submit form
   - ✅ Check file appears in Supabase Storage

3. **Test Notifications:**
   - Find promoter with expiring document
   - Click "Send Reminder"
   - ✅ Check `promoter_notifications` table

---

## Step 5: Verify Everything Works

Run these SQL queries in Supabase:

```sql
-- Check notifications table
SELECT COUNT(*) FROM promoter_notifications;

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'promoter-documents';

-- Check recent notifications
SELECT * FROM promoter_recent_notifications LIMIT 5;
```

---

## ✅ You're Done!

All features are now active:

- ✅ File uploads working
- ✅ Notifications system ready
- ✅ Real analytics enabled
- ✅ Cache optimization active
- ✅ Improved error handling

---

## 🎯 What's New?

### For Users

- Upload documents directly from forms
- Receive automatic expiry reminders
- View real-time analytics
- Faster page loads

### For Developers

- 5 new service files
- 2 updated components
- Comprehensive error handling
- Type-safe APIs
- Better cache management

---

## 📊 Quick Feature Overview

| Feature       | Location               | What It Does                |
| ------------- | ---------------------- | --------------------------- |
| File Upload   | Add/Edit Promoter Form | Upload ID cards & passports |
| Reminders     | Promoters Table        | Send expiry reminders       |
| Notifications | Database               | Track all sent messages     |
| Analytics     | Dashboard              | Real-time statistics        |
| Bulk Actions  | Improved Actions       | Update multiple records     |

---

## 🔧 Optional: Email & SMS Setup

**Skip this if you only need in-app notifications.**

### For Email (SendGrid):

```bash
# Install package
npm install @sendgrid/mail

# Add to .env.local
SENDGRID_API_KEY=your_key_here
SENDGRID_FROM_EMAIL=noreply@yourcompany.com
```

### For SMS (Twilio):

```bash
# Install package
npm install twilio

# Add to .env.local
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=your_number_here
```

Then update the placeholder functions in:
`lib/services/promoter-notification.service.ts`

---

## 🐛 Common Issues

### "Storage bucket not found"

**Solution:** Re-run Step 2

### "Permission denied for table promoter_notifications"

**Solution:** Check RLS policies are enabled

### "File upload fails"

**Solution:** Verify storage policies from Step 2

### "Build errors"

**Solution:** Run `npm install` to ensure dependencies are up to date

---

## 📚 Need More Help?

- **Full Documentation:** `PROMOTER_IMPROVEMENTS_IMPLEMENTATION_COMPLETE.md`
- **API Reference:** See "API Reference" section in full docs
- **Troubleshooting:** See "Troubleshooting" section in full docs

---

## 🎉 Success Checklist

- [ ] Database migration applied ✅
- [ ] Storage bucket created ✅
- [ ] Application builds successfully ✅
- [ ] Can upload files ✅
- [ ] Can send notifications ✅
- [ ] Analytics show real data ✅

**All checked?** You're ready for production! 🚀

---

**Time to Complete:** ~5 minutes
**Difficulty:** ⭐⭐ (Easy)
**Support:** See full documentation for advanced features

---

_Last Updated: October 27, 2025_
