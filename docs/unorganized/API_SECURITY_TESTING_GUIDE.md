# 🔒 API Security Testing Guide

**Application:** Contract Management System  
**Portal:** https://portal.thesmartpro.io  
**Last Updated:** October 24, 2025

---

## 📋 Overview

This guide provides comprehensive instructions for testing the security of your API endpoints using automated tools and manual techniques. Follow these steps to identify and fix security vulnerabilities.

---

## 🛠️ Tools Setup

### 1. OWASP ZAP (Zed Attack Proxy)

#### Installation
```bash
# Windows (via Chocolatey)
choco install zap

# macOS (via Homebrew)
brew install --cask owasp-zap

# Linux (Ubuntu/Debian)
sudo snap install zaproxy --classic

# Or download from: https://www.zaproxy.org/download/
```

#### Quick Start
```bash
# Start ZAP in daemon mode for automated scanning
zap.sh -daemon -port 8080 -config api.disablekey=true

# Or use GUI mode
zap.sh
```

### 2. Burp Suite Community Edition

#### Installation
Download from: https://portswigger.net/burp/communitydownload

#### Setup
1. Install and launch Burp Suite
2. Configure browser proxy (127.0.0.1:8080)
3. Install Burp CA certificate in browser
4. Start intercepting traffic

### 3. Postman

#### Installation
Download from: https://www.postman.com/downloads/

#### Features
- API testing
- Request collections
- Environment variables
- Automated testing scripts

### 4. Command-Line Tools

```bash
# Install essential tools
npm install -g newman       # Postman CLI runner
npm install -g artillery    # Load testing
pip install httpie          # User-friendly HTTP client
```

---

## 🔍 API Endpoint Inventory

### Public Endpoints (No Authentication)
```
GET  /api/health            # Health check
POST /api/auth/signin       # User login
POST /api/auth/signup       # User registration
POST /api/auth/forgot-password
GET  /api/auth/verify-email
```

### Authenticated Endpoints
```
# Contracts
GET    /api/contracts              # List contracts
POST   /api/contracts              # Create contract
GET    /api/contracts/[id]         # Get contract
PUT    /api/contracts/[id]         # Update contract
DELETE /api/contracts/[id]         # Delete contract
POST   /api/contracts/[id]/generate-pdf

# Promoters
GET    /api/promoters              # List promoters
POST   /api/promoters              # Create promoter
GET    /api/promoters/[id]         # Get promoter
PUT    /api/promoters/[id]         # Update promoter
DELETE /api/promoters/[id]         # Delete promoter

# Dashboard
GET    /api/dashboard/analytics
GET    /api/dashboard/analytics/paginated
GET    /api/dashboard/metrics

# Webhooks
POST   /api/webhooks/payment-success
POST   /api/webhooks/makecom

# User Management
GET    /api/users                  # List users (admin only)
GET    /api/users/[id]             # Get user (admin only)
PUT    /api/users/[id]             # Update user
DELETE /api/users/[id]             # Delete user (admin only)
```

---

## 🧪 Security Test Cases

### 1. Authentication & Authorization

#### Test: Unauthenticated Access
```bash
# Should return 401 Unauthorized
curl -X GET https://portal.thesmartpro.io/api/contracts
curl -X GET https://portal.thesmartpro.io/api/promoters
curl -X GET https://portal.thesmartpro.io/api/dashboard/analytics
```

**Expected:** 401 Unauthorized  
**Risk:** High if endpoints are accessible

#### Test: Invalid Token
```bash
# Should return 401 Unauthorized
curl -X GET https://portal.thesmartpro.io/api/contracts \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected:** 401 Unauthorized  
**Risk:** High if invalid tokens are accepted

#### Test: Expired Token
```bash
# Use an expired JWT token
curl -X GET https://portal.thesmartpro.io/api/contracts \
  -H "Authorization: Bearer <expired_token>"
```

**Expected:** 401 Unauthorized  
**Risk:** High if expired tokens work

#### Test: Horizontal Privilege Escalation
```bash
# User A tries to access User B's data
# Login as User A, get their token
TOKEN_A="<user_a_token>"

