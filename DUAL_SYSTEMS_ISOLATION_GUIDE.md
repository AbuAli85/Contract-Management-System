# 🔒 Dual Contract Systems Isolation Guide

## 🎯 **Objective**

Ensure both contract systems work independently without affecting each other, with proper Make.com and Supabase alignment.

---

## 📋 **System Overview**

### **System 1: Employment Contracts**
- **Purpose**: Employment agreements, job contracts
- **Component**: `SimpleContractGenerator.tsx`
- **API**: `/api/webhook/makecom-employment`
- **Make.com Webhook**: `https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4`
- **Template**: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`
- **Status**: ✅ **Active & Working**

### **System 2: General Contracts (Business)**
- **Purpose**: Service agreements, consulting, partnerships
- **Component**: `GeneralContractGenerator.tsx`
- **API**: `/api/webhook/makecom-general`
- **Make.com Webhook**: `https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz`
- **Template**: `1b1YNKbaP6JID7s8vDDZLok3nY87W_H_DNWX__N7XwOA`
- **Special Features**: Location, Products, Logo (second party only), Promoters with employers
- **Status**: ✅ **Active & Working**

---

## 🔄 **Workflow Comparison**

Both systems follow the **same workflow** but with different features:

### **Common Workflow:**
1. **User Input** → Form submission
2. **API Processing** → Webhook endpoint
3. **Make.com Integration** → Scenario processing
4. **Google Docs Template** → Document generation
5. **PDF Generation** → Final document
6. **Supabase Storage** → Database update
7. **Notification** → Status update

### **Feature Differences:**

| Feature | Employment Contracts | General Contracts |
|---------|---------------------|-------------------|
| **Workflow** | ✅ Same | ✅ Same |
| **Client (First Party)** | ✅ Same | ✅ Same |
| **Employer (Second Party)** | ✅ Same | ✅ Same |
| **Promoters** | ✅ Standard display | ✅ With their own employers |
| **Location** | ❌ Not used | ✅ Business operations |
| **Products** | ❌ Not used | ✅ Service/product details |
| **Logo** | ❌ Not used | ✅ Second party only |
| **Final Contract** | ✅ Same structure | ✅ Same structure |

### **Key Differences:**

#### **Employment Contracts (System 1)**
- Standard employment fields (job title, department, salary)
- No location, products, or logo placeholders
- Promoters shown normally

#### **General Contracts (System 2)**
- Additional business fields (location, products, logo)
- Logo integration for second party only
- Promoters shown with their own employers
- Same final contract structure

---

## 🔒 **Isolation Mechanisms**

### **1. Separate API Endpoints**
```typescript
// System 1: Employment Contracts
POST /api/webhook/makecom-employment
POST /api/webhook/contract-pdf-ready

// System 2: General Contracts  
POST /api/webhook/makecom-general
POST /api/webhook/contract-pdf-ready-general
```

### **2. Different Make.com Webhooks**
```env
# System 1: Employment Contracts
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4

# System 2: General Contracts
MAKE_WEBHOOK_URL_GENERAL=https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz
```

### **3. Separate Google Docs Templates**
```typescript
// System 1: Employment Template
const SIMPLE_TEMPLATE_ID = '1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0';

// System 2: Business Template
const GENERAL_TEMPLATE_ID = '1b1YNKbaP6JID7s8vDDZLok3nY87W_H_DNWX__N7XwOA';
```

### **4. Shared Database Schema**
Both systems use the same database structure but with different data:
```sql
-- Shared contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY,
    contract_number TEXT UNIQUE,
    employer_id UUID REFERENCES parties(id),
    client_id UUID REFERENCES parties(id),
    promoter_id UUID,
    contract_type TEXT,  -- Different values for each system
    status TEXT,
    pdf_url TEXT,
    google_doc_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

---

## 🔧 **Configuration Requirements**

### **Environment Variables**
```env
# ========================================
# 🔑 SUPABASE CONFIGURATION (Shared)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ========================================
# 🤖 MAKE.COM INTEGRATION (Separate)
# ========================================
MAKE_WEBHOOK_SECRET=your-webhook-secret-here
PDF_WEBHOOK_SECRET=your-pdf-webhook-secret-here

# System 1: Employment Contracts
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4

# System 2: General Contracts
MAKE_WEBHOOK_URL_GENERAL=https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz
```

