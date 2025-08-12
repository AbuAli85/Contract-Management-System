# Document Upload Filename Enhancement Summary

## 🎯 **Objective**

Implement descriptive file naming for document uploads using promoter name + ID format for better organization and identification.

## ✅ **Implementation Complete**

### **1. Enhanced DocumentUpload Component**

- **Added `promoterName` prop** to accept promoter name
- **Created `createCleanFilename()` helper function** for consistent naming
- **Updated file upload logic** to use the new naming convention

### **2. Updated PromoterForm Integration**

- **Modified `promoter-form-professional.tsx`** to pass promoter name to DocumentUpload
- **Uses form data or existing promoter name** as fallback

### **3. Enhanced API Route**

- **Updated `/api/upload/route.ts`** to accept promoter name parameter
- **Implemented same filename generation logic** for API uploads
- **Added proper logging** for filename generation

### **4. New Filename Format**

```
PromoterName_ID_DocumentType_timestamp.extension
```

**Examples:**

- `Ahmed_Ali_Hassan_12345_ID_Card_1754139427746.pdf`
- `Sarah_Johnson_Smith_67890_Passport_1754139427747.jpg`
- `John_O_Connor_Co_111_ID_Card_1754139427748.png`

### **5. Features Implemented**

- ✅ **Special Character Handling**: Converts spaces, hyphens, and special chars to underscores
- ✅ **Document Type Labels**: `ID_Card` for ID cards, `Passport` for passports
- ✅ **Unique Timestamps**: Prevents filename conflicts
- ✅ **Extension Preservation**: Maintains original file extension
- ✅ **Fallback Support**: Uses 'Unknown' if promoter name not available
- ✅ **Arabic/Unicode Support**: Safely handles non-Latin characters

## 🔧 **Technical Details**

### **Filename Generation Logic**

```typescript
const createCleanFilename = (file: File): string => {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const timestamp = Date.now();

  // Clean promoter name - remove special characters and spaces
  const cleanPromoterName = promoterName
    ? promoterName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    : 'Unknown';

  // Create descriptive filename: PromoterName_ID_DocumentType_timestamp.ext
  const docTypeLabel = documentType === 'id_card' ? 'ID_Card' : 'Passport';
  const uploadId = promoterId === 'new' ? `temp_${timestamp}` : promoterId;

  return `${cleanPromoterName}_${uploadId}_${docTypeLabel}_${timestamp}.${fileExt}`;
};
```

### **Integration Points**

1. **DocumentUpload Component**: Primary filename generation
2. **API Route**: Backup filename generation for service role uploads
3. **PromoterForm**: Passes promoter name from form data

## 🎉 **Benefits**

- **Better Organization**: Files are easily identifiable by promoter name
- **Professional Naming**: Clear, consistent naming convention
- **Unique Files**: Timestamps prevent conflicts
- **Search Friendly**: Names are readable and searchable
- **Audit Trail**: Easy to trace files back to specific promoters

## 📋 **File Structure Examples**

```
Storage Bucket: promoter-documents/
├── Ahmed_Ali_Hassan_12345_ID_Card_1754139427746.pdf
├── Ahmed_Ali_Hassan_12345_Passport_1754139427750.jpg
├── Sarah_Johnson_Smith_67890_ID_Card_1754139427755.png
├── Sarah_Johnson_Smith_67890_Passport_1754139427760.pdf
└── John_O_Connor_Co_111_ID_Card_1754139427765.jpg
```

## 🚀 **Ready to Use**

The enhancement is now complete and ready for testing. When you upload documents:

1. **Fill in promoter name** in the form
2. **Upload ID card or passport** documents
3. **Files will be saved** with descriptive names including promoter name + ID
4. **Both direct upload and API fallback** use the same naming convention

The system is now much more organized and professional! 🎯
