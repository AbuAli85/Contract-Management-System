# Contract Management System

A professional enterprise-grade contract management system built with Next.js 14, TypeScript, and Supabase. Streamline your contract lifecycle from creation to approval with role-based access control, document generation, and comprehensive audit logging.

## 🎯 Core Features

### Contract Management

- **Create & Edit Contracts** - Intuitive form-based contract creation
- **Approval Workflows** - Multi-step approval process with notifications
- **Document Generation** - Auto-generate PDF contracts from templates
- **Version Control** - Track all contract changes and revisions
- **Status Tracking** - Monitor contract lifecycle from draft to execution

### User & Access Management

- **Role-Based Access Control (RBAC)** - Granular permissions system
- **Multi-Factor Authentication (MFA)** - Enhanced security with TOTP
- **User Approval System** - Admin approval for new registrations
- **Audit Logging** - Complete trail of all system activities
- **Session Management** - Secure session handling with automatic refresh

### Business Modules

- **Promoter Management** - Manage contractors and service providers
- **Booking System** - Schedule and track service bookings
- **Invoice Management** - Generate and manage invoices
- **Party Management** - Organize clients and partners
- **Real-time Updates** - Live synchronization across dashboards

### Additional Features

- **Multi-language Support** - Built-in i18n (English, Arabic, more)
- **Responsive Design** - Works seamlessly on all devices
- **Excel Import/Export** - Bulk data operations
- **Advanced Search & Filtering** - Find contracts quickly
- **Notification System** - Email and in-app notifications

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Forms**: React Hook Form + Zod validation
- **Charts**: Chart.js + Recharts

### Backend

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Custom RBAC
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage
- **API**: Next.js API Routes
- **PDF Generation**: jsPDF

### Security

- **MFA**: TOTP-based (otplib)
- **Rate Limiting**: Upstash Redis
- **RLS**: Row Level Security policies
- **Encryption**: bcrypt for passwords
- **Session Security**: HTTP-only cookies

### Testing & Quality

- **Testing**: Jest + React Testing Library
- **E2E Testing**: Cypress
- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript (strict mode)

### Deployment

- **Hosting**: Vercel
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **CI/CD**: GitHub Actions (optional)

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Supabase** account and project
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/contract-management-system.git
cd contract-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Feature Flags
FEATURE_CAPTCHA_ENABLED=false
ENABLE_SECURITY_AUDIT_LOGGING=true
RBAC_ENFORCEMENT=enforce

# Optional: MFA, Rate Limiting, etc.
```

### 4. Database Setup

Run migrations in your Supabase project:

```bash
# Apply migrations from supabase/migrations/
# Use Supabase CLI or Dashboard
```

Seed initial data:

```bash
# Run the RBAC seed script
# This creates roles, permissions, and initial admin user
npm run rbac:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[SECURITY_PATCH_SUMMARY.md](./SECURITY_PATCH_SUMMARY.md)** - Security features and patches
- **[CRITICAL_SECURITY_FIXES.md](./CRITICAL_SECURITY_FIXES.md)** - Security audit findings
- **[README_RBAC.md](./README_RBAC.md)** - RBAC system documentation
- **[TODO.md](./TODO.md)** - Development roadmap

## 🏗️ Project Structure

```
contract-management-system/
├── app/                      # Next.js App Router
│   ├── [locale]/            # Internationalized routes
│   ├── api/                 # API endpoints
│   └── ...
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Authentication components
│   ├── dashboard/           # Dashboard components
│   └── ...
├── lib/                     # Core business logic
│   ├── auth/                # Authentication services
│   ├── supabase/            # Supabase clients
│   ├── rbac/                # RBAC implementation
│   └── ...
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── supabase/               # Supabase configuration
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge functions
├── scripts/                # Utility scripts
├── public/                 # Static assets
└── docs/                   # Additional documentation
```

## 🔑 Key Features

### Authentication Flow

1. User registers → Status: "pending"
2. Admin approves → Status: "active"
3. User logs in with email/password
4. Optional: Enable MFA for enhanced security

### Contract Workflow

1. Create contract (draft status)
2. Submit for approval
3. Approval chain (based on roles)
4. Generate final PDF
5. Execute and archive

### RBAC System

- Predefined roles: admin, user, provider, client
- Custom permissions per role
- Route-level and component-level guards
- Dynamic permission checking

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint
```

## 📦 Building for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy automatically

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

### Docker (Alternative)

```bash
# Build Docker image
docker build -t contract-system .

# Run container
docker run -p 3000:3000 contract-system
```

## 🔒 Security

- All passwords hashed with bcrypt
- Row Level Security (RLS) enabled on all tables
- HTTPS-only in production
- CSRF protection
- Rate limiting on auth endpoints
- MFA support with TOTP
- Secure session management
- Regular security audits

See [SECURITY_PATCH_SUMMARY.md](./SECURITY_PATCH_SUMMARY.md) for details.

## 🌍 Internationalization

Supports multiple languages via next-intl:

- English (en)
- Arabic (ar)
- Extensible for more languages

Add translations in `i18n/messages/`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow TypeScript strict mode
- Use Prettier for formatting
- Write tests for new features
- Update documentation

## 📝 Scripts Reference

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run start              # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix          # Fix ESLint errors
npm run type-check        # TypeScript check
npm run format            # Format with Prettier

# Testing
npm test                   # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test:e2e          # Cypress E2E

# Database
npm run rbac:seed         # Seed RBAC data
npm run db:migrate        # Run migrations

# Deployment
npm run prod:check        # Pre-deployment checks
npm run prod:deploy       # Deploy to production
```

## 📊 Performance

- **Lighthouse Score**: 90+ across all metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **SEO Optimized**: Next.js 14 features

## 🐛 Known Issues

See [TODO.md](./TODO.md) for current development tasks and known issues.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - The React framework
- **Supabase** - Backend as a service
- **shadcn/ui** - Beautiful component library
- **Vercel** - Hosting and deployment

## 📞 Support

For support, email support@yourcompany.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Advanced reporting and analytics
- [ ] Contract templates marketplace
- [ ] Mobile applications (iOS/Android)
- [ ] API for third-party integrations
- [ ] Advanced workflow automation
- [ ] AI-powered contract analysis

---

**Built with ❤️ using Next.js and Supabase**

Last Updated: October 2025
