# Contract Management System

A professional enterprise-grade contract management and generation system built with Next.js, TypeScript, and Supabase.

## 🚀 Features

- **User Management**: Complete user lifecycle with role-based access control
- **Contract Management**: Create, edit, and manage contracts with approval workflows
- **Promoter Management**: Comprehensive promoter profile and CV management
- **RBAC System**: Role-based access control with granular permissions
- **Real-time Updates**: Live data synchronization across the application
- **Audit Logging**: Complete audit trail for all system activities
- **Multi-language Support**: Internationalization with next-intl
- **Responsive Design**: Modern UI that works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with custom RBAC
- **State Management**: React Context + Hooks
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint, Prettier
- **Deployment**: Vercel, Supabase

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/contract-management-system.git
cd contract-management-system
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration
DATABASE_URL=your_database_connection_string

# Security Configuration
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Feature Flags
ENABLE_MFA=true
ENABLE_AUDIT_LOGS=true
ENABLE_REAL_TIME_UPDATES=true
```

### 4. Database Setup

Run the database migrations:

```bash
npm run db:migrate
# or
supabase db push
```

Seed the database with initial data:

```bash
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

The system uses the following main tables:

- **users**: User accounts and profiles
- **contracts**: Contract information and metadata
- **promoters**: Promoter profiles and CV data
- **user_activity_log**: Audit trail for all activities
- **permissions**: RBAC permission definitions
- **roles**: User role assignments

## 🔐 Authentication & Authorization

### User Roles

- **Admin**: Full system access
- **Manager**: User and contract management
- **User**: Basic contract operations
- **Viewer**: Read-only access

### Permission System

The RBAC system uses a hierarchical permission structure:

```
resource.action.scope
```

Examples:
- `users.view.all` - View all users
- `contracts.create.own` - Create own contracts
- `dashboard.view.public` - View public dashboard

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - List users
- `GET /api/users/[id]` - Get user details
- `POST /api/users/approval` - Approve/reject users
- `PUT /api/users/[id]` - Update user

### Contracts
- `GET /api/contracts` - List contracts
- `POST /api/contracts` - Create contract
- `PUT /api/contracts/[id]` - Update contract
- `DELETE /api/contracts/[id]` - Delete contract

### Promoters
- `GET /api/promoters` - List promoters
- `POST /api/promoters` - Create promoter
- `PUT /api/promoters/[id]` - Update promoter
- `DELETE /api/promoters/[id]` - Delete promoter

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test files
npm test -- --testPathPattern=auth
```

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Supabase Deployment

1. Push database changes:
```bash
supabase db push
```

2. Deploy Edge Functions:
```bash
supabase functions deploy
```

## 📊 Monitoring & Logging

The system includes comprehensive logging and monitoring:

- **Application Logs**: Console and file-based logging
- **Audit Logs**: User activity tracking
- **Error Tracking**: Error monitoring and alerting
- **Performance Metrics**: Response time and throughput monitoring

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **RBAC**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **Rate Limiting**: API rate limiting and throttling
- **Audit Logging**: Complete activity tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Commit your changes: `git commit -am 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the [documentation](docs/)
- Review the [troubleshooting guide](docs/TROUBLESHOOTING.md)

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete list of changes and updates.

## 📈 Roadmap

- [ ] Advanced contract templates
- [ ] Document versioning
- [ ] Workflow automation
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Integration with external services
- [ ] Multi-tenant support
- [ ] Advanced reporting

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
