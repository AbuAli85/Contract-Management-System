# Promoter & Contract Management System

A focused system for managing promoters and their development letters/contracts in Oman.

## 🎯 Core Purpose

This system is specifically designed for:

1. **Promoter Management** - Complete lifecycle management of promoters/workers
2. **Contract Generation** - Generate and manage development letters and work contracts

## ✨ Key Features

### Promoter Management

- 📋 **Complete Promoter Database**
  - Personal information (Name, ID, Passport)
  - Employment details and employer associations
  - Document tracking (ID expiry, Passport expiry)
  - Work status monitoring

- 🔍 **Advanced Search & Filtering**
  - Search by name, ID, or passport number
  - Filter by status, nationality, or employer
  - Quick actions for common tasks

- 📊 **Promoter Analytics**
  - View active vs inactive promoters
  - Track document expiry dates
  - Monitor employment relationships

### Contract Management

- 📝 **Contract Generation**
  - Generate development letters automatically
  - Create work contracts with dynamic data
  - Support for both English and Arabic

- 📂 **Contract Organization**
  - View all contracts
  - Filter by status (Pending, Approved, Rejected)
  - Track contract lifecycle

- ✅ **Contract Status Tracking**
  - Pending contracts awaiting approval
  - Approved contracts ready for use
  - Historical contract records

### Party Management

- 🏢 **Employer/Party Database**
  - Manage all parties (Employers, Clients)
  - Track company registration details
  - Associate parties with promoters and contracts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database)
- Vercel account (for deployment, optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Contract-Management-System.git
cd Contract-Management-System

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000` to access the system.

## 📦 Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## 🗂️ Database Tables

### Core Tables

1. **promoters** - Promoter/worker information
2. **contracts** - Generated contracts and development letters
3. **parties** - Employers and other parties
4. **users** - System users with RBAC

## 📱 Main Pages

- `/dashboard` - Overview of promoters and contracts
- `/promoters` - View all promoters
- `/manage-promoters` - Manage promoters (add, edit, delete)
- `/generate-contract` - Create new contracts
- `/contracts` - View all contracts
- `/manage-parties` - Manage employers and parties

## 🔐 Security Features

- ✅ Row Level Security (RLS) enabled
- ✅ Secure authentication with Supabase
- ✅ Role-based access control
- ✅ API route protection

## 📄 License

This project is proprietary software.

## 🤝 Support

For support, email support@thesmartpro.io or visit our documentation.

---

**Built for efficient promoter and contract management in Oman** 🇴🇲
