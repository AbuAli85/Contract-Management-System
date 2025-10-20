# Make.com Module 6 - Full Configuration with Conditional Logic

## Module Type

**Google Docs → Create a Document from a Template**

---

## Basic Settings

```yaml
Connection: [Your Google Account]
Template Document ID: 1dzYQ_MDstiErG9O1yP87_bVXvDPQbe8V
New Document Name: {{1.contract_number}} - Employment Contract
Destination Folder: [Your folder]
```

---

## TEXT REPLACEMENTS (with fallbacks for empty values)

### Core Contract Data (Items 1-8)

```yaml
Item 1:
  Variable name: contract_number
  Replace with: { { if(1.contract_number; 1.contract_number; "PENDING") } }

Item 2:
  Variable name: contract_type
  Replace with: { { if(1.contract_type; 1.contract_type; "N/A") } }

Item 3:
  Variable name: contract_start_date
  Replace with: { { if(1.contract_start_date; 1.contract_start_date; "TBD") } }

Item 4:
  Variable name: contract_end_date
  Replace with: { { if(1.contract_end_date; 1.contract_end_date; "TBD") } }

Item 5:
  Variable name: job_title
  Replace with: { { if(1.job_title; 1.job_title; "N/A") } }

Item 6:
  Variable name: department
  Replace with: { { if(1.department; 1.department; "N/A") } }

Item 7:
  Variable name: basic_salary
  Replace with: { { if(1.basic_salary; 1.basic_salary; "0") } }

Item 8:
  Variable name: currency
  Replace with: { { if(1.currency; 1.currency; "OMR") } }
```

### Work Details (Items 9-14)

```yaml
Item 9:
  Variable name: work_location
  Replace with: { { if(1.work_location; 1.work_location; "N/A") } }

Item 10:
  Variable name: work_schedule
  Replace with: { { if(1.work_schedule; 1.work_schedule; "N/A") } }

Item 11:
  Variable name: working_hours_numeric
  Replace with:
    { { if(1.working_hours_numeric; 1.working_hours_numeric; "40") } }

Item 12:
  Variable name: probation_period_numeric
  Replace with:
    { { if(1.probation_period_numeric; 1.probation_period_numeric; "3") } }

Item 13:
  Variable name: notice_period_numeric
  Replace with:
    { { if(1.notice_period_numeric; 1.notice_period_numeric; "30") } }

Item 14:
  Variable name: special_terms
  Replace with: { { if(1.special_terms; 1.special_terms; "None") } }
```

### Promoter Data (Items 15-20)

```yaml
Item 15:
  Variable name: promoter_name_en
  Replace with: { { if(1.promoter_name_en; 1.promoter_name_en; "N/A") } }

Item 16:
  Variable name: promoter_name_ar
  Replace with: { { if(1.promoter_name_ar; 1.promoter_name_ar; "غير متوفر") } }

Item 17:
  Variable name: promoter_id_card_number
  Replace with:
    { { if(1.promoter_id_card_number; 1.promoter_id_card_number; "N/A") } }

Item 18:
  Variable name: promoter_passport_number
  Replace with:
    { { if(1.promoter_passport_number; 1.promoter_passport_number; "N/A") } }

Item 19:
  Variable name: promoter_email
  Replace with: { { if(1.promoter_email; 1.promoter_email; "N/A") } }

Item 20:
  Variable name: promoter_mobile_number
  Replace with:
    { { if(1.promoter_mobile_number; 1.promoter_mobile_number; "N/A") } }
```

### First Party Data (Items 21-25)

```yaml
Item 21:
  Variable name: first_party_name_en
  Replace with: { { if(1.first_party_name_en; 1.first_party_name_en; "N/A") } }

Item 22:
  Variable name: first_party_name_ar
  Replace with:
    { { if(1.first_party_name_ar; 1.first_party_name_ar; "غير متوفر") } }

Item 23:
  Variable name: first_party_crn
  Replace with: { { if(1.first_party_crn; 1.first_party_crn; "N/A") } }

Item 24:
  Variable name: first_party_address
  Replace with: { { if(1.first_party_address; 1.first_party_address; "N/A") } }

Item 25:
  Variable name: first_party_email
  Replace with: { { if(1.first_party_email; 1.first_party_email; "N/A") } }
```

### Second Party Data (Items 26-30)

