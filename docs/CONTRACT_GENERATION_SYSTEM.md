# 🏢 Professional Contract Generation System

## Overview

This document describes the complete end-to-end contract generation system that provides professional contract creation, PDF generation, Google Drive integration, and download capabilities.

## 🏗️ System Architecture

### Components

1. **Frontend Form** (`components/enhanced-contract-form.tsx`)
   - Professional UI with real-time validation
   - Status tracking and progress indicators
   - PDF download functionality
   - Retry mechanisms for failed generations

2. **Contract Generation Service** (`lib/contract-generation-service.ts`)
   - Centralized business logic
   - Database operations
   - Make.com webhook integration
   - PDF status management

3. **API Endpoints**
   - `/api/contracts/generate` - Main contract generation
   - `/api/webhook/contract-pdf-ready` - PDF ready notifications
   - `/api/contracts/makecom/generate` - Make.com integration

4. **Make.com Integration**
   - Google Docs template processing
   - PDF generation and export
   - Google Drive storage
   - Supabase file upload

## 🔄 Workflow

### 1. Contract Creation
```
User fills form → Validation → Database storage → Make.com webhook → PDF generation
```

### 2. PDF Generation Process
```
Make.com receives webhook → Fetches contract data → Creates Google Doc → Exports PDF → Uploads to Supabase → Updates contract status
```

### 3. Status Tracking
```
Draft → Processing → Generated/Failed → Download available
```

## 📋 Features

### ✅ Professional Requirements Met

1. **Frontend to Backend Integration**
   - ✅ Form validation with Zod schema
   - ✅ Real-time error handling
   - ✅ Progress tracking
   - ✅ Status updates

2. **Contract Generation & Saving**
   - ✅ Database storage with proper relationships
   - ✅ Unique contract number generation
   - ✅ Audit trail with timestamps
   - ✅ Status management

3. **Google Drive Integration**
   - ✅ PDF storage in Google Drive
   - ✅ Organized folder structure
   - ✅ Direct download links
   - ✅ Version control

4. **PDF Download & Edit**
   - ✅ Direct PDF download
   - ✅ Browser-based viewing
   - ✅ Edit capabilities through Google Docs
   - ✅ Share functionality

5. **Professional Features**
   - ✅ Bilingual support (English/Arabic)
   - ✅ Oman Labor Law compliance
   - ✅ Multiple contract types
   - ✅ Professional templates

## 🚀 Usage Guide

### For Users

1. **Navigate to Contract Generation**
   ```
   /en/generate-contract
   ```

2. **Fill the Form**
   - Select Client (Party A)
   - Select Employer (Party B)
   - Choose Promoter
   - Enter contract details
   - Set dates and salary

3. **Submit and Monitor**
   - Click "Generate Contract"
   - Watch real-time status updates
   - Download PDF when ready

### For Administrators

1. **Monitor Contract Status**
   ```
   /en/contracts
   ```

2. **Manage Templates**
   ```
   /en/dashboard/makecom-templates
   ```

3. **View Analytics**
   ```
   /en/dashboard/analytics
   ```

## 🔧 Technical Implementation

### Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Make.com
MAKE_WEBHOOK_URL=https://hook.make.com/your-webhook-id
MAKECOM_WEBHOOK_URL=https://hook.make.com/your-webhook-id

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
GOOGLE_CREDENTIALS_JSON=your_google_credentials

# Optional: Slack notifications
SLACK_WEBHOOK_URL=https://hook.make.com/your-slack-webhook
```

### Database Schema

```sql
-- Contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,
  first_party_id UUID REFERENCES parties(id),
  second_party_id UUID REFERENCES parties(id),
  promoter_id UUID REFERENCES promoters(id),
  contract_start_date DATE,
  contract_end_date DATE,
  job_title TEXT,
  work_location TEXT,
  department TEXT,
  contract_type TEXT,
  currency TEXT DEFAULT 'OMR',
  basic_salary NUMERIC,
  allowances NUMERIC,
  special_terms TEXT,
  status TEXT DEFAULT 'draft',
  pdf_url TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_current BOOLEAN DEFAULT true
);
```

### API Endpoints

#### Generate Contract
```http
POST /api/contracts/generate
Content-Type: application/json

