# 🛡️ RBAC Production Runbook

**Version**: 1.0  
**Last Updated**: 2025-08-11  
**Status**: Production Ready

## 📋 Table of Contents

1. [Quick Reference](#quick-reference)
2. [Emergency Procedures](#emergency-procedures)
3. [Routine Operations](#routine-operations)
4. [Troubleshooting](#troubleshooting)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Security Considerations](#security-considerations)

---

## 🚀 Quick Reference

### Essential Commands
```bash
# Check RBAC health
npm run rbac:drift      # Permission drift analysis
npm run rbac:lint       # Guard compliance check
npm run rbac:test       # Full test suite
npm run rbac:check      # Database permission status

# Fix issues
npm run rbac:fix:simple # Apply permission fixes
npm run rbac:help       # Get setup guidance
```

### Status Indicators
- **✅ HEALTHY**: 0 P0 issues, 100% guard compliance
- **⚠️ WARNING**: P2 issues detected, no P0 issues
- **🚨 CRITICAL**: P0 issues detected, immediate action required

---

## 🚨 Emergency Procedures

### RBAC System Down
**Symptoms**: Users cannot access protected resources, 403 errors everywhere

**Immediate Actions**:
1. **Assess Scope**: Check if it's global or specific endpoints
2. **Check Database**: Verify permissions table is accessible
3. **Emergency Bypass**: If needed, temporarily disable RBAC enforcement
4. **Rollback**: Revert to last known good state

**Emergency Commands**:
```bash
# Quick health check
npm run rbac:check

# Emergency permission restore
npm run rbac:fix:simple

# Verify restoration
npm run rbac:drift
```

### Permission Drift Detected
**Symptoms**: P0 critical issues found, runtime errors

**Immediate Actions**:
1. **Stop Deployments**: Halt any ongoing deployments
2. **Assess Impact**: Determine which permissions are affected
3. **Apply Fixes**: Use automated fix scripts
4. **Verify Resolution**: Confirm 0 P0 issues

**Fix Commands**:
```bash
# Apply all permission fixes
npm run rbac:fix:simple

# Verify no P0 issues remain
npm run rbac:drift

# Test critical paths
npm run rbac:test
```

---

## 🔧 Routine Operations

### Daily Health Check
```bash
# Morning health check
npm run rbac:drift
npm run rbac:lint

# Expected output: 0 P0 issues, 100% guard compliance
```

### Weekly Deep Dive
```bash
# Comprehensive analysis
npm run rbac:test
npm run rbac:check

# Review reports
cat docs/rbac_drift_report.md
cat docs/rbac_guard_lint.md
```

### Monthly Maintenance
1. **Review Unused Permissions**: Identify P2 issues for cleanup
2. **Audit Role Assignments**: Verify role-permission relationships
3. **Update Documentation**: Sync endpoint mapping with implementation
4. **Performance Review**: Check RBAC enforcement overhead

---

## 🔍 Troubleshooting

### Common Issues & Solutions

#### Issue: "Permission Denied" Errors
**Symptoms**: Users getting 403 errors on previously working endpoints

**Diagnosis**:
```bash
# Check if permission exists in database
npm run rbac:check

# Verify permission is seeded
npm run rbac:drift
```

**Solutions**:
1. **Permission Missing**: Run `npm run rbac:fix:simple`
2. **Role Not Assigned**: Check user role assignments
3. **Guard Missing**: Verify endpoint has `withRBAC` wrapper

#### Issue: New Endpoint Not Working
**Symptoms**: New API endpoint returns 403 errors

**Diagnosis**:
```bash
# Check if endpoint is properly guarded
npm run rbac:lint

# Verify permission exists
npm run rbac:drift
```

**Solutions**:
1. **Add Guard**: Wrap handler with `withRBAC('permission:name')`
2. **Create Permission**: Add to database via fix script
3. **Assign Role**: Give users appropriate roles

#### Issue: Performance Degradation
**Symptoms**: Slow API responses, high latency

**Diagnosis**:
```bash
# Check permission count
npm run rbac:check

# Review guard complexity
npm run rbac:lint
```

**Solutions**:
1. **Optimize Queries**: Review permission lookup queries
2. **Cache Permissions**: Implement permission caching
3. **Reduce Complexity**: Simplify complex permission checks

### Debug Mode
```bash
# Enable debug logging
export RBAC_DEBUG=true
npm run rbac:drift

# Check environment variables
npm run rbac:help
```

---

## 📊 Monitoring & Alerts

### Automated Monitoring
- **CI Gate**: Runs on every PR to main branch
- **Scheduled Monitor**: Every 6 hours during business days
- **Artifact Storage**: All reports stored in workflow artifacts

### Alert Conditions
- **🚨 CRITICAL**: P0 issues detected
- **⚠️ WARNING**: P2 issues detected
- **✅ HEALTHY**: All checks passed

### Manual Monitoring
```bash
# Real-time status check
npm run rbac:drift

# Guard compliance check
npm run rbac:lint

# Full system test
npm run rbac:test
```

---

## 🔐 Security Considerations

### Access Control
- **Service Role Key**: Only for administrative operations
- **Environment Variables**: Never commit secrets to repository
- **Principle of Least Privilege**: Minimal required permissions

### Audit Trail
- **All Changes Logged**: Permission modifications tracked
- **User Actions Logged**: Access attempts and results
- **Compliance Reports**: Regular security assessments

### Emergency Access
- **Break Glass**: Emergency bypass procedures documented
- **Escalation Path**: Clear escalation for security incidents
- **Recovery Procedures**: Documented recovery steps

---

## 🔄 Flip Modes

### Enforcement Modes
The RBAC system operates in two modes that can be flipped via environment variables:

#### **ENFORCE Mode** (Production)
- **Variable**: `RBAC_ENFORCEMENT=enforce`
- **Behavior**: Strict permission enforcement, all checks active
- **Use Case**: Production environments, security-critical operations
- **Commands**: `npm run rbac:flip:enforce`

#### **DRY-RUN Mode** (Testing/Development)
- **Variable**: `RBAC_ENFORCEMENT=dry-run`
- **Behavior**: Permission checks logged but not enforced
- **Use Case**: Development, testing, debugging
- **Commands**: `npm run rbac:flip:dryrun`

### Mode Switching
```bash
# Switch to enforce mode
export RBAC_ENFORCEMENT=enforce
npm run rbac:test

# Switch to dry-run mode
export RBAC_ENFORCEMENT=dry-run
npm run rbac:test
```

---

## 🚨 Break-Glass Procedures

### Emergency RBAC Bypass
**Use when**: RBAC system is completely down, security incident, or emergency access required

#### **Immediate Actions**
1. **Stop the Clock**: Document exact time of bypass activation
2. **Assess Impact**: Determine scope of affected systems
3. **Notify Security**: Alert security team immediately
4. **Activate Bypass**: Set emergency bypass flag

#### **Bypass Activation**
```bash
# Emergency bypass (use only in dire circumstances)
export RBAC_EMERGENCY_BYPASS=true
export RBAC_BYPASS_REASON="Emergency access required - [REASON]"
export RBAC_BYPASS_AUTHORIZED_BY="[NAME]"

# Restart application with bypass active
npm run start:emergency
```

#### **Bypass Deactivation**
```bash
# Remove bypass when emergency is resolved
unset RBAC_EMERGENCY_BYPASS
unset RBAC_BYPASS_REASON
unset RBAC_BYPASS_AUTHORIZED_BY

# Restart normal application
npm run start
```

#### **Post-Bypass Actions**
1. **Audit Trail**: Review all actions taken during bypass
2. **Security Review**: Investigate root cause of RBAC failure
3. **Documentation**: Complete incident report
4. **Recovery**: Restore RBAC system to full operation

---

## 📊 Monitoring Queries

### Key Performance Indicators
Monitor these queries regularly to ensure RBAC system health:

#### **Permission Check Performance**
```sql
-- Average response time for permission checks
SELECT 
  AVG(EXTRACT(EPOCH FROM (end_time - start_time)) * 1000) as avg_ms,
  COUNT(*) as total_checks
FROM audit_logs 
WHERE event_type = 'PERMISSION_CHECK' 
  AND timestamp >= now() - interval '1 hour';
```

#### **Permission Denial Trends**
```sql
-- Permission denials over time
SELECT 
  date_trunc('hour', timestamp) as hour,
  COUNT(*) as denials
FROM audit_logs 
WHERE event_type = 'PERMISSION_CHECK' 
  AND result = 'DENIED'
  AND timestamp >= now() - interval '24 hours'
GROUP BY 1 
ORDER BY 1;
```

#### **Role Assignment Status**
```sql
-- Users without role assignments
SELECT 
  u.email,
  u.created_at,
  COUNT(ur.role_id) as role_count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.created_at
HAVING COUNT(ur.role_id) = 0
ORDER BY u.created_at DESC;
```

#### **Permission Usage Patterns**
```sql
-- Most frequently checked permissions
SELECT 
  permission_name,
  COUNT(*) as check_count,
  AVG(EXTRACT(EPOCH FROM (end_time - start_time)) * 1000) as avg_ms
FROM audit_logs 
WHERE event_type = 'PERMISSION_CHECK'
  AND timestamp >= now() - interval '7 days'
GROUP BY permission_name
ORDER BY check_count DESC
LIMIT 10;
```

---

## 🚨 Alert Thresholds

### Critical Alerts (Immediate Action Required)
- **P0 Issues**: > 0 (zero tolerance)
- **Guard Compliance**: < 100% for critical paths
- **Permission Check Failures**: > 5% error rate
- **Response Time**: > 100ms average
- **Emergency Bypass**: Any activation

### Warning Alerts (Review Required)
- **P2 Issues**: > 10 unused permissions
- **Performance Degradation**: > 50ms average response time
- **Permission Denials**: > 20% of total checks
- **Role Assignment Gaps**: > 5% of users without roles

### Monitoring Queries for Alerts
```sql
-- P0 Issues Check
SELECT COUNT(*) as p0_count
FROM permissions p
WHERE p.name IN (
  SELECT DISTINCT permission_name 
  FROM code_guards
) 
AND p.name NOT IN (
  SELECT name FROM seeded_permissions
);

-- Guard Compliance Check
SELECT 
  (COUNT(CASE WHEN has_guard = true THEN 1 END) * 100.0 / COUNT(*)) as compliance_percent
FROM api_endpoints 
WHERE is_critical = true;

-- Performance Alert Check
SELECT 
  AVG(EXTRACT(EPOCH FROM (end_time - start_time)) * 1000) as avg_ms
FROM audit_logs 
WHERE event_type = 'PERMISSION_CHECK'
  AND timestamp >= now() - interval '15 minutes';
```

---

## 🔗 Webhook & Upload Notes

### Webhook Security
- **Authentication**: All webhooks must include valid API keys
- **Rate Limiting**: Implement per-source rate limiting
- **Validation**: Verify webhook payload integrity
- **Logging**: Log all webhook attempts and results

### File Upload Security
- **Permission Checks**: Verify upload permissions before processing
- **File Validation**: Validate file types, sizes, and content
- **Quarantine**: Implement file quarantine for suspicious uploads
- **Audit Trail**: Log all file upload attempts and access

### Security Commands
```bash
# Check webhook security status
npm run security:webhook:check

# Validate file upload permissions
npm run security:upload:validate

# Review security logs
npm run security:logs:review
```

---

## 📞 Support & Escalation

### Level 1: Self-Service
- Use runbook procedures
- Run diagnostic commands
- Apply automated fixes

### Level 2: Team Support
- Review complex issues
- Analyze permission patterns
- Coordinate role assignments

### Level 3: Security Team
- Security incident response
- Compliance violations
- System-wide RBAC issues

### Emergency Contacts
- **Security Lead**: [Contact Information]
- **DevOps Lead**: [Contact Information]
- **On-Call Engineer**: [Contact Information]

---

## 📚 Additional Resources

### Documentation
- [RBAC Endpoint Mapping](./rbac_endpoint_mapping.md)
- [RBAC Drift Report](./rbac_drift_report.md)
- [RBAC Guard Lint Report](./rbac_guard_lint.md)

### Scripts
- [RBAC Drift Check](../scripts/rbac_drift_check.ts)
- [RBAC Guard Lint](../scripts/rbac_guard_lint.ts)
- [RBAC Test Suite](../scripts/rbac_test.ts)
- [Permission Fixes](../scripts/apply_rbac_fixes_simple.js)

### Workflows
- [RBAC Gate](../.github/workflows/rbac-gate.yml)
- [RBAC Monitor](../.github/workflows/rbac-monitor.yml)

---

## 🔄 Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-08-11 | 1.0 | Initial production runbook |

---

**⚠️ Important**: This runbook is a living document. Update it whenever procedures change or new issues are discovered.

**📞 Questions**: Contact the security team for clarification on any procedures.
