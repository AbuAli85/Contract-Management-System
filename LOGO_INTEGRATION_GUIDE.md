# Logo Integration Guide: Supabase + Make.com

This guide shows you how to add party logos to Supabase and connect them with Make.com for contract generation.

## 🗄️ **Step 1: Supabase Database Setup**

### 1.1 Add logo_url field to parties table

Run this migration in your Supabase SQL editor:

```sql
-- Add logo_url field to parties table
ALTER TABLE parties ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN parties.logo_url IS 'URL to the party logo image';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_parties_logo_url ON parties(logo_url) WHERE logo_url IS NOT NULL;
```

### 1.2 Verify the field was added

Check your parties table structure:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'parties'
ORDER BY ordinal_position;
```

You should see `logo_url` as a TEXT field.

## 📤 **Step 2: Upload Logos to Supabase Storage**

### 2.1 Create a storage bucket for party logos

In your Supabase dashboard:

1. Go to **Storage** → **Buckets**
2. Create a new bucket called `party-logos`
3. Set it to **Public** (so Make.com can access the images)
4. Configure RLS policies:

```sql
-- Allow public read access to party logos
CREATE POLICY "Public read access for party logos" ON storage.objects
FOR SELECT USING (bucket_id = 'party-logos');

-- Allow authenticated users to upload party logos
CREATE POLICY "Authenticated users can upload party logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'party-logos'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update party logos
CREATE POLICY "Authenticated users can update party logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'party-logos'
  AND auth.role() = 'authenticated'
);
```

### 2.2 Upload logo files

You can upload logos in two ways:

#### Option A: Via Supabase Dashboard

1. Go to **Storage** → **party-logos** bucket
2. Click **Upload file**
3. Upload your logo files
4. Copy the public URL

#### Option B: Via API (programmatically)

```javascript
// Example: Upload logo via API
const uploadLogo = async (file, partyId) => {
  const fileName = `party-${partyId}-logo-${Date.now()}.${file.name.split('.').pop()}`;

  const { data, error } = await supabase.storage
    .from('party-logos')
    .upload(fileName, file);

  if (error) throw error;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('party-logos').getPublicUrl(fileName);

  return publicUrl;
};
```

## 🔗 **Step 3: Update Party Records with Logo URLs**

### 3.1 Update existing parties with logo URLs

```sql
-- Example: Update a party with logo URL
UPDATE parties
SET logo_url = 'https://your-project.supabase.co/storage/v1/object/public/party-logos/party-123-logo.png'
WHERE id = 'your-party-id';
```

### 3.2 Bulk update multiple parties

```sql
-- Example: Update multiple parties
UPDATE parties
SET logo_url = CASE
  WHEN name_en = 'Company A' THEN 'https://your-project.supabase.co/storage/v1/object/public/party-logos/company-a-logo.png'
  WHEN name_en = 'Company B' THEN 'https://your-project.supabase.co/storage/v1/object/public/party-logos/company-b-logo.png'
  -- Add more cases as needed
