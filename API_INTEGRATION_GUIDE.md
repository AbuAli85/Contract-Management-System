# 🔌 TheSmartPro.io Platform API Integration Guide

## 📋 Overview

This guide provides comprehensive information for integrating TheSmartPro.io platform with external systems, including marketing websites, dashboards, and third-party applications.

---

## 🔐 Authentication Methods

### **1. Session-Based Authentication (Current)**
- **Method:** Cookie-based sessions via Supabase Auth
- **Use Case:** Web applications, browser-based integrations
- **Headers Required:** 
  ```http
  Cookie: sb-<project-ref>-auth-token=<session-token>
  ```
- **How to Get:** User logs in via `/api/auth/login` endpoint

### **2. API Key Authentication (Recommended for External Integration)**
- **Status:** ✅ **IMPLEMENTED** - Ready to use!
- **How to Get:**
  - Generate via `/api/admin/api-keys` endpoint (admin only)
  - See `API_KEY_SETUP_GUIDE.md` for detailed instructions
- **Usage:**
  ```http
  Authorization: Bearer tsp_<your-api-key>
  ```
  or
  ```http
  X-API-Key: tsp_<your-api-key>
  ```

### **3. Service Role Key (Backend Only)**
- **Method:** Supabase Service Role Key
- **Use Case:** Server-to-server communication, admin operations
- **Security:** ⚠️ **NEVER expose to frontend/client-side code**
- **Location:** `SUPABASE_SERVICE_ROLE_KEY` environment variable

---

## 🌐 Available API Endpoints

### **Public Endpoints (No Authentication Required)**

#### **1. Public Statistics**
```http
GET /api/dashboard/public-stats
```

**Response:**
```json
{
  "totalContracts": 847,
  "totalPromoters": 181,
  "totalParties": 45,
  "debug": {
    "queryErrors": [],
    "timestamp": "2025-11-06T16:00:00.000Z"
  }
}
```

**Use Case:** Display platform statistics on marketing website

**Example Integration:**
```javascript
// Fetch public stats
const response = await fetch('https://portal.thesmartpro.io/api/dashboard/public-stats');
const stats = await response.json();

// Display on marketing site
document.getElementById('total-contracts').textContent = stats.totalContracts;
document.getElementById('total-promoters').textContent = stats.totalPromoters;
```

---

### **Authenticated Endpoints (Requires Session)**

#### **2. Dashboard Statistics (Full Metrics)**
```http
GET /api/dashboard/stats
```

**Headers:**
```http
Cookie: sb-<project-ref>-auth-token=<session-token>
```

**Response:**
```json
{
  "totalContracts": 847,
  "activeContracts": 523,
  "pendingContracts": 89,
  "completedContracts": 235,
  "totalPromoters": 181,
  "activePromoters": 165,
  "totalParties": 45,
  "pendingApprovals": 89,
  "contractsByStatus": {
    "active": 523,
    "pending": 89,
    "completed": 235,
    "expired": 0
  },
  "expiringDocuments": 12,
  "scope": "all",
  "scopeLabel": "All Contracts",
  "timestamp": "2025-11-06T16:00:00.000Z",
  "previousMonth": {
    "totalContracts": 820,
    "activeContracts": 510,
    "pendingContracts": 95
  }
}
```

**Use Case:** Display detailed metrics in authenticated dashboards

---

#### **3. Contracts List**
```http
GET /api/contracts?page=1&limit=20&status=all
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (`all`, `active`, `pending`, `approved`, `expired`)
- `party_id` (optional): Filter by party ID

**Response:**
```json
{
  "contracts": [
    {
      "id": "uuid",
      "contract_number": "GEN-06112025-LC6T",
      "title": "Contract Title",
      "status": "pending",
      "start_date": "2025-11-06",
      "end_date": "2027-11-05",
      "value": 250.00,
      "currency": "USD",
      "first_party": {
        "id": "uuid",
        "name_en": "Client Name",
        "name_ar": "اسم العميل",
        "crn": "1234567"
      },
      "second_party": {
        "id": "uuid",
        "name_en": "Employer Name",
        "name_ar": "اسم صاحب العمل"
      },
      "promoters": {
        "id": "uuid",
        "name_en": "Promoter Name",
        "name_ar": "اسم المروج"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 847,
    "totalPages": 43
  }
}
```

---

#### **4. Single Contract Details**
```http
GET /api/contracts/{contract_id}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": "uuid",
    "contract_number": "GEN-06112025-LC6T",
    "title": "Contract Title",
    "status": "approved",
    "contract_type": "service",
    "start_date": "2025-11-06",
    "end_date": "2027-11-05",
    "value": 250.00,
    "currency": "USD",
    "pdf_url": "https://...",
    "google_doc_url": "https://...",
    "first_party": { ... },
    "second_party": { ... },
    "promoters": { ... }
  }
}
```

---

#### **5. Promoters List**
```http
GET /api/promoters?page=1&limit=20&status=active
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status (`active`, `inactive`, `pending`)
- `employer_id`: Filter by employer

**Response:**
```json
{
  "promoters": [
    {
      "id": "uuid",
      "name_en": "Promoter Name",
      "name_ar": "اسم المروج",
      "id_card_number": "123456789",
      "passport_number": "A12345678",
      "status": "active",
      "mobile_number": "+968 1234 5678",
      "email": "promoter@example.com"
    }
  ],
  "pagination": { ... }
}
```

---

#### **6. Parties List**
```http
GET /api/parties?type=Client&page=1&limit=20
```

**Query Parameters:**
- `type`: Filter by type (`Client`, `Employer`, `Supplier`)
- `page`, `limit`: Pagination

---

#### **7. Health Check**
```http
GET /api/health-check
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T16:00:00.000Z",
  "services": {
    "database": "connected",
    "auth": "operational"
  }
}
```

---

## 📊 Available Data for Integration

### **Metrics Available:**

1. **Contract Metrics:**
   - Total contracts: `847`
   - Active contracts: `523`
   - Pending contracts: `89`
   - Completed contracts: `235`
   - Expired contracts: `0`
   - Expiring soon (within 30 days): `12`

2. **Workforce Metrics:**
   - Total promoters: `181`
   - Active promoters: `165`
   - Inactive promoters: `16`

3. **Party Metrics:**
   - Total parties: `45`
   - Clients: `X`
   - Employers: `Y`
   - Suppliers: `Z`

4. **Compliance Metrics:**
   - Documents expiring soon: `12`
   - Compliance rate: `66%` (calculated)

5. **Growth Metrics:**
   - Month-over-month growth (available via `previousMonth` in stats endpoint)

---

## 🎯 Integration Use Cases

### **1. Marketing Website Integration**

#### **Display Live Statistics:**
```html
<!-- Marketing Website HTML -->
<div class="stats-section">
  <div class="stat-card">
    <h3>Total Contracts</h3>
    <p id="total-contracts">Loading...</p>
  </div>
  <div class="stat-card">
    <h3>Active Promoters</h3>
    <p id="total-promoters">Loading...</p>
  </div>
</div>

<script>
// Fetch and display public stats
async function loadPlatformStats() {
  try {
    const response = await fetch('https://portal.thesmartpro.io/api/dashboard/public-stats');
    const stats = await response.json();
    
    document.getElementById('total-contracts').textContent = stats.totalContracts.toLocaleString();
    document.getElementById('total-promoters').textContent = stats.totalPromoters.toLocaleString();
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Load stats on page load
loadPlatformStats();

// Refresh every 5 minutes
setInterval(loadPlatformStats, 5 * 60 * 1000);
</script>
```

---

### **2. Embedded Dashboard Widget**

#### **Real-Time Metrics Widget:**
```javascript
// Widget Configuration
const widgetConfig = {
  apiUrl: 'https://portal.thesmartpro.io/api/dashboard/stats',
  refreshInterval: 60000, // 1 minute
  metrics: ['totalContracts', 'activeContracts', 'totalPromoters']
};

// Widget Implementation
class PlatformMetricsWidget {
  constructor(config) {
    this.config = config;
    this.data = null;
  }

  async fetchMetrics() {
    // Requires authentication - use API key or session
    const response = await fetch(this.config.apiUrl, {
      credentials: 'include', // Include cookies for session auth
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch metrics');
    }
    
    return await response.json();
  }

  render() {
    // Render metrics in widget
    const container = document.getElementById('metrics-widget');
    container.innerHTML = `
      <div class="metric">
        <span class="label">Total Contracts</span>
        <span class="value">${this.data.totalContracts}</span>
      </div>
      <div class="metric">
        <span class="label">Active Contracts</span>
        <span class="value">${this.data.activeContracts}</span>
      </div>
      <div class="metric">
        <span class="label">Promoters</span>
        <span class="value">${this.data.totalPromoters}</span>
      </div>
    `;
  }

  async start() {
    try {
      this.data = await this.fetchMetrics();
      this.render();
      
      // Auto-refresh
      setInterval(async () => {
        this.data = await this.fetchMetrics();
        this.render();
      }, this.config.refreshInterval);
    } catch (error) {
      console.error('Widget error:', error);
    }
  }
}

// Initialize widget
const widget = new PlatformMetricsWidget(widgetConfig);
widget.start();
```

---

### **3. Contract Creation Form Integration**

#### **Embed Contract Form:**
```html
<!-- Embed contract creation form -->
<iframe 
  src="https://portal.thesmartpro.io/en/contracts/general"
  width="100%" 
  height="800px"
  frameborder="0"
></iframe>
```

**Or use API directly:**
```javascript
// Create contract via API
async function createContract(contractData) {
  const response = await fetch('https://portal.thesmartpro.io/api/contracts/general/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'sb-<project-ref>-auth-token=<session-token>' // Requires auth
    },
    body: JSON.stringify({
      contract_type: 'general-service',
      promoter_id: 'uuid',
      first_party_id: 'uuid',
      second_party_id: 'uuid',
      job_title: 'Software Developer',
      basic_salary: 500,
      contract_start_date: '2025-11-06',
      contract_end_date: '2027-11-05'
    })
  });
  
  return await response.json();
}
```

---

## 🔒 Security Recommendations

### **For Public Endpoints:**
1. ✅ **Rate Limiting:** Implement rate limiting (recommended: 100 requests/minute per IP)
2. ✅ **CORS:** Configure CORS headers for allowed origins
3. ✅ **Caching:** Cache public stats for 5-10 minutes to reduce database load

### **For Authenticated Endpoints:**
1. ✅ **API Keys:** Implement API key authentication for external integrations
2. ✅ **JWT Tokens:** Consider JWT tokens for stateless authentication
3. ✅ **RBAC:** Ensure proper role-based access control
4. ✅ **HTTPS:** Always use HTTPS in production

---

## 🚀 Implementation Checklist

### **Phase 1: Public Stats Integration**
- [x] Public stats endpoint exists (`/api/dashboard/public-stats`)
- [ ] Add rate limiting
- [ ] Add CORS configuration
- [ ] Add caching layer
- [ ] Test on marketing website

### **Phase 2: API Key Authentication**
- [x] Create API keys table ✅
- [x] Implement API key middleware ✅
- [x] Create admin API endpoints for key management ✅
- [x] Update public stats endpoint to accept API keys ✅
- [x] Document API key usage ✅

### **Phase 3: Enhanced Public API**
- [ ] Create `/api/public/contracts` endpoint (limited data)
- [ ] Create `/api/public/promoters` endpoint (limited data)
- [ ] Add filtering and pagination
- [ ] Add API versioning (`/api/v1/...`)

### **Phase 4: Webhooks**
- [ ] Implement webhook system for real-time updates
- [ ] Support contract created/updated events
- [ ] Support promoter status changes
- [ ] Add webhook signature verification

---

## 📝 API Documentation Endpoints

### **Current Status:**
- ⚠️ **No dedicated API documentation page exists**
- ✅ **Some endpoints have inline documentation** (e.g., `/api/contracts/general/generate` GET)

### **Recommended:**
1. Create `/api/docs` endpoint with OpenAPI/Swagger documentation
2. Create `/api/health` endpoint with API status
3. Add API versioning (`/api/v1/...`)

---

## 🔧 Environment Variables Needed

### **For API Integration:**
```bash
# Public API (if implemented)
PUBLIC_API_ENABLED=true
PUBLIC_API_RATE_LIMIT=100

# API Keys (if implemented)
API_KEY_ENCRYPTION_SECRET=your-secret-key

# CORS
ALLOWED_ORIGINS=https://thesmartpro.io,https://www.thesmartpro.io

# Caching
REDIS_URL=redis://localhost:6379  # Optional, for caching
```

---

## 📞 Support & Questions

For API integration support:
1. Check existing endpoints: `https://portal.thesmartpro.io/api/health-check`
2. Review codebase: `app/api/` directory
3. Test endpoints: Use browser DevTools or Postman

---

## 🎉 Quick Start Example

### **Display Platform Stats on Marketing Site:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>TheSmartPro.io - Platform Stats</title>
</head>
<body>
  <div class="platform-stats">
    <h2>Platform Statistics</h2>
    <div class="stats-grid">
      <div class="stat">
        <h3>Total Contracts</h3>
        <p id="contracts">-</p>
      </div>
      <div class="stat">
        <h3>Active Promoters</h3>
        <p id="promoters">-</p>
      </div>
      <div class="stat">
        <h3>Total Parties</h3>
        <p id="parties">-</p>
      </div>
    </div>
  </div>

  <script>
    async function loadStats() {
      try {
        const response = await fetch('https://portal.thesmartpro.io/api/dashboard/public-stats');
        const data = await response.json();
        
        document.getElementById('contracts').textContent = data.totalContracts;
        document.getElementById('promoters').textContent = data.totalPromoters;
        document.getElementById('parties').textContent = data.totalParties;
      } catch (error) {
        console.error('Error loading stats:', error);
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

## ✅ Summary

**Available Now:**
- ✅ Public stats endpoint (`/api/dashboard/public-stats`)
- ✅ Authenticated endpoints (with session cookies)
- ✅ Contracts, Promoters, Parties APIs
- ✅ Health check endpoint

**Needs Implementation:**
- ⚠️ API key authentication
- ⚠️ Dedicated API documentation
- ⚠️ Rate limiting for public endpoints
- ⚠️ Webhook system
- ⚠️ API versioning

**Recommended Next Steps:**
1. Implement API key authentication for external integrations
2. Add rate limiting to public endpoints
3. Create comprehensive API documentation
4. Add webhook support for real-time updates

---

**Last Updated:** November 6, 2025  
**Platform Version:** 1.0.0  
**Base URL:** `https://portal.thesmartpro.io`

