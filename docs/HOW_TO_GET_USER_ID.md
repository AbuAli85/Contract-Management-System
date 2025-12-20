# How to Get Your User ID for SQL Scripts

If you're getting the error "You must be logged in. Please authenticate first", you need to get your user ID and use the manual script.

---

## **Method 1: Get User ID by Email (Easiest)**

Run this query in Supabase SQL Editor:

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

Replace `'your-email@example.com'` with your actual email address.

**Example:**
```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@contractmanagement.com';
```

**Result:**
```
id                                   | email                        | created_at
-------------------------------------|------------------------------|------------
f07dfa7c-2042-44da-b47c-ffbb2482c532 | admin@contractmanagement.com | 2025-01-15
```

Copy the `id` value.

---

## **Method 2: Get User ID from Profiles Table**

If you know your profile details:

```sql
SELECT id, email, full_name
FROM profiles
WHERE email = 'your-email@example.com';
```

The `id` from `profiles` is the same as `auth.users.id`.

---

## **Method 3: List All Users (If You're Admin)**

```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;
```

Find your email in the list and copy the `id`.

---

## **Using the User ID**

Once you have your user ID:

1. **Open:** `scripts/setup-attendance-muhammad-junaid-manual.sql`
2. **Find this line:**
   ```sql
   v_user_id UUID := 'YOUR-USER-ID-HERE'; -- UPDATE THIS!
   ```
3. **Replace** `'YOUR-USER-ID-HERE'` with your actual user ID:
   ```sql
   v_user_id UUID := 'f07dfa7c-2042-44da-b47c-ffbb2482c532'; -- Your actual ID
   ```
4. **Run the script**

---

## **Alternative: Authenticate in Supabase**

If you want to use the original script with `auth.uid()`:

1. **Go to Supabase Dashboard**
2. **Click on "SQL Editor"**
3. **Make sure you're logged in** (check top right corner)
4. **Run the original script:** `scripts/setup-attendance-muhammad-junaid.sql`

The `auth.uid()` function will automatically use your logged-in user ID.

---

## **Quick Check: Verify Your User ID**

After getting your user ID, verify it's correct:

```sql
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  c.name as company_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.owner_id = u.id
WHERE u.email = 'your-email@example.com';
```

This shows:
- Your user ID
- Your email
- Your profile name
- Your company name

---

**That's it!** Use the manual script with your user ID, or authenticate in Supabase to use the original script.



