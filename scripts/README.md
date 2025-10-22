# Contract Management System - Scripts

## Batch PDF Generation Script

### Purpose
Generates PDFs for all contracts that are missing them by triggering the Make.com integration.

### Prerequisites
1. Environment variables must be set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MAKECOM_WEBHOOK_URL`
   - `NEXT_PUBLIC_APP_URL` (optional, defaults to localhost:3000)

2. Make.com webhook must be configured and working

### Usage

#### Dry Run (Preview what will happen):
```bash
npx tsx scripts/batch-generate-contract-pdfs.ts --dry-run
```

#### Generate PDFs for all draft contracts:
```bash
npx tsx scripts/batch-generate-contract-pdfs.ts --status=draft
```

#### Generate PDFs for first 10 contracts only:
```bash
npx tsx scripts/batch-generate-contract-pdfs.ts --limit=10
```

#### Generate PDFs for all contracts without PDFs:
```bash
npx tsx scripts/batch-generate-contract-pdfs.ts
```

#### Generate for specific status:
```bash
npx tsx scripts/batch-generate-contract-pdfs.ts --status=pending
npx tsx scripts/batch-generate-contract-pdfs.ts --status=active
npx tsx scripts/batch-generate-contract-pdfs.ts --status=draft,pending,active
```

### What It Does

1. **Fetches** all contracts without `pdf_url` in specified status
2. **Enriches** contract data with promoter, first party, and second party info
3. **Calls** the Make.com generation API endpoint for each contract
4. **Updates** contract status to 'processing' (Make.com will update to 'completed' when PDF is ready)
5. **Reports** success/failure for each contract

### Expected Timeline

- **Immediate**: Contracts get status='processing'
- **1-5 minutes**: Make.com generates PDFs
- **After completion**: Contracts get `pdf_url` and status='completed'

### Troubleshooting

#### Error: "Missing promoter data"
- Contract has no promoter assigned
- Fix: Assign a promoter to the contract before regenerating

#### Error: "HTTP 400"
- Contract missing required fields
- Check: first_party_id, second_party_id, promoter_id, start_date, end_date

#### Error: "HTTP 500"
- Make.com webhook error
- Check Make.com scenario logs
- Verify webhook URL is correct

### Monitoring Progress

Check contract status in database:
```sql
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN pdf_url IS NOT NULL THEN 1 END) as with_pdf
FROM contracts
GROUP BY status;
```

### Safety Features

- **Dry run mode**: Preview changes before applying
- **Rate limiting**: 1 second delay between requests to avoid overwhelming Make.com
- **Error handling**: Continues processing even if some contracts fail
- **Detailed logging**: Shows progress for each contract
- **Filters**: Only processes contracts with promoters

