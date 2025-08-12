# 🚀 **How to Access Real-Time Dashboard - Complete Guide**

## 📋 **Quick Start Instructions**

Follow these steps to access and test your real-time provider dashboard with proper login and functionality.

---

## 🔧 **Step 1: Environment Setup (5 minutes)**

### **Option A: Local Development**

1. **Clone and Setup**

   ```bash
   git clone https://github.com/your-repo/Contract-Management-System
   cd Contract-Management-System
   npm install
   ```

2. **Environment Variables**
   Create `.env.local` file:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NDQzODIsImV4cCI6MjA2OTAyMDM4Mn0.WQwDpYX2M4pyPaliUqTinwy1xWWFKm4OntN2HUfP6n0
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE
   NODE_ENV=development
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### **Option B: Use Deployed Version**

- Access your deployed Vercel URL directly
- Environment variables should already be configured

---

## 👤 **Step 2: Create Test Accounts (2 minutes)**

### **Method 1: Run SQL Script (Recommended)**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Navigate to your project → SQL Editor

2. **First: Fix Role Constraint**
   Run this SQL to fix the role constraint:

   ```sql
   -- Fix role constraint to allow 'provider' and 'client' roles
   DO $$
   BEGIN
       IF EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE table_name = 'users'
           AND constraint_name = 'users_role_check'
       ) THEN
           ALTER TABLE users DROP CONSTRAINT users_role_check;
       END IF;
   END $$;

   ALTER TABLE users ADD CONSTRAINT users_role_check
   CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));
   ```

3. **Then: Create Test Accounts**
   Run the complete script: `scripts/fix-user-roles-and-create-accounts.sql`

   Or run this simplified version:

   ```sql
   -- Create Provider Account
   INSERT INTO auth.users (
     id, email, encrypted_password, email_confirmed_at,
     created_at, updated_at
   ) VALUES (
     '11111111-1111-1111-1111-111111111111',
     'provider@test.com',
     '$2a$10$7A9QmUTZS.LvDlx8LLg8gOaIbCFGSGMQDGcf4r3mQOzYwTQXr6.3G',
     now(), now(), now()
   ) ON CONFLICT (id) DO NOTHING;

   INSERT INTO public.users (
     id, email, full_name, role, status, created_at, updated_at
   ) VALUES (
     '11111111-1111-1111-1111-111111111111',
     'provider@test.com', 'John Provider', 'provider', 'active',
     now(), now()
   ) ON CONFLICT (id) DO UPDATE SET role = 'provider', status = 'active';
   ```

### **Method 2: Use Registration Form**

1. Go to: `/en/register/provider`
2. Fill form with provider details
3. Verify email and complete setup

---

## 🔐 **Step 3: Login and Access Dashboard**

### **Login Credentials**

```
Email: provider@test.com
Password: TestPass123!
```

### **Access Steps**

1. **Go to Login Page**

   ```
   Local: http://localhost:3000/en/auth/login
   Deployed: https://your-domain.com/en/auth/login
   ```

2. **Enter Credentials**
   - Email: `provider@test.com`
   - Password: `TestPass123!`

3. **Dashboard Access**
   After login, you'll be redirected to:
   ```
   /en/dashboard/provider-comprehensive
   ```

---

## 🧪 **Step 4: Test Real-Time Functionality**

### **Use Test Dashboard**

First, verify everything works:

```
http://localhost:3000/en/test-dashboard
```

This page will:

- ✅ Test Supabase connection
- ✅ Verify authentication status
- ✅ Check API endpoints
- ✅ Test real-time subscriptions
- ✅ Provide quick login

### **Real-Time Features to Test**

1. **Service Management**
   - Create new service → Should appear immediately
   - Update service status → Should reflect instantly
   - Service count → Should update in tab title

2. **Statistics Dashboard**
   - View live statistics cards
   - Check real earnings calculations
   - Monitor active vs completed orders

3. **Real-Time Sync Test**
   - Open dashboard in two browser windows
   - Make changes in one window
   - Verify changes appear in other window

---

## 📊 **Step 5: Dashboard Features Overview**

### **Provider Dashboard Tabs**

**Overview Tab:**

- ✅ 8 live statistics cards
- ✅ Recent orders with progress
- ✅ Quick action buttons
- ✅ Performance metrics

**Orders Tab (`My Orders (X)`):**

- ✅ Live order count in tab
- ✅ Real orders from database
- ✅ Accept/Deliver/Complete actions
- ✅ Client information display

**Services Tab (`My Services (X)`):**

- ✅ Live service count
- ✅ Service management (Create/Edit/Pause)
- ✅ Performance metrics per service
- ✅ Digital marketing categories

