# 🔄 Google Docs Text Replacement from Templates

## 🎯 **Problem Solved**

You want to use the "Replace text in a document" module but need to dynamically get the "old text" from a Google Docs template first.

## 🔍 **Solution: Two-Step Process**

### **Step 1: Extract Text from Template**
### **Step 2: Use Extracted Text in Replace Module**

## 🛠️ **Method 1: Simple Text Replacement**

### **Scenario Setup:**

1. **Webhook Trigger**
   ```
   Module: Webhooks → Custom webhook
   Method: POST
   ```

2. **Get Template Text**
   ```
   Module: Google Docs → Get a document
   Document ID: {{1.source_template_id}}
   ```

3. **Extract Text**
   ```
   Module: Tools → Set variable
   Variable name: old_text
   Variable value: {{2.body.content}}
   ```

4. **Replace Text**
   ```
   Module: Google Docs → Replace text in a document
   Document ID: {{1.target_document_id}}
   Old text: {{3.old_text}}
   New text: {{1.new_text}}
   ```

## 🛠️ **Method 2: Advanced Text Processing**

### **For Complex Text Extraction:**

1. **Get Template Document**
   ```
   Module: Google Docs → Get a document
   Document ID: {{template_id}}
   ```

2. **Extract Specific Text**
   ```
   Module: Tools → Text parser
   Input text: {{1.body.content}}
   Pattern: (specific pattern to extract)
   Operation: Find matches
   ```

3. **Process Extracted Text**
   ```
   Module: Tools → Set variable
   Variable name: processed_text
   Variable value: {{2.matches | join(' ')}}
   ```

4. **Replace in Target Document**
   ```
   Module: Google Docs → Replace text in a document
   Document ID: {{target_document_id}}
   Old text: {{3.processed_text}}
   New text: {{new_content}}
   ```

## 📋 **Common Use Cases**

### **Case 1: Replace Entire Document Content**

**Input:**
```json
{
  "source_template_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "target_document_id": "1CxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "new_text": "This is the new content that will replace the entire template content."
}
```

**Process:**
1. Get full content from source template
2. Use that content as "old text"
3. Replace with new content in target document

### **Case 2: Replace Specific Sections**

**Input:**
```json
{
  "source_template_id": "template_id",
  "target_document_id": "target_id",
  "section_to_replace": "contract_terms",
  "new_text": "Updated contract terms..."
}
```

**Process:**
1. Get template content
2. Extract specific section using text parser
3. Replace that section in target document

### **Case 3: Replace Multiple Placeholders**

**Input:**
```json
{
  "source_template_id": "template_id",
  "target_document_id": "target_id",
  "replacements": {
    "{{old_placeholder1}}": "new_value1",
    "{{old_placeholder2}}": "new_value2"
  }
}
```

**Process:**
1. Get template content
2. Extract all placeholders
3. Replace each placeholder in target document

## 🔧 **Advanced Techniques**

### **Text Processing Options:**

#### **1. Clean Text**
```
Module: Tools → Set variable
Variable value: {{text | trim | replace('\n', ' ') | replace('\r', '')}}
```

#### **2. Extract Specific Patterns**
```
Module: Tools → Text parser
Pattern: \{\{([^}]+)\}\}
Operation: Find all matches
```

#### **3. Split and Process**
```
Module: Tools → Set variable
Variable value: {{text | split(' ') | slice(0, 10) | join(' ')}}
```

#### **4. Conditional Processing**
```
Module: Tools → Set variable
Variable value: {{text_length > 100 ? text | slice(0, 100) : text}}
```

## 🧪 **Testing Your Setup**

### **Test Webhook Payload:**

```json
{
  "source_template_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "target_document_id": "1CxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "new_text": "This is the replacement text that will replace the content from the source template."
}
```

### **Expected Flow:**

1. **Webhook receives** template and target document IDs
2. **Google Docs module** gets content from source template
3. **Tools module** extracts the text content
4. **Replace module** replaces the extracted text with new text in target document

## 🚀 **Quick Start Templates**

### **Template 1: Simple Replacement**
```json
{
  "modules": [
    {"type": "webhook", "name": "Input"},
    {"type": "google-docs", "name": "Get Template", "action": "get_document"},
    {"type": "tools", "name": "Extract Text", "action": "set_variable"},
    {"type": "google-docs", "name": "Replace Text", "action": "replace_text"}
  ]
}
```

### **Template 2: Advanced Processing**
```json
{
  "modules": [
    {"type": "webhook", "name": "Input"},
    {"type": "google-docs", "name": "Get Template", "action": "get_document"},
    {"type": "tools", "name": "Process Text", "action": "text_parser"},
    {"type": "tools", "name": "Clean Text", "action": "set_variable"},
    {"type": "google-docs", "name": "Replace Text", "action": "replace_text"}
  ]
}
```

## 🔍 **Troubleshooting**

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| Text not found | Check if source template has content |
| Replacement failed | Verify target document permissions |
| Empty old text | Ensure template is not empty |
| Permission denied | Check Google Docs API access |

### **Debug Steps:**

1. **Test webhook** with sample data
2. **Check Google Docs module** output
3. **Verify text extraction** results
4. **Test replacement** with simple text
5. **Check document permissions**

## 📊 **Best Practices**

### **Template Design:**
- Use consistent text patterns
- Avoid very long text blocks
- Include unique identifiers
- Test with sample data

### **Make.com Configuration:**
- Use error handling for failed operations
- Set appropriate timeouts
- Log replacement operations
- Validate input data

## 🎯 **Ready-to-Use Blueprints**

I've created two blueprints for you:

1. **`MAKECOM_SIMPLE_TEXT_REPLACEMENT.json`** - Basic 4-module setup
2. **`MAKECOM_TEXT_REPLACEMENT_WORKFLOW.json`** - Advanced workflow with processing

**Import either blueprint** into Make.com and customize it for your needs!

This approach solves your problem by first extracting the text from your template, then using that extracted text as the "old text" in the replacement module. 🚀