{
  "first_party_id": "uuid",
  "second_party_id": "uuid",
  "promoter_id": "uuid",
  "contract_start_date": "2024-01-01",
  "contract_end_date": "2024-12-31",
  "email": "user@example.com",
  "job_title": "Software Engineer",
  "work_location": "Muscat, Oman",
  "department": "IT",
  "contract_type": "full-time-permanent",
  "currency": "OMR",
  "basic_salary": 1000,
  "allowances": 200,
  "special_terms": "Optional special terms"
}
```

#### Check Status
```http
GET /api/contracts/generate?contract_id=uuid&action=status
```

#### Download PDF
```http
GET /api/contracts/generate?contract_id=uuid&action=download
```

#### Retry Generation
```http
PATCH /api/contracts/generate
Content-Type: application/json

{
  "contract_id": "uuid",
  "action": "retry"
}
```

## 🎯 Make.com Configuration

### Webhook Trigger
- **URL**: `https://your-domain.com/api/webhook/contract-pdf-ready`
- **Method**: POST
- **Content-Type**: application/json

### Expected Payload
```json
{
  "contract_id": "uuid",
  "contract_number": "CNT-20240101-ABC123",
  "pdf_url": "https://supabase.co/storage/v1/object/public/contracts/contract.pdf",
  "google_drive_url": "https://drive.google.com/file/d/...",
  "status": "generated"
}
```

### Google Docs Template Variables
```json
{
  "contract_number": "CNT-20240101-ABC123",
  "first_party_name_en": "Client Company",
  "first_party_name_ar": "شركة العميل",
  "second_party_name_en": "Employer Company",
  "second_party_name_ar": "شركة صاحب العمل",
  "promoter_name_en": "John Doe",
  "promoter_name_ar": "جون دو",
  "job_title": "Software Engineer",
  "department": "IT",
  "work_location": "Muscat, Oman",
  "start_date": "01/01/2024",
  "end_date": "31/12/2024",
  "basic_salary": "1000",
  "currency": "OMR"
}
```

## 🔍 Monitoring & Debugging

### Status Codes
- `draft` - Contract created, pending generation
- `processing` - PDF generation in progress
- `generated` - PDF ready for download
- `failed` - Generation failed, retry available

### Log Locations
- **Frontend**: Browser console
- **Backend**: Server logs
- **Make.com**: Scenario execution logs
- **Database**: Supabase logs

### Common Issues & Solutions

1. **PDF Not Generating**
   - Check Make.com webhook URL
   - Verify Google Docs template exists
   - Check Supabase storage permissions

2. **Form Validation Errors**
   - Ensure all required fields are filled
   - Check date format (YYYY-MM-DD)
   - Verify party and promoter selections

3. **Download Issues**
   - Check PDF URL accessibility
   - Verify Supabase storage bucket permissions
   - Ensure contract status is 'generated'

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database schema updated
- [ ] Make.com scenario imported and tested
- [ ] Google Docs templates created
- [ ] Supabase storage bucket configured

### Post-deployment
- [ ] Test contract generation end-to-end
- [ ] Verify PDF download functionality
- [ ] Check Google Drive integration
- [ ] Monitor webhook responses
- [ ] Test retry functionality

## 📊 Performance Metrics

### Expected Performance
- **Form Submission**: < 2 seconds
- **PDF Generation**: 30-60 seconds
- **Download Speed**: < 5 seconds
- **Status Updates**: Real-time polling

### Monitoring Points
- Contract generation success rate
- PDF generation time
- Download success rate
- User satisfaction metrics

## 🔐 Security Considerations

1. **Authentication**
   - All endpoints require user authentication
   - Role-based access control
   - Session validation

2. **Data Protection**
   - Encrypted data transmission
   - Secure file storage
   - Access logging

3. **Input Validation**
   - Schema validation with Zod
   - SQL injection prevention
   - XSS protection

## 📞 Support

For technical support or questions about the contract generation system:

1. **Documentation**: Check this guide and related docs
2. **Logs**: Review application and Make.com logs
3. **Database**: Check Supabase dashboard for data issues
4. **Templates**: Verify Google Docs template configuration

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅ 