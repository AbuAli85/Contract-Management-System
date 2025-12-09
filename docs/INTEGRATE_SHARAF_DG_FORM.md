# 🔌 How to Integrate Sharaf DG Form into Your App

**Time Required:** 30 minutes  
**Difficulty:** Easy

---

## ✅ Files Already Created

- ✅ `components/SharafDGDeploymentForm.tsx` - Main form component
- ✅ `app/[locale]/contracts/sharaf-dg/page.tsx` - Page route
- ✅ `app/api/contracts/[id]/generate-pdf/route.ts` - PDF generation API
- ✅ `app/api/webhook/contract-pdf-ready/route.ts` - Webhook handler
- ✅ `supabase/migrations/20251026_add_contract_pdf_fields.sql` - Database migration

---

## 🚀 Integration Steps

### Step 1: Apply Database Migration (2 min)

```bash
cd /path/to/your/project
supabase db push
```

Or via Supabase Dashboard:

1. SQL Editor → New Query
2. Copy `supabase/migrations/20251026_add_contract_pdf_fields.sql`
3. Run

### Step 2: Set Environment Variables (2 min)

Add to `.env.local`:

```bash
# Make.com webhook URL (get from Make.com scenario)
MAKE_CONTRACT_PDF_WEBHOOK_URL=https://hook.eu2.make.com/your-webhook-id

# Generate a secure random secret
PDF_WEBHOOK_SECRET=your-super-secret-random-string-here

# Your app URL
CONTRACTS_API_URL=https://your-domain.com

# Your Supabase storage bucket
NEXT_PUBLIC_CONTRACTS_STORAGE_BUCKET=contracts
```

