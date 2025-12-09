# Import Promoters to Production

## Issue

The production database has 0 promoters, but the data exists (you shared 50+ promoters earlier).

## Steps to Import Data

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Open SQL Editor:**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the INSERT Statement:**
   - Use the INSERT statement you provided earlier with all promoters
   - Or export from your local database and import

4. **Verify:**
   ```sql
   SELECT COUNT(*) FROM promoters;
   SELECT * FROM promoters LIMIT 5;
   ```

### Option 2: Via CSV Import

1. **Export Promoters to CSV:**
   - From your local database or source
2. **Import via Supabase:**
   - Go to **Table Editor** → **promoters**
   - Click **Insert** → **Import from CSV**
   - Upload your CSV file

### Option 3: Via Script

If you have the data in a SQL file, run:

```bash
# Using psql (if you have direct database access)
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" -f your_promoters_data.sql
```

## After Import

1. **Verify Data:**

   ```sql
   SELECT COUNT(*) FROM promoters;
   ```

2. **Refresh the Promoters Page:**
   - Visit: https://portal.thesmartpro.io/en/promoters
   - Data should now appear!

## Important Notes

- Make sure to use the **production** Supabase project
- Check that you're connected to the correct database
- Verify RLS policies allow data access with SERVICE_ROLE key
