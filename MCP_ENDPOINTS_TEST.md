# MCP Endpoints Test Examples

This document provides curl examples for testing the MCP endpoints with jq assertions to validate response contracts.

## Prerequisites

- Valid Supabase JWT token (Bearer token)
- `jq` installed for JSON validation
- Base URL: `http://localhost:3000` (or your deployment URL)

## Endpoints

### 1. POST /api/mcp/contracts/draft

#### Success Example

```bash
curl -X POST http://localhost:3000/api/mcp/contracts/draft \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Correlation-ID: test-draft-$(date +%s)" \
  -d '{
    "template_id": "00000000-0000-0000-0000-000000000000",
    "parties": {
      "first_party_id": "00000000-0000-0000-0000-000000000000",
      "second_party_id": "00000000-0000-0000-0000-000000000000"
    },
    "variables": {
      "job_title": "Software Engineer",
      "basic_salary": 5000,
      "start_date": "2025-02-01"
    },
    "promoter_id": "00000000-0000-0000-0000-000000000000"
  }' | jq '.contract | has("id") and has("status") and has("template_id") and (.status == "draft")'
```

**Expected**: `true` (validates response shape matches contract)

**Note**: Replace UUIDs with actual template_id, party IDs, and promoter_id from your database.

#### Error Example (Missing Auth)

```bash
curl -X POST http://localhost:3000/api/mcp/contracts/draft \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "00000000-0000-0000-0000-000000000000",
    "parties": {},
    "variables": {}
  }' | jq '.error | has("code") and has("message")'
```

**Expected**: `true` (validates error format)

#### Error Example (Invalid UUID)

```bash
curl -X POST http://localhost:3000/api/mcp/contracts/draft \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Correlation-ID: test-draft-invalid-uuid-$(date +%s)" \
  -d '{
    "template_id": "invalid-uuid",
    "parties": {},
    "variables": {}
  }' | jq '.error | has("code") and has("message")'
```

**Expected**: `true` (validates error format, should be VALIDATION_ERROR)

---

### 2. POST /api/mcp/contracts/pdf

#### Success Example

```bash
curl -X POST http://localhost:3000/api/mcp/contracts/pdf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Correlation-ID: test-pdf-$(date +%s)" \
  -d '{
    "contract_id": "00000000-0000-0000-0000-000000000000"
  }' | jq '.pdf | has("filename") and (has("url") or has("base64"))'
```

**Expected**: `true` (validates response shape matches contract)

**Note**: Replace UUID with actual contract_id from your database.

#### Error Example (Missing Auth)

```bash
curl -X POST http://localhost:3000/api/mcp/contracts/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "00000000-0000-0000-0000-000000000000"
  }' | jq '.error | has("code") and has("message")'
```

**Expected**: `true` (validates error format)

#### Error Example (Contract Not Found)

```bash
curl -X POST http://localhost:3000/api/mcp/contracts/pdf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Correlation-ID: test-pdf-not-found-$(date +%s)" \
  -d '{
    "contract_id": "ffffffff-ffff-ffff-ffff-ffffffffffff"
  }' | jq '.error | has("code") and has("message")'
```

**Expected**: `true` (validates error format, should be NOT_FOUND)

#### Error Example (Wrong Tenant)

```bash
curl -X POST http://localhost:3000/api/mcp/contracts/pdf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Correlation-ID: test-pdf-wrong-tenant-$(date +%s)" \
  -d '{
    "contract_id": "00000000-0000-0000-0000-000000000000"
  }' | jq '.error | has("code") and has("message")'
```

**Expected**: `true` (validates error format, should be FORBIDDEN if contract belongs to different tenant)

---

## Response Contract Validation

### Contract Draft Response

The response must have exactly this structure:
```json
{
  "contract": {
    "id": "uuid",
    "status": "draft",
    "template_id": "uuid"
  }
}
```

**jq assertion validates**:
- Root has `contract` key
- Contract has all required fields: `id`, `status`, `template_id`
- Status is exactly "draft"
- No extra sensitive fields are returned

### Contract PDF Response

The response must have exactly this structure:
```json
{
  "pdf": {
    "filename": "string",
    "url": "string (optional)",
    "base64": "string (optional)"
  }
}
```

**jq assertion validates**:
- Root has `pdf` key
- PDF has `filename` (required)
- PDF has either `url` OR `base64` (at least one)
- No extra sensitive fields are returned

### Error Response

All errors must have this structure:
```json
{
  "error": {
    "code": "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR",
    "message": "string"
  }
}
```

**jq assertion validates**:
- Root has `error` key
- Error has both `code` and `message` fields

---

## Testing Checklist

- [ ] Contract draft with valid data
- [ ] Contract draft with missing auth (should return UNAUTHORIZED)
- [ ] Contract draft with invalid UUID (should return VALIDATION_ERROR)
- [ ] Contract draft with wrong role (provider/admin only, client should get FORBIDDEN)
- [ ] Contract PDF generation with valid contract
- [ ] Contract PDF with missing auth (should return UNAUTHORIZED)
- [ ] Contract PDF with invalid UUID (should return VALIDATION_ERROR)
- [ ] Contract PDF with non-existent contract (should return NOT_FOUND)
- [ ] Contract PDF with wrong tenant (should return FORBIDDEN)
- [ ] Contract PDF with wrong role (provider/admin only, client should get FORBIDDEN)
- [ ] Verify all responses include `X-Correlation-ID` header
- [ ] Verify jq assertions pass for all success responses
- [ ] Verify jq assertions pass for all error responses

---

## Notes

1. **Template ID**: Templates are external (Make.com), so `template_id` is stored in contract `metadata` JSONB column, not as a direct foreign key.

2. **Parties**: Parties are stored in the `parties` table. The MCP endpoint accepts parties as an object and stores it in metadata, but also extracts `first_party_id` and `second_party_id` if provided to link to existing parties.

3. **Variables**: Variables are stored in contract `metadata` JSONB column.

4. **Tenant Isolation**: All queries are filtered by `party_id` (mapped to `tenant_id` in context) to ensure tenant isolation. Contracts must have `employer_id` or `client_id` matching the tenant's `party_id`.

5. **RLS Compatibility**: The implementation uses user-scoped Supabase clients, so RLS policies still apply. Ensure your RLS policies allow users to read their own profile and company data.

6. **PDF Generation**: Uses local `generateContractPDF` function from `@/lib/pdf-generator`. PDFs are uploaded to Supabase Storage with tenant-scoped path: `tenants/{tenant_id}/contracts/{contract_id}/{filename}`.

7. **Promoter ID**: Required by database schema. Must be provided in the draft creation request.
