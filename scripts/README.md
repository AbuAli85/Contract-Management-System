# 🔧 Scripts Directory

This directory contains utility scripts for security verification and testing.

---

## 🛡️ Security Header Verification Scripts

### Purpose
These scripts verify that all required security headers are properly configured on your production portal after deployment.

### Available Scripts

#### 1. PowerShell Script (Windows)
**File:** `verify-security-headers.ps1`

**Usage:**
```powershell
# Default URL (https://portal.thesmartpro.io/en/dashboard)
.\scripts\verify-security-headers.ps1

# Custom URL
.\scripts\verify-security-headers.ps1 -Url "https://portal.thesmartpro.io"
```

**Requirements:**
- Windows PowerShell 5.1 or higher
- Internet connection

#### 2. Bash Script (Linux/macOS/Git Bash)
**File:** `verify-security-headers.sh`

**Usage:**
```bash
# Make executable (first time only)
chmod +x scripts/verify-security-headers.sh

# Default URL
./scripts/verify-security-headers.sh

# Custom URL
./scripts/verify-security-headers.sh https://portal.thesmartpro.io
```

**Requirements:**
- Bash shell
- `curl` command
- Internet connection

---

## 📊 What These Scripts Check

### Critical Security Headers
- ✅ **Strict-Transport-Security** - HTTPS enforcement
- ✅ **Content-Security-Policy** - XSS protection
- ✅ **X-Frame-Options** - Clickjacking protection
- ✅ **X-Content-Type-Options** - MIME-type sniffing protection

### Cross-Origin Isolation
- ✅ **Cross-Origin-Embedder-Policy** - Resource isolation
- ✅ **Cross-Origin-Opener-Policy** - Window isolation
- ✅ **Cross-Origin-Resource-Policy** - Resource access control

### Privacy & Permissions
- ✅ **Referrer-Policy** - Referrer information control
- ✅ **Permissions-Policy** - Browser feature control

### Additional Headers
- ✅ **X-DNS-Prefetch-Control** - DNS prefetching
- ✅ **X-XSS-Protection** - Legacy XSS protection (if present)

### CORS Configuration
- ✅ **Access-Control-Allow-Origin** - Origin restriction verification

---

## 🎯 Output Interpretation

### Success Output
```
========================================
🎉 ALL SECURITY HEADERS CONFIGURED! 🎉
========================================

Your security posture is excellent!
```

**Action:** No action needed. All headers are properly configured.

### Warning Output
```
========================================
⚠️  SOME HEADERS NEED ATTENTION  ⚠️
========================================

Please review the warnings above.
```

**Action:** Review warnings. Headers are present but may have unexpected values.

### Failure Output
```
========================================
❌  CRITICAL HEADERS MISSING  ❌
========================================

Please fix the failed checks above.
```

**Action:** Critical headers are missing. Review configuration and redeploy.

---

## 🔍 Example Output

```
========================================
Security Headers Verification
========================================

Testing URL: https://portal.thesmartpro.io/en/dashboard

Fetching headers...

========================================
Critical Security Headers
========================================

✓ Strict-Transport-Security: OK
  → max-age=63072000; includeSubDomains; preload
✓ Content-Security-Policy: OK
  → default-src 'self'; script-src 'self' 'unsafe-eval'...
✓ X-Frame-Options: OK
  → DENY
✓ X-Content-Type-Options: OK
  → nosniff

========================================
Summary
========================================

Total Checks: 12
Passed: 12
Failed: 0
Warnings: 0

========================================
🎉 ALL SECURITY HEADERS CONFIGURED! 🎉
========================================
```

---

## 🚀 When to Run These Scripts

### After Initial Deployment
Run immediately after deploying the security header changes to verify they're working.

### Regular Checks
Run weekly or monthly to ensure headers remain properly configured.

### After Configuration Changes
Run after any changes to:
- `next.config.js`
- `vercel.json`
- `middleware.ts`
- Vercel environment variables

### Before Production Releases
Include in your release checklist to verify security posture.

---

## 🛠️ Troubleshooting

### Script Won't Run (PowerShell)

**Error:** "Execution policy prevents script from running"

**Solution:**
```powershell
# Allow script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass
powershell -ExecutionPolicy Bypass -File .\scripts\verify-security-headers.ps1
```

### Script Won't Run (Bash)

**Error:** "Permission denied"

**Solution:**
```bash
# Make script executable
chmod +x scripts/verify-security-headers.sh

# Then run it
./scripts/verify-security-headers.sh
```

### Headers Not Found

**Possible Causes:**
1. Changes not deployed to Vercel yet
2. Vercel deployment failed
3. Caching issues (wait a few minutes)
4. Wrong URL being tested

**Solution:**
```bash
# Check Vercel deployment status
vercel ls

# Force fresh deployment
vercel --prod --force

# Clear Vercel cache
vercel --prod --force --no-cache
```

### CORS Test Fails

**Expected Behavior:**
- CORS test should show "No Access-Control-Allow-Origin header" for unauthorized origins
- This is correct behavior and indicates good security

**Unexpected Behavior:**
- If CORS allows `*` (wildcard), this is a security issue
- Review `middleware.ts` and `next.config.js`

---

## 📚 Related Documentation

After running these scripts, also verify with online tools:

1. **SecurityHeaders.com**
   ```
   https://securityheaders.com/?q=https://portal.thesmartpro.io
   ```
   Expected Grade: A or A+

2. **SSL Labs**
   ```
   https://www.ssllabs.com/ssltest/analyze.html?d=portal.thesmartpro.io
   ```
   Expected Grade: A or A+

3. **Mozilla Observatory**
   ```
   https://observatory.mozilla.org/analyze/portal.thesmartpro.io
   ```
   Expected Score: 90+

---

## 🔗 Additional Resources

- **SECURITY_HEADERS_IMPLEMENTATION.md** - Complete security headers guide
- **SESSION_SECURITY_CHECKLIST.md** - Session security verification
- **API_SECURITY_TESTING_GUIDE.md** - Comprehensive API testing procedures
- **SECURITY_IMPROVEMENTS_SUMMARY.md** - Overall security improvements summary

---

## 💡 Tips

1. **Run Locally First**
   - Test against localhost before production
   - Helps identify CSP violations early

2. **Save Output**
   ```powershell
   # PowerShell
   .\scripts\verify-security-headers.ps1 | Tee-Object -FilePath security-report.txt
   ```
   ```bash
   # Bash
   ./scripts/verify-security-headers.sh | tee security-report.txt
   ```

3. **Automate in CI/CD**
   ```yaml
   # GitHub Actions example
   - name: Verify Security Headers
     run: |
       chmod +x scripts/verify-security-headers.sh
       ./scripts/verify-security-headers.sh https://portal.thesmartpro.io
   ```

4. **Monitor Regularly**
   - Set up a weekly reminder to run these scripts
   - Document any changes in configuration
   - Track security score over time

---

**Last Updated:** October 24, 2025  
**Maintainer:** Development Team
