# Make.com Integration Quick Reference

## 🔗 Essential URLs

### Webhook Endpoint

```
https://hook.eu2.make.com/2640726
```

### Database Endpoints

```
GET: https://ekdjxzhujettocosgzql.supabase.co/rest/v1/contracts
PATCH: https://ekdjxzhujettocosgzql.supabase.co/rest/v1/contracts
```

### Storage Bucket

```
https://ekdjxzhujettocosgzql.supabase.co/storage/v1/object/public/contracts/
```

## 📋 Module Reference

| ID  | Module           | Purpose               | Status |
| --- | ---------------- | --------------------- | ------ |
| 1   | Webhook          | Receive contract data | ✅     |
| 2   | HTTP GET         | Verify contract in DB | ✅     |
| 3   | Feeder           | Process contract data | ✅     |
| 4   | HTTP GET         | Download ID card      | ⚠️     |
| 5   | Drive Upload     | Upload ID card        | ✅     |
| 6   | HTTP GET         | Download passport     | ⚠️     |
| 7   | Drive Upload     | Upload passport       | ✅     |
| 8   | Docs Template    | Generate contract     | ⚠️     |
| 9   | Docs Export      | Export to PDF         | ✅     |
| 10  | Supabase Upload  | Store PDF             | ✅     |
| 11  | HTTP PATCH       | Update DB             | ✅     |
| 12  | Webhook Response | Success response      | ✅     |
| 13  | HTTP PATCH       | Error update          | ✅     |
| 14  | Webhook Response | Error response        | ✅     |

## 🔧 Common Issues & Solutions

### Image Not Appearing in PDF

```bash
# Check image URL accessibility
curl -I "{{image_url}}"

# Verify Google Drive permissions
# Check image replacement logic in Module 8
```

### Template Placeholders Not Replaced

```json
// Verify placeholder names match exactly
{
  "text": "ref_number",
  "replaceText": "{{1.contract_number}}"
}
```

### Database Update Failed

```sql
-- Check contract exists
SELECT * FROM contracts
WHERE contract_number = '{{contract_number}}'
AND is_current = true;

-- Verify API keys
-- Check database permissions
```

### Webhook No Response

```bash
# Test webhook endpoint
curl -X POST https://hook.eu2.make.com/2640726 \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 📊 Status Codes

| Status       | Description            | Action               |
| ------------ | ---------------------- | -------------------- |
| `draft`      | Initial state          | Ready for generation |
| `pending`    | Queued for processing  | Monitor progress     |
| `processing` | Currently generating   | Wait for completion  |
| `generated`  | Successfully completed | ✅ Success           |
| `failed`     | Generation failed      | Check error_message  |
| `rejected`   | Manually rejected      | Review and retry     |

## 🔐 API Keys (Environment Variables)

```bash
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📁 Google Drive Folders

| Purpose             | Folder ID                                      |
| ------------------- | ---------------------------------------------- |
| Contract Templates  | `1WoJfPb62ILAKaMT1jEjXH3zwjfkXmg3a`            |
| Generated Contracts | `1tBNSMae1HsHxdq8WjMaoeuhn6WAPTpvP`            |
| Template Document   | `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0` |

## 🧪 Test Data

```json
{
  "contract_number": "TEST-001",
  "promoter_name_en": "John Doe",
  "promoter_name_ar": "جون دو",
  "first_party_name_en": "Company A",
  "second_party_name_en": "Company B",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "promoter_id_card_url": "https://example.com/id-card.jpg",
  "promoter_passport_url": "https://example.com/passport.jpg"
}
```

## 📞 Emergency Contacts

| Service            | Contact                                     |
| ------------------ | ------------------------------------------- |
| Make.com Support   | https://www.make.com/en/help                |
| Google API Support | https://developers.google.com/apis-explorer |
| Supabase Support   | https://supabase.com/support                |

## 🔄 Recovery Procedures

### Scenario Failure

1. Check Make.com execution logs
2. Verify API connections
3. Test individual modules
4. Restore from backup if needed

### Database Issues

```sql
-- Reset failed contracts
UPDATE contracts
SET status = 'pending',
    error_message = NULL,
    generation_attempts = 0
WHERE status = 'failed';
```

### File Storage Issues

1. Check Supabase storage bucket
2. Verify file permissions
3. Re-upload missing files
4. Update database records

## 📈 Performance Metrics

| Metric             | Target | Current |
| ------------------ | ------ | ------- |
| Success Rate       | >95%   | Monitor |
| Avg Execution Time | <60s   | Monitor |
| Error Rate         | <5%    | Monitor |
| API Quota Usage    | <80%   | Monitor |

## 🛠️ Maintenance Tasks

### Daily

- [ ] Check execution logs
- [ ] Monitor error rates
- [ ] Verify webhook responses

### Weekly

- [ ] Review performance metrics
- [ ] Check API quota usage
- [ ] Update documentation

### Monthly

- [ ] Security review
- [ ] Performance optimization
- [ ] Backup verification

---

_Last Updated: January 2025_
_Version: 2.0_
