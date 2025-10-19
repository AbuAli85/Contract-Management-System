# 🔧 Make.com Webhook Configuration Guide

## 📋 **Current Setup**

You now have **two contract generation systems** with **two separate Make.com scenarios**:

### 1. **Simple Contracts (Employment)**
- **Component**: `SimpleContractGenerator.tsx`
- **API**: `/api/webhook/makecom-simple`
- **Make.com Webhook**: Your existing webhook URL
- **Contract Types**: Employment contracts (full-time, part-time, fixed-term, etc.)
- **Template**: Promoter Contract template

### 2. **General Contracts (Business)**
- **Component**: `GeneralContractGenerator.tsx`
- **API**: `/api/contracts/general/generate`
- **Make.com Webhook**: `https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz`
- **Contract Types**: General business contracts (service, consulting, partnership, etc.)
- **Template**: General Contract template

## 🔗 **Environment Variables**

Add these to your `.env.local` file:

```env
# Make.com Integration
MAKECOM_WEBHOOK_URL_SIMPLE=https://your-existing-simple-contract-webhook
MAKECOM_WEBHOOK_URL_GENERAL=https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz

# Webhook Secrets
MAKE_WEBHOOK_SECRET=your-webhook-secret
PDF_WEBHOOK_SECRET=your-pdf-webhook-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🎯 **Make.com Scenario Setup**

### **Scenario 1: Simple Contracts (Employment)**
- **Webhook URL**: Your existing webhook
- **Template ID**: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`
- **Use Case**: Employment agreements, job contracts
- **Fields**: Job title, department, salary, probation period, etc.

### **Scenario 2: General Contracts (Business)**
- **Webhook URL**: `https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz`
- **Template ID**: `1b1YNKbaP6JID7s8vDDZLok3nY87W_H_DNWX__N7XwOA`
- **Use Case**: Service agreements, consulting, partnerships
- **Fields**: Product/service name, deliverables, payment terms, etc.

## 🔄 **Make.com Flow Structure**

Both scenarios follow the same structure based on your provided flow:

1. **Webhook Trigger** - Receives contract data
2. **Variable Setting** - Sets contract_id, contract_number, and all contract data
3. **Data Retrieval** - Fetches promoter, client, and employer data from Supabase
4. **Template Processing** - Gets Google Docs template
5. **Document Creation** - Creates document from template with mapped variables
6. **PDF Export** - Exports document as PDF
7. **File Upload** - Uploads PDF to Supabase storage
8. **Status Update** - Calls back to update contract status

## 📊 **Contract Types Supported**

### **Simple Contracts (Employment)**
- Full-Time Permanent Employment
- Part-Time Contract
- Fixed-Term Contract
- Consulting Agreement
- Service Contract

### **General Contracts (Business)**
- General Service Contract
- Consulting Agreement
- Service Contract
- Partnership Agreement
- Vendor Agreement
- Maintenance Contract
- Supply Agreement
- Distribution Agreement
- Franchise Agreement
- Licensing Agreement

## 🚀 **Usage**

### **Access Simple Contracts**
Navigate to your existing simple contract generator page.

### **Access General Contracts**
Navigate to `/contracts/general` to use the new general contract generator.

## 🔧 **Testing**

### **Test Simple Contracts**
1. Use your existing simple contract generator
2. Fill in employment contract details
3. Generate contract
4. Check Make.com scenario execution

### **Test General Contracts**
1. Navigate to `/contracts/general`
2. Fill in general contract details
3. Generate contract
4. Check Make.com scenario execution at: `https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz`

## 📝 **Notes**

- Both systems are now fully integrated with Make.com
- Each system uses its own webhook URL and template
- The general contract system is ready for production use
- All contract data is properly mapped to Make.com variables
- PDF generation and status updates are handled automatically

## 🎉 **Status**

✅ **Simple Contracts**: Ready (existing system)
✅ **General Contracts**: Ready (new system with webhook: `https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz`)

Both contract generation systems are now fully operational!