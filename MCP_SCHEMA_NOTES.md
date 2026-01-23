# MCP Schema Notes

This document explains the schema choices and column mappings used in the MCP endpoint implementation.

## Table Selection

### Contracts Table
- **Table Name**: `contracts`
- **Location Found**: `app/api/contracts/route.ts`, `supabase/migrations/20250804_create_contracts_table.sql`
- **Selection Reason**: Most frequently used table name across the codebase (20+ references in API routes)

### Parties Table
- **Table Name**: `parties`
- **Location Found**: `app/api/contracts/route.ts`, `app/api/contracts/[id]/route.ts`
- **Selection Reason**: Used for storing contract parties (employer, client, first_party, second_party)

### Profiles Table
- **Table Name**: `profiles`
- **Location Found**: `app/api/contracts/route.ts`
- **Selection Reason**: Standard user profile table, used for DB-first context resolution

### Companies Table
- **Table Name**: `companies`
- **Location Found**: `app/api/contracts/route.ts`
- **Selection Reason**: Used for tenant isolation (companies.party_id is the tenant identifier)

## Column Mappings

### Contracts Table Mappings

| DB Column | API Contract Field | Mapping Location | Reason |
|-----------|-------------------|------------------|---------|
| `status` | `status` | `app/api/mcp/contracts/draft/route.ts` | Direct mapping |
| `metadata.template_id` | `template_id` | `app/api/mcp/contracts/draft/route.ts` | Templates are external (Make.com), stored in metadata JSONB |
| `metadata.parties` | `parties` (input) | `app/api/mcp/contracts/draft/route.ts` | Parties object stored in metadata JSONB |
| `metadata.variables` | `variables` (input) | `app/api/mcp/contracts/draft/route.ts` | Variables stored in metadata JSONB |
| `client_id` / `employer_id` | `parties` (extracted) | `app/api/mcp/contracts/draft/route.ts` | Party IDs extracted from parties object and mapped to DB columns |
| `pdf_url` | `pdf.url` | `app/api/mcp/contracts/pdf/route.ts` | Direct mapping for PDF URL |

### Profiles Table Mappings

| DB Column | Context Field | Mapping Location | Reason |
|-----------|--------------|------------------|---------|
| `active_company_id` | (intermediate) | `lib/mcp/context.ts` | Used to look up company |
| `role` | `role` | `lib/mcp/context.ts` | Direct mapping, normalized to lowercase |

### Companies Table Mappings

| DB Column | Context Field | Mapping Location | Reason |
|-----------|--------------|------------------|---------|
| `party_id` | `tenant_id` | `lib/mcp/context.ts` | Company's party_id is the tenant identifier |

## Tenant Isolation

This repository uses a multi-step tenant isolation approach:

1. **User → Company**: Users have `active_company_id` in profiles table
2. **Company → Party**: Companies have `party_id` (the company itself is a party)
3. **Contract → Party**: Contracts link to parties via `employer_id` and `client_id`
4. **Tenant Check**: Verify contract's `employer_id` or `client_id` matches company's `party_id`

The MCP context helper maps this flow:
- `user_id` → `profiles.active_company_id` → `companies.party_id` → `tenant_id` (in context)

For tenant isolation in endpoints:
- **Draft**: Verify provided party IDs match `tenant_id` (company's party_id)
- **PDF**: Verify contract's `employer_id` or `client_id` matches `tenant_id`

## Template Handling

**Important**: Templates are **external** (Make.com), not stored in the database.

- `template_id` is accepted in the API but stored in contract `metadata` JSONB column
- No `templates` table exists in the database
- Template verification is skipped (templates are external resources)
- If you add a templates table later, add verification logic in the draft endpoint

## Parties Handling

Parties are stored in the `parties` table, not as JSONB in contracts:

- **Input**: MCP accepts `parties` as an object (flexible structure)
- **Storage**: 
  - Parties object stored in `metadata.parties` JSONB
  - If `first_party_id`/`second_party_id` provided, they're extracted and mapped to `client_id`/`employer_id`
- **Tenant Isolation**: Party IDs must match `tenant_id` (company's party_id)

## Variables Handling

Variables are stored in contract `metadata` JSONB column:

- **Input**: MCP accepts `variables` as an object (flexible structure)
- **Storage**: Stored in `contracts.metadata.variables` JSONB
- **Usage**: Used by PDF generation and contract processing

## Required Columns Verified

### Contracts Table
✅ `id` (UUID, primary key)  
✅ `contract_number` (TEXT, required, unique)  
✅ `promoter_id` (UUID, required, references promoters)  
✅ `employer_id` (UUID, optional, references parties)  
✅ `client_id` (UUID, optional, references parties)  
✅ `first_party_id` (UUID, optional, references parties)  
✅ `second_party_id` (UUID, optional, references parties)  
✅ `status` (TEXT, required, default 'draft')  
✅ `metadata` (JSONB, optional, default '{}')  
✅ `pdf_url` (TEXT, optional)  

### Parties Table
✅ `id` (UUID, primary key)  
✅ `name_en` (TEXT, optional)  
✅ `name_ar` (TEXT, optional)  
✅ `crn` (TEXT, optional)  
✅ `logo_url` (TEXT, optional)  

### Profiles Table
✅ `id` (UUID, primary key, references auth.users.id)  
✅ `active_company_id` (UUID, optional)  
✅ `role` (user_role enum, required)  

### Companies Table
✅ `id` (UUID, primary key)  
✅ `party_id` (UUID, references parties.id)  

## Storage Configuration

### PDF Storage
- **Bucket Name**: `contracts`
- **Storage Path Pattern**: `tenants/{tenant_id}/contracts/{contract_id}/{filename}`
- **File Naming**: `{contract_number}.pdf` or `{contract_id}.pdf`
- **Content Type**: `application/pdf`
- **URL Generation**: Prefer signed URL (1 year expiry), fallback to public URL

## RLS Compatibility

RLS policies should exist for:
- **Profiles**: Users can read their own profile
- **Companies**: Users can read their company's data
- **Parties**: Users can read parties belonging to their company
- **Contracts**: Users can read contracts they're involved in

The implementation uses user-scoped Supabase clients (with Bearer token in headers), so RLS policies still apply and provide an additional layer of security.

## Notes

1. **No Placeholders**: All table and column names are actual values from the codebase, no placeholders used.

2. **Response Shaping**: API responses are explicitly shaped to match the contract exactly, mapping DB columns as needed and excluding sensitive fields.

3. **Template External**: Templates are external (Make.com), so `template_id` is stored in metadata, not as a foreign key.

4. **Promoter ID Required**: The `promoter_id` field is required by the database schema (NOT NULL constraint). The MCP draft endpoint requires it in the input, even though it's not in the original MCP contract. This is documented in the endpoint implementation.

5. **Tenant Isolation**: All queries enforce tenant isolation by verifying contract parties match the tenant's `party_id` (company's party_id).

6. **PDF Generation**: Uses local `generateContractPDF` function from `@/lib/pdf-generator`. PDFs are uploaded to Supabase Storage with tenant-scoped paths for security and organization.