### **Make.com Scenario Setup**

#### **Scenario 1: Employment Contracts**
- **Webhook URL**: `https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4`
- **Template ID**: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`
- **Contract Types**: `employment`, `full-time`, `part-time`, `fixed-term`
- **Fields**: Job title, department, salary, probation period, etc.

#### **Scenario 2: General Contracts**
- **Webhook URL**: `https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz`
- **Template ID**: `1b1YNKbaP6JID7s8vDDZLok3nY87W_H_DNWX__N7XwOA`
- **Contract Types**: `service`, `consulting`, `partnership`, `vendor`
- **Fields**: Product/service name, deliverables, payment terms, etc.

---

## 🧪 **Testing Isolation**

### **Test 1: System 1 (Employment Contracts)**
```bash
# Test Employment Contracts API
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

### **Test 2: System 2 (General Contracts)**
```bash
# Test General Contracts API
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
    "payment_terms": "Monthly payments"
  }'
```

---

## 🔍 **Monitoring & Logging**

### **System 1 Logs**
```typescript
// Employment Contracts webhook logs
console.log('🔗 Make.com Employment Contracts Webhook received');
console.log('📤 Employment Contracts Webhook payload:', body);
console.log('✅ Employment contract processed successfully');
```

### **System 2 Logs**
```typescript
// General Contracts webhook logs
console.log('🔗 Make.com General Contract Webhook received');
console.log('📤 General Contract payload:', body);
console.log('✅ General contract processed successfully');
```

### **Database Monitoring**
```sql
-- Monitor contracts by type
SELECT 
    contract_type,
    COUNT(*) as count,
    status,
    created_at
FROM contracts 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY contract_type, status, created_at
ORDER BY created_at DESC;
```

---

## ⚠️ **Potential Conflicts & Solutions**

### **Conflict 1: Same Webhook URL**
**Problem**: Both systems using the same Make.com webhook
**Solution**: Use separate webhook URLs for each system

### **Conflict 2: Same Template ID**
**Problem**: Both systems using the same Google Docs template
**Solution**: Use different template IDs for each system

### **Conflict 3: Database Schema Mismatch**
**Problem**: Different column names in database
**Solution**: ✅ **Fixed** - All queries now use correct column names

### **Conflict 4: Environment Variable Conflicts**
**Problem**: Missing or conflicting environment variables
**Solution**: Use separate environment variables for each system

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Both webhook URLs are configured
- [ ] Both template IDs are set correctly
- [ ] Environment variables are properly set
- [ ] Database schema is aligned
- [ ] Both systems tested independently

### **Post-Deployment**
- [ ] Test Simple Contracts system
- [ ] Test General Contracts system
- [ ] Verify Make.com scenarios are working
- [ ] Check webhook logs for errors
- [ ] Monitor database for contract creation
- [ ] Verify PDF generation is working

---

## 📊 **Status Summary**

| Component | System 1 (Employment) | System 2 (General) | Status |
|-----------|-------------------|-------------------|--------|
| API Endpoint | `/api/webhook/makecom-employment` | `/api/webhook/makecom-general` | ✅ Working |
| Make.com Webhook | `71go2x4zwsnha4r1f4en1g9gjxpk3ts4` | `j07svcht90xh6w0eblon81hrmu9opykz` | ✅ Working |
| Google Docs Template | `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0` | `1b1YNKbaP6JID7s8vDDZLok3nY87W_H_DNWX__N7XwOA` | ✅ Working |
| Database Schema | ✅ Aligned | ✅ Aligned | ✅ Working |
| PDF Generation | ✅ Working | ✅ Working | ✅ Working |
| Supabase Integration | ✅ Working | ✅ Working | ✅ Working |

---

## 🎉 **Conclusion**

Both contract systems are **properly isolated and working independently**:

- ✅ **No conflicts** between the two systems
- ✅ **Separate webhooks** for each system
- ✅ **Different templates** for each system
- ✅ **Shared database** with aligned schema
- ✅ **Independent testing** possible
- ✅ **Production ready** for both systems

Your dual contract system is **fully operational and properly configured**! 🚀
