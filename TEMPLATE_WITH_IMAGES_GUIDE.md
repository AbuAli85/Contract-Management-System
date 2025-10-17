# 🖼️ Template with Images Guide

## 🎯 **Your Template + Image Support**

Your bilingual contract template is perfect! Now let's add image support for ID cards and passports.

## 📝 **Updated Template Structure**

Here's how your template should look with image placeholders:

```
Ref: {{ref_number}}

عقد عمل بائع

Promoter Assignment Contract

تم إبرام هذا العقد بين: الطرف الأول  {{first_party_name_ar}} (الشركة) رقم السجل التجاري: {{first_party_crn}}
والطرف الثاني شركة: {{second_party_name_ar}} رقم السجل التجاري: {{second_party_crn}}

يوفر الطرف الثاني موظف (بائع) لبيع منتجاتها في معرض شركة اكسترا:

الفاضل: {{promoter_name_ar}} (الموظف)
بطاقة رقم: {{id_card_number}}
تاريخ الالتحاق: {{contract_start_date}} وحتى {{contract_end_date}}

📷 ID Card Image:
{{promoter_id_card_image}}

📷 Passport Image:
{{promoter_passport_image}}

يتحمل المسؤولية الطرف الثاني الأمور المالية والإدارية عن الموظف.  

ولكم التحية والتقدير،

---

This contract is between: {{first_party_name_en}} (Party 1) having a commercial registration No: {{first_party_crn}} and: {{second_party_name_en}} (Party2)
having a commercial registration No: {{second_party_crn}}.

Party 2 agrees to provide party 1 with a promoter with the following details to sell their products at eXtra:

Name: {{promoter_name_en}}
ID #: {{id_card_number}}
From: {{contract_start_date}} To: {{contract_end_date}}

📷 ID Card Image:
{{promoter_id_card_image}}

📷 Passport Image:
{{promoter_passport_image}}

Party 2 will bear the entire financial and administrative responsibilities toward this promoter.

Best Regards

For United Electronics Company - eXtra                                              Signed and agreed for Party 2
```

## 🖼️ **Image Placeholders**

The system supports these image placeholders:

- `{{promoter_id_card_image}}` - ID card image
- `{{promoter_passport_image}}` - Passport image

## 🔧 **How Image Replacement Works**

1. **Text Replacement**: All text placeholders are replaced first
2. **Image Replacement**: Image placeholders are replaced with actual images
3. **Image Sizing**: Images are automatically sized to 300x200 points
4. **Image Storage**: Images are uploaded to your personal Google Drive

## 📋 **Complete Placeholder List**

### **Contract Information**
- `{{ref_number}}` - Reference number
- `{{contract_number}}` - Contract number (alternative)
- `{{contract_date}}` - Contract date
- `{{contract_type}}` - Contract type

### **Client Information (First Party)**
- `{{first_party_name_en}}` - Client name (English)
- `{{first_party_name_ar}}` - Client name (Arabic)
- `{{first_party_crn}}` - Client CRN
- `{{first_party_email}}` - Client email
- `{{first_party_phone}}` - Client phone

### **Employer Information (Second Party)**
- `{{second_party_name_en}}` - Employer name (English)
- `{{second_party_name_ar}}` - Employer name (Arabic)
- `{{second_party_crn}}` - Employer CRN
- `{{second_party_email}}` - Employer email
- `{{second_party_phone}}` - Employer phone

### **Promoter Information**
- `{{promoter_name_en}}` - Promoter name (English)
- `{{promoter_name_ar}}` - Promoter name (Arabic)
- `{{promoter_email}}` - Promoter email
- `{{promoter_mobile_number}}` - Mobile number
- `{{promoter_id_card_number}}` - ID card number
- `{{id_card_number}}` - ID card number (alternative)
- `{{promoter_passport_number}}` - Passport number

### **Contract Details**
- `{{job_title}}` - Job title
- `{{department}}` - Department
- `{{work_location}}` - Work location
- `{{basic_salary}}` - Basic salary
- `{{currency}}` - Currency (OMR)
- `{{contract_start_date}}` - Start date
- `{{contract_end_date}}` - End date
- `{{special_terms}}` - Special terms

### **Images**
- `{{promoter_id_card_image}}` - ID card image
- `{{promoter_passport_image}}` - Passport image

## 🚀 **Next Steps**

1. **Update your template** with the image placeholders above
2. **Share the template** with the service account (if not done already)
3. **Test the integration**

## 🧪 **Test After Template Update**

```bash
curl -X GET https://portal.thesmartpro.io/api/test/google-docs-simple
```

## 🎉 **Expected Result**

After sharing and testing, you should see:

```json
{
  "success": true,
  "message": "Google Docs integration test successful",
  "result": {
    "documentId": "new-document-id",
    "documentUrl": "https://docs.google.com/document/d/.../edit",
    "pdfUrl": "https://drive.google.com/file/d/.../view"
  }
}
```

## 📱 **Using the Contract Generator**

When you use the Simple Contract Generator:

1. **Select promoter** (with ID card and passport images)
2. **Select client and employer**
3. **Fill contract details**
4. **Generate contract**

The system will automatically:
- ✅ Replace all text placeholders
- ✅ Insert ID card image
- ✅ Insert passport image
- ✅ Generate PDF
- ✅ Save to your personal drive

## 🎯 **Benefits**

- ✅ **Bilingual contracts** (Arabic + English)
- ✅ **Professional formatting**
- ✅ **Automatic image insertion**
- ✅ **PDF generation**
- ✅ **200GB personal storage**
- ✅ **No premium plan required**

---

**Your template with image support is ready! Just share it with the service account and test.** 🚀
