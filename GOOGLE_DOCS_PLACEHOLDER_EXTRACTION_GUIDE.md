# 🔍 Google Docs Placeholder Extraction in Make.com

## 🎯 **Best Modules for Placeholder Extraction**

### **1. Google Docs Module (Recommended)**

#### **Module: "Google Docs" → "Get a document"**

**Configuration:**
```
Action: Get a document
Document ID: {{template_id}}
```

**Output:** Returns the document content in JSON format that you can parse.

### **2. HTTP Request Module (Alternative)**

#### **Module: "HTTP" → "Make an HTTP request"**

**Configuration:**
```
Method: GET
URL: https://docs.googleapis.com/v1/documents/{{template_id}}
Headers:
  Authorization: Bearer {{google_access_token}}
  Content-Type: application/json
```

### **3. Text Processing Modules**

#### **Module: "Tools" → "Text parser"**

**Configuration:**
```
Input text: {{previous_module.document_content}}
Pattern: \{\{([^}]+)\}\}
Operation: Find all matches
```

## 🛠️ **Step-by-Step Setup**

### **Step 1: Create the Scenario**

1. **Go to Make.com**
2. **Create new scenario**: "Template Placeholder Extractor"
3. **Add modules** as described below

### **Step 2: Add Webhook Trigger**

```
Module: Webhooks → Custom webhook
Method: POST
Response: JSON
```

**Input fields:**
- `template_id` (required)
- `template_name` (optional)

### **Step 3: Add Google Docs Module**

```
Module: Google Docs → Get a document
Document ID: {{1.template_id}}
```

### **Step 4: Add Text Processing**

```
Module: Tools → Set variable
Variable name: document_text
Variable value: {{2.body.content}}
```

### **Step 5: Extract Placeholders**

```
Module: Tools → Text parser
Input text: {{3.document_text}}
Pattern: \{\{([^}]+)\}\}
Operation: Find all matches
```

### **Step 6: Process Results**

```
Module: Tools → Set multiple variables
Variables:
  - template_id: {{1.template_id}}
  - placeholders: {{4.matches}}
  - placeholder_count: {{4.matches | length}}
  - extraction_date: {{now}}
```

## 📋 **Common Placeholder Patterns**

### **Contract Placeholders**
```
{{contract_number}}
{{contract_date}}
{{contract_type}}
{{contract_start_date}}
{{contract_end_date}}
```

### **Promoter Placeholders**
```
{{promoter_name_en}}
{{promoter_name_ar}}
{{promoter_id_card_number}}
{{promoter_mobile_number}}
{{promoter_email}}
```

### **Party Placeholders**
```
{{first_party_name_en}}
{{first_party_name_ar}}
{{first_party_crn}}
{{second_party_name_en}}
{{second_party_name_ar}}
{{second_party_crn}}
```

### **Salary Placeholders**
```
{{basic_salary}}
{{allowances}}
{{total_salary}}
{{currency}}
```

## 🔧 **Advanced Processing**

### **Categorize Placeholders**

```
Module: Tools → Set multiple variables
Variables:
  - contract_placeholders: {{placeholders | filter('contains', 'contract')}}
  - promoter_placeholders: {{placeholders | filter('contains', 'promoter')}}
  - party_placeholders: {{placeholders | filter('contains', 'party')}}
  - salary_placeholders: {{placeholders | filter('contains', 'salary')}}
```

### **Validate Required Fields**

```
Module: Tools → Set multiple variables
Variables:
  - has_contract_number: {{placeholders | contains('contract_number')}}
  - has_promoter_name: {{placeholders | contains('promoter_name')}}
  - has_party_info: {{placeholders | contains('party_name')}}
  - is_valid_template: {{has_contract_number}} && {{has_promoter_name}} && {{has_party_info}}
```

## 🧪 **Testing Your Setup**

### **Test with Sample Template ID**

```json
{
  "template_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "template_name": "Employment Contract Template"
}
```

### **Expected Output**

```json
{
  "template_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "placeholders": [
    "{{contract_number}}",
    "{{contract_date}}",
    "{{promoter_name_en}}",
    "{{promoter_name_ar}}",
    "{{first_party_name_en}}",
    "{{second_party_name_en}}",
    "{{job_title}}",
    "{{basic_salary}}",
    "{{currency}}"
  ],
  "placeholder_count": 9,
  "extraction_date": "2024-01-15T10:30:00Z"
}
```

## 🚀 **Integration with Contract Generation**

### **Use Extracted Placeholders**

Once you have the placeholders, you can use them in your contract generation scenario:

```
Module: Google Docs → Create a document from template
Template ID: {{template_id}}
Variables: Map each placeholder to your data source
```

### **Dynamic Variable Mapping**

```
{{contract_number}} → {{contract_data.contract_number}}
{{promoter_name_en}} → {{promoter_data.name_en}}
{{first_party_name_en}} → {{first_party_data.name_en}}
```

## 🔍 **Troubleshooting**

### **Common Issues**

| Issue | Solution |
|-------|----------|
| Document not found | Check template ID and permissions |
| No placeholders found | Verify template has {{placeholder}} format |
| Permission denied | Ensure Google Docs API access |
| Empty content | Check document is not empty |

### **Debug Steps**

1. **Test webhook** with sample template ID
2. **Check Google Docs module** output
3. **Verify text processing** results
4. **Validate placeholder format** in template
5. **Test with different templates**

## 📊 **Best Practices**

### **Template Design**
- Use consistent placeholder format: `{{placeholder_name}}`
- Avoid spaces in placeholder names
- Use descriptive names (e.g., `{{promoter_name_en}}` not `{{name}}`)
- Group related placeholders (e.g., `{{contract_*}}`, `{{promoter_*}}`)

### **Make.com Configuration**
- Use error handling for failed extractions
- Set appropriate timeouts for large documents
- Log extraction results for debugging
- Validate required placeholders before processing

## 🎯 **Quick Start**

1. **Import the blueprint**: `MAKECOM_SIMPLE_PLACEHOLDER_EXTRACTOR.json`
2. **Configure Google Docs connection**
3. **Test with your template ID**
4. **Use results in contract generation**

This approach will help you automatically extract and categorize all placeholders from your Google Docs templates, making your contract generation more dynamic and flexible!
