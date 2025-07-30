# Contract Management System

A modern, secure contract management platform built with Next.js, Supabase, and TypeScript.

## 🚀 Features

### Enhanced Authentication System

- **Automatic Session Refresh**: Seamless session management with automatic token refresh
- **Memory Leak Prevention**: Proper cleanup of subscriptions and timers
- **Centralized Error Handling**: User-friendly error messages with toast notifications
- **Security**: Comprehensive RLS policies and role-based access control
- **Error Boundaries**: Graceful error handling with recovery options
- **Automated Reminders**: Email notifications for session expiry

### Core Features

- Multi-role authentication (Admin, Client, Provider)
- Contract generation and management
- Party and promoter management
- Real-time notifications
- Advanced search and filtering
- PDF generation and export
- Audit logging and analytics

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI**: Shadcn/UI, Tailwind CSS, Framer Motion
- **Testing**: Jest, React Testing Library, Cypress
- **Deployment**: Vercel, GitHub Actions

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm 8+
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/contract-management-system.git
   cd contract-management-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   FRONTEND_URL=http://localhost:3000
   ```

4. **Set up Supabase**

   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   supabase link --project-ref your-project-ref

   # Run migrations
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Automatic Deployment (Recommended)

The project is configured for automatic deployment to Vercel using GitHub Actions.

#### 1. Connect to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link
```

#### 2. Set up GitHub Secrets

Add the following secrets to your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `FRONTEND_URL`: Your production frontend URL

#### 3. Deploy Database Migrations

```bash
# Deploy Supabase migrations
npm run db:migrate

# Deploy Edge Functions
npm run functions:deploy
```

#### 4. Push to Deploy

Simply push to the `main` branch to trigger automatic deployment:

```bash
git add .
git commit -m "feat: enhanced authentication system"
git push origin main
```

### Manual Deployment

If you prefer manual deployment:

```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Test Coverage

The project includes comprehensive test coverage for:

- Authentication system
- Session management
- Error handling
- Memory leak prevention
- Network failure scenarios

## 🔧 Configuration

### Environment Variables

| Variable                        | Description                      | Required |
| ------------------------------- | -------------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL             | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key           | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key        | Yes      |
| `FRONTEND_URL`                  | Frontend URL for email links     | Yes      |
| `SENTRY_DSN`                    | Sentry error tracking (optional) | No       |

### Database Migrations

The project includes comprehensive database migrations:

1. **RLS Policies** (`20250729090000_enforce_profiles_rls.sql`)
   - Row-level security for all auth tables
   - Role-based access control
   - Admin functions and permissions

2. **Session Reminders** (`20250729090001_session_expiry_cron.sql`)
   - Automated email reminders
   - pg_cron scheduling
   - Audit logging

## 📊 Monitoring

### Session Analytics

```sql
-- Get reminder statistics
SELECT * FROM get_reminder_statistics(7);

-- View recent activity
SELECT * FROM recent_session_reminders;
```

### Error Monitoring

- Auth errors are logged with context
- Error boundaries capture JS errors
- Session refresh failures are tracked
- Network errors are categorized

## 🔒 Security

### Authentication Security

- **Session Management**: Automatic refresh with retry logic
- **Token Security**: Secure handling and validation
- **RLS Policies**: Row-level security on all user data
- **Error Handling**: No sensitive information in error messages

### Database Security

- **Row-Level Security**: Users can only access their own data
- **Admin Access**: Role-based permissions for administrators
- **Audit Logging**: Comprehensive logging of all operations
- **Input Validation**: Zod schemas for all user inputs

## 🚀 Performance

### Optimizations

- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: Strategic caching for auth data
- **Memory Management**: Proper cleanup of subscriptions

### Monitoring

- **Bundle Analysis**: Built-in bundle analysis
- **Performance Metrics**: Core Web Vitals tracking
- **Error Tracking**: Comprehensive error monitoring
- **Session Analytics**: User session tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the [documentation](docs/)
- Review the [troubleshooting guide](docs/TROUBLESHOOTING.md)

## 🔄 Changelog

### v0.1.0 - Enhanced Authentication System

- ✅ Automatic session refresh with retry logic
- ✅ Memory leak prevention and cleanup
- ✅ Centralized error handling with user-friendly messages
- ✅ Comprehensive RLS policies and security
- ✅ Error boundaries with recovery options
- ✅ Automated session expiry reminders
- ✅ Expanded test coverage for edge cases
- ✅ Production-ready deployment configuration

---

**Built with ❤️ using Next.js, Supabase, and TypeScript**
