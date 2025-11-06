# 🔑 API Key Setup Guide

## Quick Start: Generate Your First API Key

### **Step 1: Generate API Key via API (Admin Only)**

Since there's no admin UI yet, you can generate API keys via the API endpoint:

```bash
# 1. Login as admin and get your session cookie
# 2. Generate API key
curl -X POST https://portal.thesmartpro.io/api/admin/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project-ref>-auth-token=<your-session-token>" \
  -d '{
    "name": "Marketing Website Integration",
    "permissions": [
      "read:dashboard",
      "read:promoters",
      "read:contracts",
      "read:parties"
    ],
    "allowedOrigins": [
      "https://thesmartpro.io",
      "https://www.thesmartpro.io"
    ],
    "rateLimitPerMinute": 100,
    "expiresAt": null
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "API key created successfully",
  "apiKey": {
    "id": "uuid",
    "name": "Marketing Website Integration",
    "key": "tsp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  // ⚠️ SAVE THIS NOW!
    "keyPrefix": "tsp_",
    "permissions": ["read:dashboard", "read:promoters", "read:contracts", "read:parties"],
    "allowedOrigins": ["https://thesmartpro.io", "https://www.thesmartpro.io"],
    "rateLimitPerMinute": 100
  },
  "warning": "Save this API key now - it will not be shown again!"
}
```

⚠️ **IMPORTANT:** The full API key is only shown **once** in the response. Save it immediately!

---

### **Step 2: Use API Key in Marketing Website**

#### **Option A: Authorization Header (Recommended)**
```javascript
// Fetch enhanced stats with API key
const response = await fetch('https://portal.thesmartpro.io/api/dashboard/public-stats', {
  headers: {
    'Authorization': 'Bearer tsp_YOUR_API_KEY_HERE'
  }
});

const stats = await response.json();
console.log('Active Contracts:', stats.activeContracts);
console.log('Pending Contracts:', stats.pendingContracts);
```

#### **Option B: X-API-Key Header**
```javascript
const response = await fetch('https://portal.thesmartpro.io/api/dashboard/public-stats', {
  headers: {
    'X-API-Key': 'tsp_YOUR_API_KEY_HERE'
  }
});
```

#### **Option C: Query Parameter (Less Secure)**
```javascript
const response = await fetch('https://portal.thesmartpro.io/api/dashboard/public-stats?api_key=tsp_YOUR_API_KEY_HERE');
```

---

## 📋 Available Permissions

| Permission | Description |
|------------|-------------|
| `read:dashboard` | Read dashboard statistics |
| `read:contracts` | Read contract data |
| `read:promoters` | Read promoter data |
| `read:parties` | Read party data |
| `read:*` | Read all resources |
| `admin:manage` | Admin management access |
| `*` | Full access (use with caution) |

---

## 🔧 Managing API Keys

### **List All API Keys**
```bash
GET /api/admin/api-keys
```

### **Update API Key**
```bash
PUT /api/admin/api-keys/{id}
{
  "name": "Updated Name",
  "isActive": true,
  "permissions": ["read:dashboard", "read:contracts"]
}
```

### **Deactivate API Key**
```bash
DELETE /api/admin/api-keys/{id}
```

---

## 📊 API Endpoints

### **Base URL:**
```
https://portal.thesmartpro.io/api
```

### **Public Stats (Enhanced with API Key):**
```
GET /api/dashboard/public-stats
```

**Without API Key:**
```json
{
  "totalContracts": 847,
  "totalPromoters": 181,
  "totalParties": 45
}
```

**With API Key:**
```json
{
  "totalContracts": 847,
  "activeContracts": 523,
  "pendingContracts": 89,
  "totalPromoters": 181,
  "activePromoters": 165,
  "totalParties": 45,
  "apiKey": {
    "name": "Marketing Website Integration",
    "keyPrefix": "tsp_"
  },
  "timestamp": "2025-11-06T16:00:00.000Z"
}
```

---

## 🛡️ Security Best Practices

1. ✅ **Store API keys securely** - Never commit to version control
2. ✅ **Use environment variables** - Store keys in `.env` files
3. ✅ **Set allowed origins** - Restrict CORS to your domains
4. ✅ **Set expiration dates** - Use `expiresAt` for temporary keys
5. ✅ **Monitor usage** - Check `last_used_at` regularly
6. ✅ **Rotate keys** - Generate new keys periodically
7. ✅ **Use least privilege** - Only grant necessary permissions

---

## 📝 Example: Marketing Website Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>TheSmartPro.io - Live Platform Stats</title>
</head>
<body>
  <div class="platform-stats">
    <h2>Live Platform Statistics</h2>
    <div class="stats-grid">
      <div class="stat">
        <h3>Total Contracts</h3>
        <p id="total-contracts">-</p>
      </div>
      <div class="stat">
        <h3>Active Contracts</h3>
        <p id="active-contracts">-</p>
      </div>
      <div class="stat">
        <h3>Pending Contracts</h3>
        <p id="pending-contracts">-</p>
      </div>
      <div class="stat">
        <h3>Active Promoters</h3>
        <p id="active-promoters">-</p>
      </div>
    </div>
  </div>

  <script>
    const API_KEY = 'tsp_YOUR_API_KEY_HERE'; // Store in environment variable in production!
    const API_URL = 'https://portal.thesmartpro.io/api/dashboard/public-stats';

    async function loadStats() {
      try {
        const response = await fetch(API_URL, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const stats = await response.json();
        
        // Update UI
        document.getElementById('total-contracts').textContent = stats.totalContracts.toLocaleString();
        document.getElementById('active-contracts').textContent = stats.activeContracts?.toLocaleString() || 'N/A';
        document.getElementById('pending-contracts').textContent = stats.pendingContracts?.toLocaleString() || 'N/A';
        document.getElementById('active-promoters').textContent = stats.activePromoters?.toLocaleString() || 'N/A';
      } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback to basic stats without API key
        loadBasicStats();
      }
    }

    async function loadBasicStats() {
      try {
        const response = await fetch(API_URL);
        const stats = await response.json();
        
        document.getElementById('total-contracts').textContent = stats.totalContracts.toLocaleString();
        document.getElementById('active-contracts').textContent = 'N/A';
        document.getElementById('pending-contracts').textContent = 'N/A';
        document.getElementById('active-promoters').textContent = stats.totalPromoters.toLocaleString();
      } catch (error) {
        console.error('Error loading basic stats:', error);
      }
    }
    
    // Load on page load
    loadStats();
    
    // Refresh every 5 minutes
    setInterval(loadStats, 5 * 60 * 1000);
  </script>
</body>
</html>
```

---

## 🚨 Troubleshooting

### **Error: "API key required"**
- Make sure you're sending the API key in the `Authorization` header or `X-API-Key` header
- Check that the key starts with `tsp_`

### **Error: "Invalid API key"**
- Verify the API key is correct (no extra spaces)
- Check if the key has been deactivated
- Verify the key hasn't expired

### **Error: "Origin not allowed"**
- Check the `allowedOrigins` setting for your API key
- Make sure your domain is included in the allowed origins list

### **Error: "Insufficient permissions"**
- Verify your API key has the required permission
- Check the permissions list when creating/updating the key

---

## 📞 Support

- **API Documentation:** `https://portal.thesmartpro.io/api/docs`
- **Health Check:** `https://portal.thesmartpro.io/api/health-check`
- **Admin API Keys:** `https://portal.thesmartpro.io/api/admin/api-keys`

---

**Last Updated:** November 6, 2025