# Try to access User B's contract (use User B's contract ID)
curl -X GET https://portal.thesmartpro.io/api/contracts/user_b_contract_id \
  -H "Authorization: Bearer $TOKEN_A"
```

**Expected:** 403 Forbidden or 404 Not Found  
**Risk:** Critical if User A can access User B's data

#### Test: Vertical Privilege Escalation
```bash
# Regular user tries to access admin-only endpoint
USER_TOKEN="<regular_user_token>"

curl -X GET https://portal.thesmartpro.io/api/users \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected:** 403 Forbidden  
**Risk:** Critical if regular users can access admin endpoints

### 2. Input Validation

#### Test: SQL Injection
```bash
# Test in query parameters
curl -X GET "https://portal.thesmartpro.io/api/contracts?search='; DROP TABLE contracts; --" \
  -H "Authorization: Bearer <token>"

# Test in request body
curl -X POST https://portal.thesmartpro.io/api/contracts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contract",
    "description": "1' OR '1'='1",
    "first_party_id": "1; DROP TABLE users; --"
  }'
```

**Expected:** 400 Bad Request with validation error  
**Risk:** Critical if SQL injection is possible

#### Test: XSS (Cross-Site Scripting)
```bash
# Test script injection in fields
curl -X POST https://portal.thesmartpro.io/api/promoters \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert('XSS')</script>",
    "email": "test@example.com",
    "phone": "+1234567890"
  }'
```

**Expected:** Input should be sanitized or escaped  
**Risk:** High if scripts are stored and executed

#### Test: Command Injection
```bash
# Test in file operations
curl -X POST https://portal.thesmartpro.io/api/contracts/1/generate-pdf \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "contract; rm -rf /"
  }'
```

**Expected:** 400 Bad Request with validation error  
**Risk:** Critical if command injection is possible

#### Test: NoSQL Injection
```bash
# Test MongoDB-style injection
curl -X POST https://portal.thesmartpro.io/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$ne": null},
    "password": {"$ne": null}
  }'
```

**Expected:** 400 Bad Request  
**Risk:** Critical if NoSQL injection works

### 3. Rate Limiting

#### Test: Login Rate Limiting
```bash
# Send multiple failed login attempts
for i in {1..10}; do
  curl -X POST https://portal.thesmartpro.io/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "wrong_password"
    }'
  echo "Attempt $i"
done
```

**Expected:** 429 Too Many Requests after 5 attempts  
**Risk:** Medium if no rate limiting

#### Test: API Rate Limiting
```bash
# Send rapid API requests
for i in {1..150}; do
  curl -X GET https://portal.thesmartpro.io/api/contracts \
    -H "Authorization: Bearer <token>"
done
```

**Expected:** 429 Too Many Requests after limit  
**Risk:** Medium - allows DoS attacks

### 4. CORS Testing

#### Test: Unauthorized Origin
```bash
# Request from unauthorized origin
curl -X GET https://portal.thesmartpro.io/api/contracts \
  -H "Origin: https://malicious-site.com" \
  -H "Authorization: Bearer <token>"
```

**Expected:** 403 Forbidden or no CORS headers  
**Risk:** High if any origin is allowed

#### Test: Credentials with Wildcard
```bash
# Should not be allowed: wildcard + credentials
curl -X OPTIONS https://portal.thesmartpro.io/api/contracts \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET"
```

**Expected:** Should not return `Access-Control-Allow-Origin: *` with credentials  
**Risk:** High security misconfiguration

### 5. CSRF Testing

#### Test: CSRF Token Validation
```bash
# POST without CSRF token
curl -X POST https://portal.thesmartpro.io/api/contracts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contract",
    "type": "service_provider"
  }'

# POST with invalid CSRF token
curl -X POST https://portal.thesmartpro.io/api/contracts \
  -H "Authorization: Bearer <token>" \
  -H "X-CSRF-Token: invalid_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contract",
    "type": "service_provider"
  }'
```