END
WHERE name_en IN ('Company A', 'Company B');
```

## 🤖 **Step 4: Make.com Configuration**

### 4.1 Webhook Data Structure

Your Make.com webhook will now receive logo URLs in this format:

```json
{
  "contract_id": "123e4567-e89b-12d3-a456-426614174000",
  "contract_number": "PAC-18012025-1234",
  "first_party_name_en": "ABC Company",
  "first_party_logo": "https://your-project.supabase.co/storage/v1/object/public/party-logos/abc-logo.png",
  "first_party_logo_url": "https://your-project.supabase.co/storage/v1/object/public/party-logos/abc-logo.png",
  "header_logo": "https://your-project.supabase.co/storage/v1/object/public/party-logos/abc-logo.png",
  "second_party_name_en": "XYZ Corporation",
  "second_party_logo": "https://your-project.supabase.co/storage/v1/object/public/party-logos/xyz-logo.png",
  "second_party_logo_url": "https://your-project.supabase.co/storage/v1/object/public/party-logos/xyz-logo.png"
}
```

### 4.2 Make.com Google Docs Module Configuration

In your Make.com scenario, configure the Google Docs module:

**Image 1 (Header Logo):**

- Variable name: `image_1`
- Image URL: `{{if(1.first_party_logo; 1.first_party_logo; "https://via.placeholder.com/400x100.png?text=Header+Logo")}}`

**Image 2 (Company Logo):**

- Variable name: `image_2`
- Image URL: `{{if(1.first_party_logo; 1.first_party_logo; "https://via.placeholder.com/200x200.png?text=Company+Logo")}}`

**Image 3 (Second Party Logo):**

- Variable name: `image_3`
- Image URL: `{{if(1.second_party_logo; 1.second_party_logo; "https://via.placeholder.com/200x200.png?text=Second+Party")}}`

### 4.3 Alternative Field Names

Make.com also supports these field names for backward compatibility:

- `{{header_logo}}` - Uses first party logo
- `{{company_logo}}` - Uses first party logo
- `{{first_party_logo_url}}` - Direct logo URL
- `{{second_party_logo_url}}` - Second party logo URL

## 🧪 **Step 5: Testing the Integration**

### 5.1 Test logo upload

1. Go to your contract management system
2. Edit a party record
3. Upload a logo
4. Verify the logo_url is saved in the database

### 5.2 Test contract generation

1. Create a new contract with the party that has a logo
2. Trigger contract generation
3. Check the webhook payload in Make.com
4. Verify the logo appears in the generated document

### 5.3 Debug logo issues

If logos don't appear:

1. **Check the webhook payload:**

   ```javascript
   console.log('Logo URLs in webhook:', {
     first_party_logo: webhookData.first_party_logo,
     header_logo: webhookData.header_logo,
   });
   ```

2. **Verify Supabase storage permissions:**
   - Ensure the bucket is public
   - Check RLS policies
   - Test direct URL access

3. **Check Make.com logs:**
   - Look for image loading errors
   - Verify image URLs are valid
   - Check Google Docs API responses

## 🔧 **Step 6: UI Implementation (Optional)**

If you want to add a logo upload UI to your application:

### 6.1 Create a logo upload component

```tsx
// components/PartyLogoUpload.tsx
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PartyLogoUpload({ partyId, currentLogo, onLogoUpdate }) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleLogoUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Supabase storage
      const fileName = `party-${partyId}-logo-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('party-logos')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('party-logos').getPublicUrl(fileName);

      // Update party record
      const { error: updateError } = await supabase
        .from('parties')
        .update({ logo_url: publicUrl })
        .eq('id', partyId);

      if (updateError) throw updateError;

      onLogoUpdate(publicUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='logo-upload'>
      {currentLogo && (
        <img
          src={currentLogo}
          alt='Party logo'
          className='w-24 h-24 object-cover rounded-lg'
        />
      )}
      <input
        type='file'
        accept='image/*'
        onChange={handleLogoUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

### 6.2 Add to party edit form

```tsx
// In your party edit form
<PartyLogoUpload
  partyId={party.id}
  currentLogo={party.logo_url}
  onLogoUpdate={newLogoUrl => {
    setParty(prev => ({ ...prev, logo_url: newLogoUrl }));
  }}
/>
```

## 📋 **Step 7: Environment Variables**

Make sure these environment variables are set:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Make.com
MAKECOM_WEBHOOK_URL=your-makecom-webhook-url
```

## ✅ **Verification Checklist**

- [ ] `logo_url` field added to parties table
- [ ] `party-logos` storage bucket created and configured
- [ ] RLS policies set for public read access
- [ ] Logo files uploaded to storage
- [ ] Party records updated with logo URLs
- [ ] Make.com webhook receiving logo URLs
- [ ] Google Docs template configured to use logo images
- [ ] Test contract generation shows logos correctly

## 🚨 **Troubleshooting**

### Common Issues

1. **Logo not appearing in contracts:**
   - Check if logo_url is populated in database
   - Verify storage bucket is public
   - Test direct URL access

2. **Make.com webhook errors:**
   - Check webhook URL configuration
   - Verify authentication headers
   - Review webhook payload structure

3. **Google Docs API errors:**
   - Ensure image URLs are accessible
   - Check image format compatibility
   - Verify Google Docs template structure

4. **Storage permission errors:**
   - Review RLS policies
   - Check bucket configuration
   - Verify user authentication

## 📞 **Support**

If you encounter issues:

1. Check the browser console for errors
2. Review Supabase logs
3. Check Make.com scenario execution logs
4. Verify all environment variables are set correctly
