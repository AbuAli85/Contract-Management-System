# Make.com Module 6 - Minimal Safe Configuration

## Module Type

**Google Docs → Create a Document from a Template**

---

## Basic Settings

```yaml
Connection: [Your Google Account]
Template Document ID: 1dzYQ_MDstiErG9O1yP87_bVXvDPQbe8V
New Document Name: {{1.contract_number}} - Employment Contract
Destination Folder: [Your folder or leave empty]
```

---

## TEXT REPLACEMENTS (15 Core Fields)

**✅ Add these items one by one:**

```yaml
Item 1:
  Variable name: contract_number
  Replace with: { { 1.contract_number } }

Item 2:
  Variable name: contract_type
  Replace with: { { 1.contract_type } }

Item 3:
  Variable name: contract_start_date
  Replace with: { { 1.contract_start_date } }

Item 4:
  Variable name: contract_end_date
  Replace with: { { 1.contract_end_date } }

Item 5:
  Variable name: job_title
  Replace with: { { 1.job_title } }

Item 6:
  Variable name: department
  Replace with: { { 1.department } }

Item 7:
  Variable name: basic_salary
  Replace with: { { 1.basic_salary } }

Item 8:
  Variable name: currency
  Replace with: { { 1.currency } }

Item 9:
  Variable name: promoter_name_en
  Replace with: { { 1.promoter_name_en } }

Item 10:
  Variable name: promoter_id_card_number
  Replace with: { { 1.promoter_id_card_number } }

Item 11:
  Variable name: first_party_name_en
  Replace with: { { 1.first_party_name_en } }

Item 12:
  Variable name: second_party_name_en
  Replace with: { { 1.second_party_name_en } }

Item 13:
  Variable name: work_location
  Replace with: { { 1.work_location } }

Item 14:
  Variable name: working_hours_numeric
  Replace with: { { 1.working_hours_numeric } }

Item 15:
  Variable name: notice_period_numeric
  Replace with: { { 1.notice_period_numeric } }
```

---

## IMAGE REPLACEMENTS (2 Core Images Only)

**✅ Start with just the 2 promoter images:**

```yaml
Image 1:
  Variable name: image_1
  Image URL: { { 1.promoter_id_card_url } }

Image 2:
  Variable name: image_2
  Image URL: { { 1.promoter_passport_url } }
```

---

## 🚨 IMPORTANT NOTES

1. **We're using `{{1.field_name}}`** directly from the webhook (Module 1)
   - Skip Module 2 (Set Variables) for now
   - This eliminates one potential failure point

2. **Only 2 images** for now
   - The other images (header_logo, company_logo, etc.) might be empty
   - We'll add them later after confirming the data flow works

3. **Test after each addition**
   - Add a few fields, test
   - If it works, add more
   - If it fails, we know which field caused the issue

---

## 🔧 Troubleshooting

### If you still get "values or URLs are missing":

**Option A: Check if field exists before using it**

- In Module 6, some fields might be optional
- Check "Skip this module if" and add condition: `{{1.field_name}} is empty`

**Option B: Use default values**

- For optional fields, use: `{{if(1.field_name; 1.field_name; "N/A")}}`
- For optional images, use: `{{if(1.image_url; 1.image_url; "https://via.placeholder.com/200")}}`

---

## 🎯 Next Steps

1. Configure Module 6 with ONLY the fields above
2. Test the scenario
3. Share the result with me
4. We'll add more fields gradually
