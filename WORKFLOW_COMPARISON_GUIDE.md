# 🔄 Workflow Comparison Guide

## 📋 **Overview**

Both contract systems follow the **same workflow** but with different features and placeholders. This guide explains the similarities and differences between the two systems.

---

## 🔄 **Common Workflow**

Both systems follow this identical workflow:

```
1. User Input → Form submission
2. API Processing → Webhook endpoint
3. Make.com Integration → Scenario processing
4. Google Docs Template → Document generation
5. PDF Generation → Final document
6. Supabase Storage → Database update
7. Notification → Status update
```

---

## 📊 **Feature Comparison**

| Feature                     | Employment Contracts | General Contracts           |
| --------------------------- | -------------------- | --------------------------- |
| **Workflow**                | ✅ Same              | ✅ Same                     |
| **Client (First Party)**    | ✅ Same              | ✅ Same                     |
| **Employer (Second Party)** | ✅ Same              | ✅ Same                     |
| **Promoters**               | ✅ Standard display  | ✅ With their own employers |
| **Location**                | ❌ Not used          | ✅ Business operations      |
| **Products**                | ❌ Not used          | ✅ Service/product details  |
| **Logo**                    | ❌ Not used          | ✅ Second party only        |
| **Final Contract**          | ✅ Same structure    | ✅ Same structure           |

---

## 🎯 **System 1: Employment Contracts**

### **Purpose**

- Employment agreements
- Job contracts
- HR-related contracts

### **Fields**

- Job title
- Department
- Salary
- Probation period
- Notice period
- Working hours
- Work location

### **Features**

- Standard employment fields
- No location, products, or logo placeholders
- Promoters shown normally
- Same final contract structure

### **API Endpoint**

```
POST /api/webhook/makecom-employment
```

### **Make.com Webhook**

```
https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4
```

### **Google Docs Template**

```
1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0
```

---

## 🎯 **System 2: General Contracts (Business)**

### **Purpose**

- Service agreements
- Consulting contracts
- Business partnerships
- Vendor agreements

### **Fields**

- Product/service name
- Service description
- Project duration
- Deliverables
- Payment terms
- **Location** (business operations)
- **Products** (service/product details)
- **Logo** (second party only)

### **Features**

- Additional business fields
- Location placeholders for business operations
- Product/service details
- Logo integration for second party only
- Promoters shown with their own employers
- Same final contract structure

### **API Endpoint**

```
POST /api/webhook/makecom-general
```

### **Make.com Webhook**

```
https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz
```

### **Google Docs Template**

```
1b1YNKbaP6JID7s8vDDZLok3nY87W_H_DNWX__N7XwOA
```

---

## 🔍 **Key Differences Explained**

### **1. Location Placeholders**

- **Employment Contracts**: Not used
- **General Contracts**: Used for business operations, office locations, service areas

### **2. Product/Service Details**

- **Employment Contracts**: Not used
- **General Contracts**: Used for service descriptions, product specifications, deliverables

### **3. Logo Integration**

- **Employment Contracts**: Not used
- **General Contracts**: Used for second party branding only

### **4. Promoters Display**

- **Employment Contracts**: Standard display
- **General Contracts**: Promoters shown with their own employers

### **5. Final Contract Structure**

- **Both Systems**: Same structure and format

---

## 🧪 **Testing Both Systems**

### **Test Employment Contracts**

```bash
curl -X POST http://localhost:3000/api/webhook/makecom-employment \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{
    "contract_type": "employment",
    "promoter_id": "test-promoter",
    "first_party_id": "test-employer",
    "second_party_id": "test-client",
    "job_title": "Software Developer",
    "department": "IT",
    "basic_salary": 5000
  }'
```

### **Test General Contracts**

```bash
curl -X POST http://localhost:3000/api/webhook/makecom-general \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{
    "contract_type": "service",
    "promoter_id": "test-promoter",
    "first_party_id": "test-employer",
    "second_party_id": "test-client",
    "product_name": "Business Consulting",
    "service_description": "Strategic consulting services",
    "location": "Dubai, UAE",
    "logo_url": "https://example.com/logo.png"
  }'
```

---

## 📋 **Summary**

Both contract systems are designed to work with the **same workflow** but serve different purposes:

- **Employment Contracts**: Standard employment agreements with basic fields
- **General Contracts**: Business agreements with additional features (location, products, logo)

The key difference is that **General Contracts** have additional placeholders for:

- Location (business operations)
- Products (service/product details)
- Logo (second party only)
- Promoters with their own employers

Both systems produce the **same final contract structure** and follow the **same workflow** from input to output.

---

## 🎉 **Conclusion**

Your dual contract system is perfectly designed with:

- ✅ **Same workflow** for both systems
- ✅ **Different features** for different use cases
- ✅ **Same final structure** for consistency
- ✅ **Proper isolation** between systems
- ✅ **Flexible configuration** for various contract types

Both systems are ready for production use! 🚀