**Earnings Tab:**

- ✅ Available balance for withdrawal
- ✅ Pending payments
- ✅ Monthly earnings comparison
- ✅ Total lifetime earnings

**Analytics Tab:**

- ✅ Performance visualizations
- ✅ Completion and response rates
- ✅ Business growth metrics

---

## 🎯 **Step 6: Create Sample Data (Optional)**

If you want more test data, run this SQL:

```sql
-- Create sample booking/order
INSERT INTO public.bookings (
  id, client_id, provider_id, service_id, title,
  status, total_amount, start_date, end_date, created_at
) VALUES (
  '77777777-7777-7777-7777-777777777777',
  '22222222-2222-2222-2222-222222222222', -- You'll need a client
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'E-commerce SEO Optimization',
  'active', 1500, now(), now() + interval '30 days', now()
) ON CONFLICT (id) DO NOTHING;
```

---

## 🚨 **Troubleshooting Common Issues**

### **Issue: "Access Denied" on Dashboard**

**Solution:**

```sql
UPDATE public.users
SET role = 'provider', status = 'active'
WHERE email = 'provider@test.com';
```

### **Issue: "Authentication Required"**

**Solutions:**

1. Clear browser cookies and localStorage
2. Log in again with correct credentials
3. Check if user exists in database
4. Verify environment variables

### **Issue: Dashboard Shows No Data**

**Solutions:**

1. Run the sample data SQL scripts
2. Check if services table has data
3. Verify provider_id matches in all tables
4. Check browser console for API errors

### **Issue: Real-Time Updates Not Working**

**Solutions:**

1. Check browser console for WebSocket errors
2. Verify Supabase connection
3. Test network connectivity
4. Refresh page to reinitialize subscriptions

---

## 🔧 **Development Commands**

### **Local Development**

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run with specific port
npm run dev -- -p 3001
```

### **Database Operations**

```bash
# Reset database (if using Supabase CLI)
npx supabase db reset

# Run migrations
npx supabase db push
```

---

## 📱 **Mobile & Browser Testing**

### **Recommended Testing**

- ✅ **Chrome/Edge** - Full support
- ✅ **Firefox** - Full support
- ✅ **Safari** - Full support
- ✅ **Mobile Chrome** - Responsive design
- ✅ **Mobile Safari** - Responsive design

### **Real-Time on Different Devices**

- ✅ **Desktop** - Full real-time features
- ✅ **Tablet** - Touch-optimized interface
- ✅ **Mobile** - Responsive dashboard

---

## 🌐 **Production Deployment**

### **Vercel Deployment**

1. **Push to GitHub** - Auto-deploys
2. **Set Environment Variables** in Vercel dashboard
3. **Access Production URL**:
   ```
   https://your-project.vercel.app/en/dashboard/provider-comprehensive
   ```

### **Domain Configuration**

- Set custom domain in Vercel
- Update CORS settings if needed
- Test all functionality on production

---

## 📞 **Quick Support Checklist**

Before asking for help, check:

- [ ] Environment variables are set correctly
- [ ] Provider account exists with `role = 'provider'`
- [ ] Successfully logged in
- [ ] Test dashboard shows all green checkmarks
- [ ] Browser console shows no errors
- [ ] Supabase connection is working

---

## 🎉 **Success Indicators**

You know everything is working when:

- ✅ **Login successful** with provider credentials
- ✅ **Dashboard loads** with real statistics
- ✅ **Tab titles show counts** like "My Orders (3)"
- ✅ **Real-time updates** work between browser windows
- ✅ **API endpoints** respond correctly
- ✅ **Service management** functions work
- ✅ **Mobile responsive** design displays properly

---

## 🚀 **Ready-to-Use URLs**

### **Local Development**

- **Login**: http://localhost:3000/en/auth/login
- **Provider Dashboard**: http://localhost:3000/en/dashboard/provider-comprehensive
- **Test Page**: http://localhost:3000/en/test-dashboard
- **Marketplace**: http://localhost:3000/marketplace/services

### **Production**

- **Login**: https://your-domain.com/en/auth/login
- **Provider Dashboard**: https://your-domain.com/en/dashboard/provider-comprehensive
- **Test Page**: https://your-domain.com/en/test-dashboard

---

## 🎯 **Next Steps After Setup**

1. **Test all dashboard features**
2. **Create additional services**
3. **Test real-time synchronization**
4. **Verify mobile responsiveness**
5. **Explore marketplace integration**
6. **Set up additional provider accounts**
7. **Test client dashboard functionality**

**Your real-time provider dashboard is now fully operational! 🚀**

**Login with `provider@test.com` / `TestPass123!` and start exploring your professional service management platform!**
