## Filename Format Fix Summary

### User Request
- **Format for ID Cards**: `{name_en}_{id_card_number}.jpg/png`  
- **Format for Passports**: `{name_en}_{passport_number}.jpg/png`
- **Remove**: Timestamp suffixes and UUID-based naming

### Examples of New Format
✅ **ID Card**: `Ahmed_Ali_Hassan_1234567890.jpg`  
✅ **Passport**: `Ahmed_Ali_Hassan_P987654321.png`  
✅ **Arabic Names**: `Fatima_Al_Zahra_9876543210.pdf`  
✅ **Special Characters**: `John_O_Connor_Smith_ID123456.jpg`  

### Changes Made

#### 1. DocumentUpload Component (`components/document-upload.tsx`)
- Removed timestamp suffix from filename generation
- Updated `createCleanFilename()` function to use exact format requested
- Increased name length limit from 30 to 50 characters
- Added debugging logs to track values

#### 2. API Upload Route (`app/api/upload/route.ts`)
- Updated server-side filename generation to match client-side
- Removed timestamp suffix
- Enhanced debugging logs
- Uses `upsert: true` to handle file overwrites

#### 3. Form Integration (`components/promoter-form-professional.tsx`)
- Already correctly passing:
  - `promoterName`: `formData.full_name || promoterToEdit?.name_en`
  - `idCardNumber`: `formData.id_number`
  - `passportNumber`: `formData.passport_number`

### File Conflict Handling
- **Previous**: Used timestamp suffix for uniqueness
- **Current**: Supabase Storage `upsert: true` allows overwriting same filename
- **Benefit**: Clean filenames without random numbers, same document overwrites previous version

### Testing Instructions
1. Open promoter form
2. Fill in promoter name (English)
3. Enter ID card number or passport number
4. Upload document
5. Check storage bucket - filename should be: `{CleanName}_{DocumentNumber}.{ext}`

### Debug Console Output
The system now logs:
- Values being used for filename generation
- Generated filename before upload
- Helps identify if form data is being passed correctly