**How to generate secret:**

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: Online
# Visit: https://generate.plus/en/base64
```

### Step 3: Add to Navigation (5 min)

#### Option A: Update Sidebar

Find your sidebar component (likely `components/sidebar.tsx` or `components/navigation/*.tsx`):

```typescript
// Add this import
import { Building } from 'lucide-react';

// Add to menu items array
const menuItems = [
  // ... existing items
  {
    title: 'Contracts',
    children: [
      {
        title: 'All Contracts',
        href: '/contracts',
        icon: FileText,
      },
      {
        title: 'eXtra Contracts',
        href: '/generate-contract',
        icon: Zap,
      },
      {
        title: 'General Contracts',
        href: '/contracts/general',
        icon: FileText,
      },
      {
        title: 'Sharaf DG Deployment', // NEW
        href: '/contracts/sharaf-dg', // NEW
        icon: Building, // NEW
        badge: 'PDF', // NEW
      },
    ],
  },
  // ... other items
];
```

#### Option B: Add Dashboard Card

In your dashboard page (`app/[locale]/dashboard/page.tsx`):

```typescript
import Link from 'next/link';
import { Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Add this card
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <Building className="h-5 w-5" />
        Sharaf DG Deployment
      </span>
      <Badge variant="secondary">NEW</Badge>
    </CardTitle>
    <CardDescription>
      Generate official deployment letters with automated PDF creation
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button asChild className="w-full">
      <Link href="/contracts/sharaf-dg">
        <Building className="mr-2 h-4 w-4" />
        Create Deployment Letter
      </Link>
    </Button>
  </CardContent>
</Card>
```

### Step 4: Update Breadcrumbs (3 min)

In `components/breadcrumbs.tsx` (if you have one):

```typescript
const routeLabels: Record<string, string> = {
  // ... existing routes
  '/contracts/sharaf-dg': 'Sharaf DG Deployment',
};
```

### Step 5: Add Permission Check (Optional, 5 min)

If you want to restrict access:

```typescript
// app/[locale]/contracts/sharaf-dg/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function SharafDGPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has permission
  const { data: hasPermission } = await supabase
    .rpc('user_has_permission', {
      p_user_id: user.id,
      p_permission_name: 'contracts:create:all'
    });

  if (!hasPermission) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <SharafDGDeploymentForm />
    </div>
  );
}
```

### Step 6: Configure Make.com (10 min)

1. **Import Scenario:**
   - Go to Make.com
   - Create new scenario
   - Import the JSON you provided

2. **Update Template ID:**
   - Module 4 (Get Document)
   - Module 5 (Create from Template)
   - Update document ID with your template ID

3. **Get Webhook URL:**
   - Click Module 1 (Webhook)
   - Copy the webhook URL
   - Add to `.env.local` as `MAKE_CONTRACT_PDF_WEBHOOK_URL`

4. **Test Webhook:**
   - Click "Run once"
   - Send test data
   - Verify all modules execute

### Step 7: Test End-to-End (10 min)

1. **Navigate to form:**

   ```
   http://localhost:3000/contracts/sharaf-dg
   ```

2. **Fill form with test data:**
   - Select a promoter (with images!)
   - Select Falcon Eye Group as employer
   - Select Sharaf DG as client
   - Enter contract number: TEST-2025-001
   - Fill dates and details

3. **Create contract:**
   - Click "Create Contract"
   - Verify success message
   - Check database record created

4. **Generate PDF:**
   - Click "Generate Deployment Letter PDF"
   - Watch status change to "Generating..."
   - Wait ~30 seconds
   - Verify "PDF Ready!" notification
   - Click "Download PDF"
   - Verify PDF content is correct

---

## 🎨 Customization Options

### Change Theme Color

```typescript
// In SharafDGDeploymentForm.tsx

// Current (purple)
<Card className="border-purple-200 bg-purple-50/50">

// Alternative themes:
<Card className="border-blue-200 bg-blue-50/50">     // Professional blue
<Card className="border-green-200 bg-green-50/50">   // Success green
<Card className="border-amber-200 bg-amber-50/50">   // Premium gold
```

### Add Company Logo

```typescript
// In CardHeader
<CardTitle className="flex items-center gap-2">
  <img src="/sharaf-dg-logo.png" alt="Sharaf DG" className="h-6 w-6" />
  Sharaf DG Deployment Letter Generator
</CardTitle>
```

### Custom Validation Messages

```typescript
// In validateForm function
if (!formData.promoter_id) {
  toast({
    title: 'Promoter Required',
    description: 'Please select a promoter from the list',
    variant: 'destructive',
  });
  return false;
}
```

---

## 🔍 Verification Checklist

After integration, verify:

- [ ] Form accessible at `/contracts/sharaf-dg`
- [ ] Appears in navigation menu
- [ ] Dashboard card shows (if added)
- [ ] Promoters load correctly
- [ ] Parties load correctly
- [ ] Validation works
- [ ] Contract creates in database
- [ ] PDF generation triggers
- [ ] Webhook receives callback
- [ ] PDF downloads successfully
- [ ] Google Drive link works
- [ ] Error handling works
- [ ] Responsive on mobile
- [ ] Loading states show
- [ ] Success messages display

---

## 📊 Comparison with Existing Forms

### What's Different in Sharaf DG Form

| Feature         | eXtra | General   | Sharaf DG            |
| --------------- | ----- | --------- | -------------------- |
| Fields          | 15    | 30        | 12                   |
| Validation      | Basic | Extensive | Medium + Image check |
| PDF             | None  | External  | ✅ Integrated        |
| Images          | No    | No        | ✅ Required          |
| Status Tracking | No    | No        | ✅ Real-time         |
| Client          | eXtra | Any       | Sharaf DG only       |

### What's Similar

- Same UI components (`shadcn/ui`)
- Same layout structure (Cards, Steps)
- Same Supabase integration
- Same error handling patterns
- Same toast notifications

---

## 🐛 Troubleshooting

### Form doesn't show in navigation

**Check:**

1. Navigation component file location
2. Import statement added
3. Route path correct
4. Permissions (if using RBAC)

### PDF generation fails

**Check:**

1. Environment variables set correctly
2. Make.com webhook URL is correct
3. Template ID is correct in Make.com
4. Promoter has required images
5. Webhook secret matches

### Images don't embed in PDF

**Check:**

1. Image URLs are publicly accessible
2. Images are not too large (< 5MB)
3. Alt text in template is exactly: `ID_CARD_IMAGE` and `PASSPORT_IMAGE`
4. Make.com has permission to access URLs

---

## 📝 Quick Reference Commands

```bash
# Run development server
npm run dev

# Check environment variables
cat .env.local | grep -i "make\|pdf\|webhook"

# Apply database migration
supabase db push

# Check migration status
supabase migration list

# View logs
supabase functions logs

# Test API endpoint
curl -X POST http://localhost:3000/api/contracts/YOUR-CONTRACT-ID/generate-pdf
```

---

## 🎯 Success Criteria

✅ Form loads without errors  
✅ All dropdowns populate with data  
✅ Validation prevents incomplete submissions  
✅ Contract creates in database  
✅ PDF generation triggers successfully  
✅ Status updates in real-time  
✅ Download and Drive links work  
✅ Mobile responsive  
✅ Accessible to correct users

---

**Implementation Status:** Ready to integrate  
**Estimated Time:** 30 minutes  
**Dependencies:** Database migration, Environment variables, Make.com scenario

**Start with Step 1 and proceed sequentially!** 🚀
