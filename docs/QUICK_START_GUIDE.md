# ⚡ Quick Start Guide - Get Running in 5 Minutes

**Date:** February 2025  
**Purpose:** Fast setup guide for immediate use

---

## 🚀 **5-MINUTE SETUP**

### **Step 1: Run Migrations (2 minutes)**

```bash
supabase db push
```

This applies all database migrations automatically.

---

### **Step 2: Configure Environment (1 minute)**

Copy `.env.example` to `.env.local` and add your credentials:

```env
# Required: Email
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=noreply@portal.thesmartpro.io

# Optional: SMS (skip if not using SMS)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

### **Step 3: Start Application (1 minute)**

```bash
npm install
npm run dev
```

Visit: `http://localhost:3000`

---

### **Step 4: Add First Employee (1 minute)**

1. Login as employer/admin
2. Go to **Team Management**
3. Click **"Add Team Member"**
4. Search by email or create new user
5. Fill employment details
6. Save

---

## ✅ **YOU'RE READY!**

### **Immediate Actions:**

1. **Test Attendance:**
   - Employee checks in
   - Employee checks out
   - View attendance record

2. **Upload Document:**
   - Go to employee profile
   - Upload ID or passport
   - Set expiry date
   - System will alert before expiry

3. **Create Task:**
   - Go to employee → Tasks tab
   - Create task
   - Assign to employee
   - Track progress

4. **View Analytics:**
   - Go to `/en/analytics/hr`
   - See comprehensive metrics
   - Explore charts and trends

---

## 🎯 **KEY FEATURES TO TRY**

### **1. Document Expiry Automation**
```bash
# Trigger manually (or set up cron)
POST /api/automation/documents/check-expiry
```

### **2. HR Analytics**
Visit: `/en/analytics/hr`

### **3. Work Permits**
Visit: `/en/work-permits`

### **4. Team Management**
Visit: `/en/employer/team`

---

## 📋 **NEXT STEPS**

1. ✅ Add more employees
2. ✅ Upload documents
3. ✅ Set up tasks and targets
4. ✅ Configure leave policies
5. ✅ Set up work permit applications
6. ✅ Explore analytics
7. ✅ Set up automation workflows

---

## 🆘 **NEED HELP?**

- Full Guide: `docs/USER_GUIDE_COMPLETE_SYSTEM.md`
- Setup Details: `docs/FINAL_SETUP_GUIDE.md`
- System Overview: `docs/COMPLETE_IMPLEMENTATION_SUMMARY.md`

---

**That's it! Start managing your HR operations! 🎉**

