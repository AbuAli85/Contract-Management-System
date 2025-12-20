# Work Permit System - MOL Portal Integration Guide

## 🎯 System Purpose Clarification

### Ministry of Labour (MOL) Portal
The [MOL Portal](https://sso.mol.gov.om/login.aspx?ReturnUrl=https://eservices.mol.gov.om/Wppa/list) is the **official government system** where:
- ✅ Employers **submit** work permit applications
- ✅ Ministry **reviews and approves** applications  
- ✅ Ministry **issues** work permit numbers
- ✅ Employers **track** application status on Ministry system
- ✅ Employers **renew** existing work permits

### Our Platform's Role
Our platform is a **management and preparation tool** that helps employers:

1. **📝 Prepare Applications**
   - Create draft applications
   - Collect employee/promoter information
   - Organize required documents
   - Validate completeness

2. **📤 Export for Ministry Submission**
   - Export application data in Ministry format
   - Generate CSV/JSON for easy data transfer
   - Prepare documents for upload

3. **📊 Track After Submission**
   - Store Ministry reference numbers
   - Update application status
   - Track work permit numbers when issued
   - Monitor expiry dates

4. **🔔 Compliance Management**
   - Automatic expiry tracking
   - Renewal reminders (90, 60, 30, 14, 7 days)
   - Compliance dashboard
   - Non-compliance alerts

---

## 🔄 Complete Workflow

### Phase 1: Preparation (Our Platform)
```
1. Employer creates draft application
   ↓
2. Select employee/promoter
   ↓
3. Fill employee information
   ↓
4. Upload required documents
   ↓
5. Validate application completeness
   ↓
6. Export application data
```

### Phase 2: Submission (MOL Portal)
```
1. Employer logs into MOL portal
   ↓
2. Uses exported data from our platform
   ↓
3. Submits application to Ministry
   ↓
4. Ministry assigns reference number
   ↓
5. Employer copies reference number
```

### Phase 3: Tracking (Our Platform)
```
1. Employer returns to our platform
   ↓
2. Updates application status: "submitted"
   ↓
3. Enters Ministry reference number
   ↓
4. System tracks status
   ↓
5. When approved, enter work permit number
   ↓
6. System starts compliance tracking
```

### Phase 4: Renewal (Both Systems)
```
1. Our platform detects expiring permit (90 days)
   ↓
2. Sends reminder to employer
   ↓
3. Employer prepares renewal in our platform
   ↓
4. Employer submits renewal to MOL portal
   ↓
5. Employer updates status in our platform
```

---

## 📤 Export Functionality

### Export Endpoint
```
GET /api/work-permits/[id]/export?format=json|csv|pdf
```

### Export Formats

#### JSON Format
```json
{
  "application_number": "WP-2025-00001",
  "application_type": "new",
  "submission_date": "2025-02-02",
  "employer": {
    "name_en": "Falcon Eye Group",
    "name_ar": "مجموعة عين الصقر",
    "crn": "1234567890",
    "contact_email": "info@falconeyegroup.net",
    "contact_phone": "+968 1234 5678"
  },
  "employee": {
    "name_en": "John Doe",
    "name_ar": "جون دو",
    "passport_number": "AB123456",
    "nationality": "PAKISTAN",
    ...
  },
  "employment": {
    "job_title": "Sales Promoter",
    "salary": 250.00,
    "currency": "OMR",
    ...
  },
  "documents": {
    "required": ["passport", "id_card", "visa"],
    "submitted": ["passport", "id_card"],
    "urls": {...}
  }
}
```

#### CSV Format
- Structured CSV with all application data
- Easy to copy/paste into MOL portal forms
- Organized by sections (Employer, Employee, Employment, Documents)

---

## 🔗 Integration Features

### 1. Quick Link to MOL Portal
- Direct link button in dashboard
- Opens MOL portal in new tab
- Maintains context in our platform

### 2. Ministry Reference Tracking
- Store `ministry_reference_number` after submission
- Link to application in our system
- Track submission date

### 3. Work Permit Number Storage
- Store `work_permit_number` when issued
- Link to compliance tracking
- Automatic expiry date calculation

### 4. Status Synchronization
- Manual status updates
- Status workflow: draft → submitted → under_review → approved/rejected
- Future: API integration if MOL provides API

---

## 📋 Required Fields for MOL Submission

Based on typical work permit applications, our system collects:

### Employer Information
- ✅ Company name (EN/AR)
- ✅ CRN (Commercial Registration Number)
- ✅ Contact email
- ✅ Contact phone
- ✅ Address

### Employee/Promoter Information
- ✅ Full name (EN/AR)
- ✅ National ID or Passport number
- ✅ Nationality
- ✅ Date of birth
- ✅ Gender
- ✅ Contact information
- ✅ Address

### Employment Details
- ✅ Job title
- ✅ Department
- ✅ Employment type
- ✅ Salary
- ✅ Currency
- ✅ Start date
- ✅ End date

### Documents
- ✅ Passport copy
- ✅ ID card copy
- ✅ Visa copy
- ✅ Other required documents

---

## 🎯 Key Benefits

### For Employers:
1. **Centralized Management**
   - All work permits in one place
   - Easy to track and monitor
   - Integration with employee/promoter data

2. **Preparation Efficiency**
   - Pre-fill data from existing records
   - Document organization
   - Validation before submission

3. **Compliance Monitoring**
   - Automatic expiry tracking
   - Proactive renewal reminders
   - Compliance dashboard

4. **Time Savings**
   - Export data instead of manual entry
   - Bulk operations
   - Automated reminders

---

## 🔄 Status Workflow

```
draft
  ↓ (Export & Submit to MOL)
submitted
  ↓ (Ministry Review)
under_review
  ↓ (Ministry Decision)
approved / rejected
  ↓ (If approved, enter work permit number)
compliant (tracking expiry)
```

---

## 📝 Usage Instructions

### Creating New Application:
1. Click "New Application" button
2. Select employee/promoter
3. Fill required information
4. Upload documents
5. Save as draft

### Submitting to MOL:
1. Open application
2. Click "Export" button
3. Choose format (JSON/CSV)
4. Open MOL portal
5. Use exported data to fill MOL form
6. Submit to Ministry
7. Copy Ministry reference number
8. Return to our platform
9. Update status to "submitted"
10. Enter Ministry reference number

### Tracking After Submission:
1. Check application status
2. Update status when Ministry reviews
3. Enter work permit number when approved
4. System automatically tracks expiry

### Handling Renewals:
1. System sends reminder (90 days before)
2. Create renewal application
3. Export renewal data
4. Submit to MOL portal
5. Update status in our platform

---

## 🚀 Future Enhancements

### If MOL Provides API:
- Automatic status synchronization
- Direct document submission
- Real-time status updates
- Automated reference number capture

### Current Manual Process:
- ✅ Export functionality
- ✅ Status tracking
- ✅ Reference number storage
- ✅ Compliance monitoring

---

## ✅ Summary

Our platform serves as a **bridge** between:
- **Internal Management** (employees, promoters, companies)
- **Ministry Portal** (official work permit system)

**Key Value:**
- Prepare applications efficiently
- Track all work permits centrally
- Monitor compliance proactively
- Save time with automation

The system is designed to **complement** the MOL portal, not replace it. Employers use our platform for management and preparation, then use the MOL portal for official submission and approval.

