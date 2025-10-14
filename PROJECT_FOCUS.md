# 🎯 Project Focus: Promoter & Contract Management System

## Project Purpose

This system is specifically designed for **managing promoters (workers) and their development letters/contracts** in Oman. All other features have been simplified or removed to maintain focus on these core functionalities.

---

## ✅ Core Features (KEEP & MAINTAIN)

### 1. Promoter Management
**Purpose**: Complete lifecycle management of workers/promoters

**Features**:
- ✅ View all promoters with comprehensive details
- ✅ Add new promoters with full information
- ✅ Edit existing promoter records
- ✅ Track document expiry (ID, Passport)
- ✅ Associate promoters with employers
- ✅ Search and filter capabilities
- ✅ Status management (Active, Inactive, etc.)

**Key Files**:
- `/app/[locale]/promoters/page.tsx` - Main promoters view
- `/app/[locale]/manage-promoters/page.tsx` - Management interface
- `/app/api/promoters/route.ts` - API endpoint
- `/components/promoters-view.tsx` - Display component

**Database**: `promoters` table

---

### 2. Contract Management
**Purpose**: Generate and manage development letters and work contracts

**Features**:
- ✅ Generate new contracts/development letters
- ✅ View all contracts
- ✅ Filter by status (Pending, Approved, Rejected)
- ✅ Contract approval workflow
- ✅ PDF generation for contracts
- ✅ Bilingual support (English/Arabic)

**Key Files**:
- `/app/[locale]/generate-contract/page.tsx` - Contract generation
- `/app/[locale]/contracts/page.tsx` - All contracts view
- `/app/[locale]/contracts/pending/page.tsx` - Pending contracts
- `/app/[locale]/contracts/approved/page.tsx` - Approved contracts
- `/app/api/contracts/route.ts` - API endpoint

**Database**: `contracts` table

---

### 3. Party/Employer Management
**Purpose**: Manage employers and other parties associated with contracts

**Features**:
- ✅ Manage employer/party records
- ✅ Link employers to promoters
- ✅ Link parties to contracts
- ✅ Track company registration details

**Key Files**:
- `/app/[locale]/manage-parties/page.tsx` - Party management
- `/app/api/parties/route.ts` - API endpoint

**Database**: `parties` table

---

### 4. Essential System Features
**Features**:
- ✅ User authentication (Supabase Auth)
- ✅ Role-based access control (RBAC)
- ✅ Dashboard overview
- ✅ User profile management
- ✅ System settings

---

## ❌ Features REMOVED/DISABLED

The following features have been removed or hidden as they are outside the core scope:

### 1. CRM Features
- ❌ CRM Dashboard
- ❌ Lead management
- ❌ Sales pipeline
- ❌ Customer relationship tracking

### 2. Booking System
- ❌ Resource booking
- ❌ Meeting room reservations
- ❌ Equipment booking

### 3. Tracking System
- ❌ Project tracking
- ❌ Time tracking
- ❌ Task management

### 4. Advanced Analytics
- ❌ Complex analytics dashboards
- ❌ Advanced reporting
- ❌ Data visualization beyond basic stats

### 5. Communications
- ❌ Email integration
- ❌ SMS messaging
- ❌ Communication history

### 6. Advanced User Management
- ❌ Bulk user import
- ❌ Advanced role management
- ❌ User activity monitoring (beyond basic)

### 7. Data Management Tools
- ❌ Bulk import/export tools
- ❌ Data migration tools
- ❌ Backup/restore interface

---

## 🗂️ Simplified Navigation Structure

```
📊 Dashboard
   └─ Main dashboard overview

👥 Promoter Management
   ├─ All Promoters
   └─ Manage Promoters

📄 Contract Management
   ├─ Generate Contract
   ├─ All Contracts
   ├─ Pending Contracts
   └─ Approved Contracts

🏢 Parties & Employers
   └─ Manage Parties

⚙️ Settings
   ├─ Profile
   ├─ Settings
   └─ Help
```

---

## 📊 Database Schema (Core Tables Only)

### 1. `promoters`
Main table for promoter/worker information
- Personal details (name, ID, passport)
- Employment information
- Document tracking
- Status management

### 2. `contracts`
Contract and development letter records
- Contract details
- Associated promoter and parties
- Status tracking
- Approval workflow

### 3. `parties`
Employers and other parties
- Company information
- Registration details
- Contact information

### 4. `users`
System users with RBAC
- Authentication
- Role management
- Permissions

---

## 🎨 UI/UX Principles

1. **Simple & Clean** - Focus on essential features only
2. **Fast Navigation** - Quick access to promoters and contracts
3. **Bilingual** - Full support for English and Arabic
4. **Mobile Responsive** - Works on all devices
5. **Intuitive** - Easy to use without extensive training

---

## 🚀 Development Guidelines

### When Adding New Features
Ask yourself:
1. **Does this directly support promoter management?**
2. **Does this directly support contract generation/management?**
3. **Is this essential for the parties/employers management?**

If the answer is NO to all three → **Don't add it**

### Code Organization
- Keep API routes focused on core tables only
- Maintain clean separation between features
- Use simplified navigation component
- Avoid feature creep

---

## 📝 Next Steps for Implementation

1. **Review existing features** - Identify unused code
2. **Clean up API routes** - Remove unused endpoints
3. **Update dashboard** - Focus metrics on promoters & contracts only
4. **Simplify forms** - Remove unnecessary fields
5. **Update documentation** - Reflect simplified scope

---

## ✅ Success Metrics

- ✅ Users can manage promoters efficiently
- ✅ Contracts are generated quickly and accurately
- ✅ System is easy to navigate
- ✅ No confusion from unnecessary features
- ✅ Fast performance due to simplified scope

---

**Last Updated**: October 14, 2025

**Status**: ✅ **SIMPLIFIED & FOCUSED**

---

*This document serves as the guiding principle for all future development. Any feature additions must align with the core purpose of promoter and contract management.*