```yaml
Item 26:
  Variable name: second_party_name_en
  Replace with:
    { { if(1.second_party_name_en; 1.second_party_name_en; "N/A") } }

Item 27:
  Variable name: second_party_name_ar
  Replace with:
    { { if(1.second_party_name_ar; 1.second_party_name_ar; "غير متوفر") } }

Item 28:
  Variable name: second_party_crn
  Replace with: { { if(1.second_party_crn; 1.second_party_crn; "N/A") } }

Item 29:
  Variable name: second_party_address
  Replace with:
    { { if(1.second_party_address; 1.second_party_address; "N/A") } }

Item 30:
  Variable name: second_party_email
  Replace with: { { if(1.second_party_email; 1.second_party_email; "N/A") } }
```

---

## IMAGE REPLACEMENTS (with placeholder fallbacks)

**🔑 CRITICAL:** All images MUST have a valid URL. We use placeholder images as fallbacks.

```yaml
Image 1:
  Variable name: image_1
  Image URL:
    {
      {
        if(1.promoter_id_card_url; 1.promoter_id_card_url; "https://via.placeholder.com/200x200.png?text=ID+Card"),
      },
    }

Image 2:
  Variable name: image_2
  Image URL:
    {
      {
        if(1.promoter_passport_url; 1.promoter_passport_url; "https://via.placeholder.com/200x200.png?text=Passport"),
      },
    }

Image 3:
  Variable name: image_3
  Image URL:
    {
      {
        if(1.header_logo; 1.header_logo; "https://via.placeholder.com/400x100.png?text=Header"),
      },
    }

Image 4:
  Variable name: image_4
  Image URL:
    {
      {
        if(1.footer_logo; 1.footer_logo; "https://via.placeholder.com/400x100.png?text=Footer"),
      },
    }

Image 5:
  Variable name: image_5
  Image URL:
    {
      {
        if(1.company_logo; 1.company_logo; "https://via.placeholder.com/200x200.png?text=Company"),
      },
    }

Image 6:
  Variable name: image_6
  Image URL:
    {
      {
        if(1.first_party_logo; 1.first_party_logo; "https://via.placeholder.com/200x200.png?text=Party+1"),
      },
    }

Image 7:
  Variable name: image_7
  Image URL:
    {
      {
        if(1.second_party_logo; 1.second_party_logo; "https://via.placeholder.com/200x200.png?text=Party+2"),
      },
    }

Image 8:
  Variable name: image_8
  Image URL:
    {
      {
        if(1.first_party_signature; 1.first_party_signature; "https://via.placeholder.com/200x100.png?text=Signature+1"),
      },
    }

Image 9:
  Variable name: image_9
  Image URL:
    {
      {
        if(1.second_party_signature; 1.second_party_signature; "https://via.placeholder.com/200x100.png?text=Signature+2"),
      },
    }

Image 10:
  Variable name: image_10
  Image URL:
    {
      {
        if(1.stamp_image; 1.stamp_image; "https://via.placeholder.com/150x150.png?text=Stamp"),
      },
    }

Image 11:
  Variable name: image_11
  Image URL:
    {
      {
        if(1.qr_code; 1.qr_code; "https://via.placeholder.com/150x150.png?text=QR+Code"),
      },
    }

Image 12:
  Variable name: image_12
  Image URL:
    {
      {
        if(1.image_12; 1.image_12; "https://via.placeholder.com/200x200.png?text=Extra"),
      },
    }
```

---

## 🎯 Why This Works

1. **`if()` function** checks if a value exists
2. **First argument:** The field to check (e.g., `1.promoter_email`)
3. **Second argument:** Value if it exists (e.g., `1.promoter_email`)
4. **Third argument:** Fallback if empty (e.g., `"N/A"`)

**Result:** No empty values = No errors!

---

## 🚀 Quick Copy Format

For easy copy-paste into Make.com, use this syntax:

**Text:**

```
{{if(1.field_name; 1.field_name; "N/A")}}
```

**Images:**

```
{{if(1.image_url; 1.image_url; "https://via.placeholder.com/200x200.png?text=Image")}}
```

---

## ✅ Testing Checklist

After configuration:

1. ☐ Save Module 6
2. ☐ Run scenario once
3. ☐ Generate a contract in your app
4. ☐ Check Make.com for errors
5. ☐ Open generated Google Doc
6. ☐ Verify text replacements worked
7. ☐ Verify image replacements worked (or placeholders appear)

---

## 🆘 Still Getting Errors?

If you still see "values or URLs are missing":

1. **Check Module 1 output** - is the webhook receiving data?
2. **Test with just 1 text field** - does `{{1.contract_number}}` work?
3. **Test with just 1 image** - does `{{1.promoter_id_card_url}}` work?
4. **Share the exact error message** with me for debugging

The issue is usually:

- Variable name mismatch (typo)
- Webhook not sending data
- Module not properly connected
