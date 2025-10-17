# 🔐 Make.com Webhook Secret Setup Guide

## 🎯 **What is MAKE_WEBHOOK_SECRET?**

The `{{var.organization.MAKE_WEBHOOK_SECRET}}` is a security token that your application uses to verify that webhook requests are coming from Make.com and not from unauthorized sources.

## 🔧 **How to Set Up MAKE_WEBHOOK_SECRET**

### **Step 1: Generate a Secret Key**

You can generate a secure secret key using any of these methods:

#### **Method 1: Online Generator**
1. **Go to**: https://www.uuidgenerator.net/
2. **Generate** a UUID v4
3. **Copy** the generated UUID

#### **Method 2: Command Line (if you have Node.js)**
```bash
node -e "console.log(require('crypto').randomUUID())"
```

#### **Method 3: PowerShell (Windows)**
```powershell
[System.Guid]::NewGuid().ToString()
```

#### **Method 4: Manual Generation**
Create a random string like: `make_webhook_2024_abc123def456ghi789`

### **Step 2: Set in Make.com Organization**

1. **Go to**: https://www.make.com/
2. **Sign in** to your account
3. **Click** on your organization name (top right)
4. **Select** "Organization settings"
5. **Go to** "Variables" tab
6. **Click** "Add variable"
7. **Set**:
   - **Name**: `MAKE_WEBHOOK_SECRET`
   - **Value**: `your_generated_secret_here`
   - **Type**: `Text`
8. **Save** the variable

### **Step 3: Set in Your Application**

Add the same secret to your application's environment variables:

#### **In your .env.local file:**
```bash
MAKE_WEBHOOK_SECRET=your_generated_secret_here
```

#### **In your production environment:**
```bash
MAKE_WEBHOOK_SECRET=your_generated_secret_here
```

## 🔍 **How to Verify It's Working**

### **Step 1: Check Make.com Variable**
1. **Go to** Make.com organization settings
2. **Check** that `MAKE_WEBHOOK_SECRET` is listed
3. **Verify** the value matches your application

### **Step 2: Test Webhook**
```bash
curl -X POST https://portal.thesmartpro.io/api/webhook/makecom \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_generated_secret_here" \
  -d '{
    "contract_id": "test-001",
    "contract_number": "TEST-001",
    "contract_type": "full-time-permanent"
  }'
```

### **Step 3: Check Application Logs**
Look for successful webhook processing in your application logs.

## 🛠️ **Alternative: Use a Simple String**

If you don't want to use organization variables, you can use a simple string directly:

### **In Make.com HTTP Module:**
```json
{
  "name": "X-Webhook-Secret",
  "value": "my_secure_webhook_secret_2024"
}
```

### **In your application .env.local:**
```bash
MAKE_WEBHOOK_SECRET=my_secure_webhook_secret_2024
```

## 🔐 **Security Best Practices**

### **1. Use Strong Secrets**
- **Length**: At least 32 characters
- **Complexity**: Mix letters, numbers, and symbols
- **Uniqueness**: Don't reuse secrets from other services

### **2. Rotate Regularly**
- **Change** the secret every 3-6 months
- **Update** both Make.com and your application
- **Test** after each rotation

### **3. Keep Secrets Secure**
- **Never** commit secrets to version control
- **Use** environment variables
- **Restrict** access to production secrets

## 🧪 **Quick Setup Script**

I'll create a script to help you generate and set up the webhook secret:
