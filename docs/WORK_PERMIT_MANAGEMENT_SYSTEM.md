# Work Permit Management System
## Based on Ministry of Labour (Oman) Workflow Analysis

### Overview
This document outlines the Work Permit Management System designed based on the Ministry of Labour (Oman) electronic services portal structure. The system enables employers to manage work permits for their employees/promoters through a comprehensive workflow.

**Reference:** [Ministry of Labour SSO Portal](https://sso.mol.gov.om/login.aspx?ReturnUrl=https://eservices.mol.gov.om/Wppa/list)

---

## 🏛️ Ministry System Analysis

### Key Features Identified:
1. **Unified SSO Login**
   - Smart card authentication
   - Mobile phone authentication
   - National ID verification

2. **Work Permit Processing (WPPA)**
   - Work permit applications
   - Renewal management
   - Status tracking
   - Document verification

3. **Document Management**
   - National ID tracking
   - Card expiry management
   - Document verification workflow

4. **Employer Portal**
   - Employee/promoter management
   - Work permit applications
   - Compliance tracking

---

## 📋 System Requirements

### 1. Work Permit Application Workflow

```
Employer Initiates Application
  ↓
Employee/Promoter Information Verification
  ↓
Document Collection (ID, Passport, Visa)
  ↓
Work Permit Application Submission
  ↓
Ministry Review & Approval
  ↓
Work Permit Issuance
  ↓
Renewal Tracking & Reminders
```

### 2. Data Structure

#### Work Permit Applications Table
- Application tracking
- Status management
- Document attachments
- Ministry reference numbers
- Approval workflow

#### Work Permit Renewals Table
- Renewal scheduling
- Expiry tracking
- Automatic reminders
- Renewal history

---

## 🗄️ Database Schema

### Work Permit Applications
```sql
CREATE TABLE work_permit_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES profiles(id),
  employer_party_id UUID REFERENCES parties(id), -- Company/Employer party
  employee_id UUID NOT NULL REFERENCES profiles(id),
  promoter_id UUID REFERENCES promoters(id), -- If linked to promoter
  
  -- Application Details
  application_number TEXT UNIQUE, -- Auto-generated: WP-YYYY-XXXXX
  application_type TEXT NOT NULL CHECK (application_type IN (
    'new', 'renewal', 'transfer', 'cancellation', 'amendment'
  )),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled'
  )),
  
  -- Employee Information
  employee_name_en TEXT NOT NULL,
  employee_name_ar TEXT,
  national_id TEXT, -- Omani National ID or Passport
  passport_number TEXT,
  nationality TEXT,
  job_title TEXT NOT NULL,
  department TEXT,
  employment_type TEXT CHECK (employment_type IN (
    'full_time', 'part_time', 'contract', 'temporary'
  )),
  
  -- Work Permit Details
  work_permit_number TEXT, -- Issued by Ministry
  work_permit_start_date DATE,
  work_permit_end_date DATE,
  work_permit_category TEXT, -- Professional, Technical, etc.
  salary DECIMAL(12,2),
  currency TEXT DEFAULT 'OMR',
  
  -- Ministry Integration
  ministry_reference_number TEXT, -- Reference from Ministry system
  ministry_submission_date TIMESTAMPTZ,
  ministry_approval_date TIMESTAMPTZ,
  ministry_rejection_reason TEXT,
  
  -- Documents
  required_documents JSONB DEFAULT '[]', -- List of required documents
  submitted_documents JSONB DEFAULT '[]', -- Documents submitted
  document_urls JSONB DEFAULT '{}', -- Links to uploaded documents
  
  -- Workflow
  submitted_by UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Notes & Comments
  internal_notes TEXT,
  ministry_notes TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Indexes
CREATE INDEX idx_work_permit_applications_employer_id 
  ON work_permit_applications(employer_id);
CREATE INDEX idx_work_permit_applications_employee_id 
  ON work_permit_applications(employee_id);
CREATE INDEX idx_work_permit_applications_status 
  ON work_permit_applications(status);
CREATE INDEX idx_work_permit_applications_application_type 
  ON work_permit_applications(application_type);
CREATE INDEX idx_work_permit_applications_work_permit_number 
  ON work_permit_applications(work_permit_number) 
  WHERE work_permit_number IS NOT NULL;
```

### Work Permit Renewals
```sql
CREATE TABLE work_permit_renewals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_permit_application_id UUID REFERENCES work_permit_applications(id),
  original_work_permit_number TEXT NOT NULL,
  
  -- Renewal Details
  renewal_number TEXT UNIQUE, -- Auto-generated: REN-YYYY-XXXXX
  renewal_type TEXT DEFAULT 'standard' CHECK (renewal_type IN (
    'standard', 'early', 'extension', 'emergency'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'submitted', 'approved', 'rejected', 'expired'
  )),
  
  -- Dates
  current_expiry_date DATE NOT NULL,
  renewal_start_date DATE,
  renewal_end_date DATE,
  renewal_submitted_date TIMESTAMPTZ,
  renewal_approved_date TIMESTAMPTZ,
  
  -- Reminders
  reminder_sent_90_days BOOLEAN DEFAULT FALSE,
  reminder_sent_60_days BOOLEAN DEFAULT FALSE,
  reminder_sent_30_days BOOLEAN DEFAULT FALSE,
  reminder_sent_14_days BOOLEAN DEFAULT FALSE,
  reminder_sent_7_days BOOLEAN DEFAULT FALSE,
  
  -- Documents
  renewal_documents JSONB DEFAULT '[]',
  document_urls JSONB DEFAULT '{}',
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_work_permit_renewals_application_id 
  ON work_permit_renewals(work_permit_application_id);
CREATE INDEX idx_work_permit_renewals_status 
  ON work_permit_renewals(status);
CREATE INDEX idx_work_permit_renewals_expiry_date 
  ON work_permit_renewals(current_expiry_date);
```

### Work Permit Compliance Tracking
```sql
CREATE TABLE work_permit_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES profiles(id),
  employer_party_id UUID REFERENCES parties(id),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  work_permit_application_id UUID REFERENCES work_permit_applications(id),
  
  -- Compliance Status
  compliance_status TEXT DEFAULT 'compliant' CHECK (compliance_status IN (
    'compliant', 'expiring_soon', 'expired', 'non_compliant', 'pending_renewal'
  )),
  
  -- Current Work Permit
  work_permit_number TEXT,
  work_permit_expiry_date DATE,
  days_until_expiry INTEGER,
  
  -- Alerts
  last_alert_sent TIMESTAMPTZ,
  alert_level TEXT CHECK (alert_level IN ('info', 'warning', 'urgent', 'critical')),
  
  -- Compliance History
  compliance_history JSONB DEFAULT '[]', -- Track compliance changes
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_permit_compliance_employer_id 
  ON work_permit_compliance(employer_id);
CREATE INDEX idx_work_permit_compliance_employee_id 
  ON work_permit_compliance(employee_id);
CREATE INDEX idx_work_permit_compliance_status 
  ON work_permit_compliance(compliance_status);
CREATE INDEX idx_work_permit_compliance_expiry_date 
  ON work_permit_compliance(work_permit_expiry_date);
```

---

## 🎯 Features to Implement

### 1. Employer Work Permit Dashboard
- View all work permits by status
- Track expiring permits
- Compliance overview
- Quick actions (new application, renewal)

### 2. Work Permit Application Form
- Employee/promoter selection
- Document upload
- Application submission
- Status tracking

### 3. Automatic Renewal Reminders
- 90 days before expiry
- 60 days before expiry
- 30 days before expiry
- 14 days before expiry
- 7 days before expiry
- Daily alerts after expiry

### 4. Compliance Monitoring
- Real-time compliance status
- Expiry tracking
- Missing document alerts
- Non-compliance reports

### 5. Ministry Integration (Future)
- API integration for status checks
- Automated submission (if API available)
- Document verification

---

## 📊 Workflow States

### Application Status Flow
```
draft → submitted → under_review → approved/rejected
```

### Renewal Status Flow
```
pending → submitted → approved/rejected
```

### Compliance Status
```
compliant → expiring_soon → expired → non_compliant
```

---

## 🔔 Notification System

### Alert Levels
- **Info**: 90-60 days before expiry
- **Warning**: 30-14 days before expiry
- **Urgent**: 7-3 days before expiry
- **Critical**: Expired or <3 days

### Notification Channels
- In-app notifications
- Email alerts
- SMS alerts (for critical)
- Dashboard badges

---

## 📝 Next Steps

1. Create database migration for work permit tables
2. Build API endpoints for work permit management
3. Create employer dashboard component
4. Implement application form
5. Build renewal workflow
6. Add compliance tracking
7. Integrate with existing document management
8. Create reports and analytics

---

## 🔗 Integration Points

### Existing Systems
- **Promoters Table**: Link work permits to promoters
- **Employer Employees Table**: Link to employee records
- **Document Management**: Track required documents
- **Notification System**: Send expiry reminders
- **Parties Table**: Link to employer companies

### Future Integrations
- Ministry of Labour API (if available)
- Government document verification
- Automated submission workflows