**Expected:** 403 Forbidden if CSRF protection is enforced  
**Risk:** High if state-changing operations don't require CSRF tokens

### 6. Mass Assignment

#### Test: Mass Assignment Vulnerability
```bash
# Try to set admin role via mass assignment
curl -X POST https://portal.thesmartpro.io/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "role": "admin",
    "is_verified": true
  }'
```

**Expected:** Role should not be assignable by users  
**Risk:** Critical if users can escalate privileges

### 7. File Upload Security

#### Test: File Type Validation
```bash
# Upload malicious file
curl -X POST https://portal.thesmartpro.io/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@malicious.php"

# Upload with wrong extension
curl -X POST https://portal.thesmartpro.io/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@script.jpg.php"
```

**Expected:** 400 Bad Request - only allowed file types  
**Risk:** Critical if arbitrary files can be uploaded

### 8. Information Disclosure

#### Test: Verbose Error Messages
```bash
# Trigger errors to check error messages
curl -X GET https://portal.thesmartpro.io/api/contracts/invalid_id \
  -H "Authorization: Bearer <token>"

# Check for stack traces
curl -X POST https://portal.thesmartpro.io/api/contracts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Expected:** Generic error messages, no stack traces  
**Risk:** Low-Medium - information leakage

#### Test: Directory Listing
```bash
# Check if directory listing is enabled
curl -X GET https://portal.thesmartpro.io/api/
curl -X GET https://portal.thesmartpro.io/.git/
curl -X GET https://portal.thesmartpro.io/.env
```

**Expected:** 404 Not Found  
**Risk:** High if sensitive files are accessible

---

## 🤖 Automated Security Scanning

### OWASP ZAP Automated Scan

```bash
# 1. Start ZAP in daemon mode
zap.sh -daemon -port 8080 -config api.disablekey=true

# 2. Run automated scan
zap-cli --zap-url http://localhost:8080 quick-scan \
  --self-contained \
  --start-options '-config api.disablekey=true' \
  https://portal.thesmartpro.io

# 3. Generate report
zap-cli --zap-url http://localhost:8080 report \
  -o zap-report.html -f html

# 4. Shutdown ZAP
zap-cli --zap-url http://localhost:8080 shutdown
```

### ZAP API Scan with Authentication

```bash
# Create context file: zap-context.xml
cat > zap-context.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<configuration>
    <context>
        <name>SmartPro Portal</name>
        <desc/>
        <inscope>true</inscope>
        <incregexes>https://portal.thesmartpro.io/api/.*</incregexes>
        <tech>
            <include>Db</include>
            <include>Db.PostgreSQL</include>
            <include>Language</include>
            <include>Language.JavaScript</include>
            <include>OS</include>
            <include>OS.Linux</include>
            <include>WS</include>
        </tech>
        <authentication>
            <type>1</type>
            <strategy>EACH_RESP</strategy>
            <pollurl/>
            <polldata/>
            <pollheaders/>
            <pollfreq>60</pollfreq>
            <pollunits>REQUESTS</pollunits>
            <form>
                <loginurl>https://portal.thesmartpro.io/api/auth/signin</loginurl>
                <loginbody>email={%username%}&amp;password={%password%}</loginbody>
                <loginpageurl/>
            </form>
        </authentication>
    </context>
</configuration>
EOF

# Run authenticated scan
zap-cli quick-scan --spider -r \
  --context-file zap-context.xml \
  https://portal.thesmartpro.io
