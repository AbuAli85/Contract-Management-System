# Security Notes

This document tracks known security considerations and their mitigations.

## Known Dependency Vulnerabilities

### xlsx (SheetJS) - High Severity

**Status**: Known vulnerability, no fix available
**Advisory**:

- [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6) - Prototype Pollution
- [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9) - ReDoS

**Usage**: `components/excel-import-modal.tsx` for Excel file imports

**Mitigations**:

1. File uploads are restricted to admin users only
2. File type validation is performed before parsing
3. Input is validated after parsing
4. Consider alternative libraries:
   - [exceljs](https://www.npmjs.com/package/exceljs) - More actively maintained
   - [xlsx-populate](https://www.npmjs.com/package/xlsx-populate) - Actively maintained fork

**Recommendation**: Replace xlsx with exceljs when time permits.

## Security Headers

The application implements comprehensive security headers:

| Header                    | Value                                        | Purpose               |
| ------------------------- | -------------------------------------------- | --------------------- |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | Force HTTPS           |
| X-Frame-Options           | DENY                                         | Prevent clickjacking  |
| X-Content-Type-Options    | nosniff                                      | Prevent MIME sniffing |
| Referrer-Policy           | strict-origin-when-cross-origin              | Control referrer info |
| Content-Security-Policy   | See next.config.js                           | XSS protection        |

## CSP Configuration

Current CSP includes `'unsafe-inline'` and `'unsafe-eval'` which are needed for Next.js functionality.

**Infrastructure for nonce-based CSP is available at:**

- `lib/security/csp-nonce.ts` - Nonce generation
- `lib/security/nonce-context.tsx` - React context for nonces

To upgrade to nonce-based CSP:

1. Update middleware to generate nonces
2. Pass nonces through context
3. Add nonce attributes to all inline scripts
4. Remove `'unsafe-inline'` from CSP

## Authentication Security

- Passwords are hashed using Supabase Auth (bcrypt)
- Session tokens are httpOnly cookies
- CSRF protection in middleware
- Rate limiting on auth endpoints
- Account lockout after failed attempts

## API Security

- All API routes require authentication
- RBAC permission checks
- Input validation using zod schemas
- Output sanitization
- Rate limiting

## File Upload Security

- File type validation (MIME type check)
- File size limits
- Virus scanning (TODO)
- Storage in Supabase with RLS

## Environment Variables

Sensitive environment variables that must be protected:

```
SUPABASE_SERVICE_ROLE_KEY    # Full database access
RESEND_API_KEY               # Email sending
MAKE_WEBHOOK_SECRET          # Webhook authentication
CSRF_SECRET                  # CSRF token signing
DATA_ENCRYPTION_KEY          # Data encryption
```

These should:

1. Never be committed to git
2. Be rotated regularly
3. Have different values per environment
4. Be stored in a secrets manager in production

## Regular Security Tasks

- [ ] Run `npm audit` weekly
- [ ] Review Supabase RLS policies monthly
- [ ] Rotate API keys quarterly
- [ ] Review access logs monthly
- [ ] Test security headers quarterly

## Incident Response

If a security issue is discovered:

1. **Assess** - Determine scope and severity
2. **Contain** - Revoke compromised credentials
3. **Investigate** - Review logs and identify root cause
4. **Remediate** - Fix the vulnerability
5. **Communicate** - Notify affected users if needed
6. **Document** - Add to this security notes file

## Reporting Security Issues

Report security vulnerabilities to: security@thesmartpro.io

Do not disclose vulnerabilities publicly until they are fixed.
