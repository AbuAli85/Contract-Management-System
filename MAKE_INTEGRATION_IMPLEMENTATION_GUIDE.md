# Make.com Integration Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the enhanced Make.com integration for contract generation in your Contract Management System.

## Prerequisites

### 1. Make.com Account Setup
- Active Make.com account with appropriate plan
- Access to create and manage scenarios
- API connections configured for:
  - Google Drive
  - Google Docs
  - Supabase
  - HTTP requests

### 2. Database Preparation
Run the following SQL script to prepare your database:

```sql
-- Add required columns for Make.com integration
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS google_drive_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS makecom_webhook_response TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS generation_attempts INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS last_generation_attempt TIMESTAMPTZ;

-- Update status constraint to include 'failed' status
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
    CHECK (status IN ('draft', 'pending', 'processing', 'active', 'expired', 'generated', 'soon-to-expire', 'approved', 'rejected', 'failed'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_error_message ON contracts(error_message);
CREATE INDEX IF NOT EXISTS idx_contracts_generation_attempts ON contracts(generation_attempts);
CREATE INDEX IF NOT EXISTS idx_contracts_last_generation_attempt ON contracts(last_generation_attempt);
```

## Step-by-Step Implementation

### Step 1: Environment Variables Setup

Create environment variables in Make.com for secure API key management:

1. Go to Make.com Settings → Environment Variables
2. Add the following variables:

```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4emh1amV0dG9jb3NzenFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTkxMDYsImV4cCI6MjA2NDg5NTEwNn0.6VGbocKFVLNX_MCIOwFtdEssMk6wd_UQ5yNT1CfV6BA

SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4emh1amV0dG9jb3NzenFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMxOTEwNiwiZXhwIjoyMDY0ODk1MTA2fQ.dAf5W8m9Q8FGlLY19Lo2x8JYSfq3RuFMAsHaPcH3F7A
```

### Step 2: API Connections Configuration

#### Google Drive Connection
1. Create a new Google Drive connection
2. Use service account credentials for restricted access
3. Grant access to specific folders:
   - Contract templates: `1WoJfPb62ILAKaMT1jEjXH3zwjfkXmg3a`
   - Generated contracts: `1tBNSMae1HsHxdq8WjMaoeuhn6WAPTpvP`

#### Google Docs Connection
1. Create a new Google Docs connection
2. Use the same service account as Google Drive
3. Ensure access to template document: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`

#### Supabase Connection
1. Create a new Supabase connection
2. Use the service role key for database operations
3. Configure storage bucket access for 'contracts' bucket

### Step 3: Scenario Import

1. Import the improved scenario from `IMPROVED_MAKE_SCENARIO.json`
2. Update the webhook URL in your application to point to the new scenario
3. Test the webhook endpoint

### Step 4: Template Configuration

Ensure your Google Docs template has the correct placeholders:

#### Text Placeholders
- `ref_number` - Contract number
- `first_party_name_en` - First party name (English)
- `first_party_name_ar` - First party name (Arabic)
- `first_party_crn` - First party CRN
- `second_party_name_en` - Second party name (English)
- `second_party_name_ar` - Second party name (Arabic)
- `second_party_crn` - Second party CRN
- `promoter_name_en` - Promoter name (English)
- `promoter_name_ar` - Promoter name (Arabic)
- `id_card_number` - ID card number
- `contract_start_date` - Contract start date (DD-MM-YYYY)
- `contract_end_date` - Contract end date (DD-MM-YYYY)

#### Image Placeholders
- `ID_CARD_IMAGE` - ID card image placeholder
- `PASSPORT_IMAGE` - Passport image placeholder

## Testing and Validation

### 1. Unit Testing

Test each module individually:

```bash
# Test webhook endpoint
curl -X POST https://hook.eu2.make.com/your-webhook-url \
  -H "Content-Type: application/json" \
  -d '{
    "contract_number": "TEST-001",
    "promoter_name_en": "John Doe",
    "promoter_name_ar": "جون دو",
    "first_party_name_en": "Company A",
    "second_party_name_en": "Company B",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "promoter_id_card_url": "https://example.com/id-card.jpg",
    "promoter_passport_url": "https://example.com/passport.jpg"
  }'
```

### 2. Integration Testing

1. **Database Verification**: Ensure contract exists in database
2. **Image Processing**: Test image download and upload
3. **Document Generation**: Verify template population
4. **PDF Export**: Confirm PDF generation
5. **File Storage**: Test Supabase upload
6. **Database Update**: Verify status updates

### 3. Error Scenario Testing

Test the following error scenarios:

1. **Invalid contract number**: Should return 404
2. **Missing images**: Should continue without images
3. **Template errors**: Should handle gracefully
4. **Storage failures**: Should update error status
5. **Network timeouts**: Should retry and fail gracefully

## Monitoring and Maintenance

### 1. Execution Monitoring

Set up monitoring for:

- **Success Rate**: Track successful vs failed executions
- **Execution Time**: Monitor performance
- **Error Patterns**: Identify common failure points
- **Resource Usage**: Monitor API quotas

### 2. Logging Configuration

Enable detailed logging in Make.com:

1. Go to Scenario Settings → Logging
2. Enable "Detailed logging"
3. Set log retention to 30 days
4. Configure error notifications

### 3. Performance Optimization

Monitor and optimize:

- **Image compression**: Reduce upload times
- **Parallel processing**: Where possible
- **Caching**: For repeated operations
- **API quotas**: Monitor usage limits

## Troubleshooting Guide

### Common Issues

#### 1. Image Processing Failures

**Symptoms**: Images not appearing in generated PDF
**Solutions**:
- Verify image URLs are accessible
- Check Google Drive permissions
- Ensure image format is supported (JPG, PNG)
- Review image replacement logic

#### 2. Template Population Errors

**Symptoms**: Placeholders not replaced
**Solutions**:
- Verify placeholder names match exactly
- Check template document permissions
- Ensure text replacement format is correct
- Test with simple text first

#### 3. Database Update Failures

**Symptoms**: Status not updated in database
**Solutions**:
- Verify API keys are correct
- Check database permissions
- Ensure contract exists and is current
- Review SQL query syntax

#### 4. Webhook Response Issues

**Symptoms**: No response or incorrect response
**Solutions**:
- Check webhook URL configuration
- Verify response format
- Ensure proper HTTP status codes
- Test webhook endpoint directly

### Debug Steps

1. **Check Execution History**: Review Make.com execution logs
2. **Verify Data Flow**: Trace data through each module
3. **Test Individual Modules**: Run modules in isolation
4. **Check API Responses**: Review HTTP response codes
5. **Validate Database State**: Check contract records

## Security Considerations

### 1. API Key Management

- Use environment variables for all API keys
- Rotate keys regularly
- Use least privilege access
- Monitor key usage

### 2. Data Validation

- Validate all incoming webhook data
- Sanitize file names and paths
- Check file types and sizes
- Implement rate limiting

### 3. Access Control

- Restrict Google Drive folder access
- Use service accounts with minimal permissions
- Implement webhook signature validation
- Monitor access logs

## Performance Optimization

### 1. Image Optimization

```javascript
// Recommended image settings
const imageSettings = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'JPEG'
};
```

### 2. Parallel Processing

Enable parallel execution where possible:
- Image downloads can run in parallel
- Database operations can be optimized
- File uploads can be batched

### 3. Caching Strategy

Implement caching for:
- Template documents
- Frequently accessed data
- API responses
- Generated files

## Backup and Recovery

### 1. Scenario Backup

- Export scenarios regularly
- Version control scenario configurations
- Document all customizations
- Test backup restoration

### 2. Data Backup

- Regular database backups
- File storage backups
- Configuration backups
- Recovery procedures

### 3. Disaster Recovery

- Document recovery procedures
- Test recovery processes
- Maintain backup contacts
- Regular recovery drills

## Support and Maintenance

### Regular Tasks

1. **Weekly**:
   - Review execution logs
   - Check error rates
   - Monitor performance metrics

2. **Monthly**:
   - Update API keys if needed
   - Review access permissions
   - Optimize performance
   - Update documentation

3. **Quarterly**:
   - Security review
   - Performance audit
   - Backup verification
   - Training updates

### Contact Information

- **Make.com Support**: https://www.make.com/en/help
- **Google API Support**: https://developers.google.com/apis-explorer
- **Supabase Support**: https://supabase.com/support

---

*This guide should be updated regularly as the integration evolves. Keep track of any changes and update documentation accordingly.* 