```

### Burp Suite Automated Scan

1. **Setup Burp Project**
   - Create new project: "SmartPro API Security"
   - Configure target: https://portal.thesmartpro.io

2. **Configure Authentication**
   - Proxy > Options > Session Handling
   - Add rule: "Auto-login"
   - Action: Run macro (login sequence)

3. **Run Active Scan**
   - Right-click on /api/* requests
   - Select "Do active scan"
   - Select all insertion points
   - Enable all scan checks

4. **Review Findings**
   - Target > Site map
   - Issue activity
   - Export report (HTML/XML)

---

## 📊 Security Testing Checklist

### Authentication & Authorization
- [ ] Unauthenticated access blocked
- [ ] Invalid tokens rejected
- [ ] Expired tokens rejected
- [ ] Horizontal privilege escalation prevented
- [ ] Vertical privilege escalation prevented
- [ ] Role-based access control (RBAC) enforced
- [ ] Token refresh mechanism secure

### Input Validation
- [ ] SQL injection prevented
- [ ] NoSQL injection prevented
- [ ] XSS attacks mitigated
- [ ] Command injection prevented
- [ ] Path traversal attacks blocked
- [ ] Input length limits enforced
- [ ] Special characters sanitized

### Rate Limiting
- [ ] Login endpoint rate limited
- [ ] Password reset rate limited
- [ ] API endpoints rate limited
- [ ] File upload rate limited
- [ ] Rate limit headers present (X-RateLimit-*)

### CORS & CSRF
- [ ] CORS restricted to trusted origins
- [ ] Preflight requests handled correctly
- [ ] CSRF tokens validated
- [ ] State-changing operations protected
- [ ] Cookie security flags set

### Data Protection
- [ ] Sensitive data encrypted in transit (HTTPS)
- [ ] Passwords hashed (bcrypt/argon2)
- [ ] API keys not exposed in responses
- [ ] PII properly protected
- [ ] Credit card data not stored (if applicable)

### Error Handling
- [ ] Generic error messages
- [ ] No stack traces in production
- [ ] No database errors exposed
- [ ] Consistent error format
- [ ] Proper HTTP status codes

### File Operations
- [ ] File type validation
- [ ] File size limits
- [ ] Virus scanning (if applicable)
- [ ] Secure file storage
- [ ] No path traversal in file access

### Session Management
- [ ] Secure session tokens
- [ ] Session timeout enforced
- [ ] Logout invalidates sessions
- [ ] Concurrent session limits
- [ ] Session fixation prevented

---

## 🚀 Load & Performance Testing

### Artillery Load Test

```yaml
# artillery-config.yml
config:
  target: "https://portal.thesmartpro.io"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Spike test"
  variables:
    token: "YOUR_AUTH_TOKEN"
  
scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/api/contracts"
          headers:
            Authorization: "Bearer {{ token }}"
      - think: 2
      - get:
          url: "/api/promoters"
          headers:
            Authorization: "Bearer {{ token }}"
      - think: 2
      - get:
          url: "/api/dashboard/analytics"
          headers:
            Authorization: "Bearer {{ token }}"
```

```bash
# Run load test
artillery run artillery-config.yml

# Generate report
artillery run --output report.json artillery-config.yml
artillery report report.json
```

---

## 📝 Reporting Template

### Vulnerability Report Format

```markdown
# Security Vulnerability Report

## Summary
- **Vulnerability:** [Name]
- **Severity:** [Critical/High/Medium/Low]
- **Status:** [Open/In Progress/Resolved]
- **Discovered:** [Date]
- **Endpoint:** [URL]

## Description
[Detailed description of the vulnerability]

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Proof of Concept
```bash
# Command or code that demonstrates the vulnerability
curl -X POST https://portal.thesmartpro.io/api/...
```

## Impact
[What an attacker could do with this vulnerability]

## Remediation
[How to fix the vulnerability]

## References
- [OWASP Link]
- [CVE Link]
```

---

## 🔄 Continuous Security Testing

### GitHub Actions Integration

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run OWASP ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://portal.thesmartpro.io'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
      
      - name: Run npm audit
        run: npm audit --audit-level=high
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

---

## 📚 Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [API Security Best Practices](https://github.com/shieldfy/API-Security-Checklist)
- [Burp Suite Documentation](https://portswigger.net/burp/documentation)
- [OWASP ZAP User Guide](https://www.zaproxy.org/docs/)

---

**Next Steps:**
1. Run automated scans weekly
2. Perform manual testing monthly
3. Review and remediate findings
4. Re-test after fixes
5. Update security documentation

**Last Updated:** October 24, 2025  
**Next Scan Due:** October 31, 2025
