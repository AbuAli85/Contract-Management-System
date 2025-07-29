# Deployment & CI/CD Guide

This guide covers the complete deployment strategy, CI/CD pipeline configuration, and environment management for the Contract Management System.

## 🚀 Overview

Our deployment strategy follows a multi-environment approach with automated CI/CD pipelines, ensuring reliable and secure deployments across development, staging, and production environments.

## 📋 Prerequisites

### Required Tools & Accounts

- **GitHub Account**: For repository and CI/CD workflows
- **Vercel Account**: For hosting and deployment
- **Supabase Account**: For database and backend services
- **Node.js 20+**: For local development and CI
- **pnpm**: Package manager
- **Supabase CLI**: For database migrations

### Required Secrets

Configure these secrets in your GitHub repository settings:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_ACCESS_TOKEN=your_access_token

# Vercel Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Webhook Integrations
MAKE_WEBHOOK_URL=your_make_webhook_url
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## 🔄 CI/CD Pipeline

### Workflow Overview

Our enhanced CI/CD pipeline consists of the following stages:

1. **Pre-deployment Validation**
2. **Database Migrations**
3. **Build and Test**
4. **E2E Testing**
5. **Environment-specific Deployment**
6. **Post-deployment Verification**

### Pipeline Jobs

#### 1. Validate Job
- **Purpose**: Pre-deployment validation and quality checks
- **Tasks**:
  - Code linting (`pnpm run lint`)
  - Unit tests (`pnpm run test:unit`)
  - Database health check (`pnpm run db:health-check`)
  - Migration validation (`pnpm run supabase:validate-migrations`)
- **Failure Action**: Pipeline stops if any check fails

#### 2. Migrate Job
- **Purpose**: Deploy database migrations safely
- **Tasks**:
  - Setup Supabase CLI
  - Deploy migrations (`pnpm run supabase:deploy`)
  - Verify migrations with health check
- **Dependencies**: Requires `validate` job to succeed

#### 3. Build and Test Job
- **Purpose**: Build application and run integration tests
- **Tasks**:
  - Integration tests (`pnpm run test:integration`)
  - Application build (`pnpm run build`)
  - Upload build artifacts
- **Dependencies**: Requires `validate` and `migrate` jobs

#### 4. E2E Tests Job
- **Purpose**: End-to-end testing of the application
- **Tasks**:
  - Start application server
  - Run Cypress E2E tests
  - Upload test artifacts on failure
- **Dependencies**: Requires `build-and-test` job

#### 5. Deployment Jobs
- **Preview Deployment**: For pull requests
- **Staging Deployment**: For `develop` branch
- **Production Deployment**: For `main` branch

## 🌍 Environment Management

### Environment Types

#### 1. Development Environment
- **Purpose**: Local development and testing
- **Configuration**: `.env.local` file
- **Database**: Local Supabase instance or development project
- **Access**: Developers only

#### 2. Preview Environment
- **Purpose**: Testing pull requests before merge
- **Configuration**: Vercel preview environment variables
- **Database**: Shared test database
- **Access**: PR reviewers and stakeholders
- **Auto-deployment**: On every PR

#### 3. Staging Environment
- **Purpose**: Pre-production testing and validation
- **Configuration**: Vercel staging environment variables
- **Database**: Staging database (separate from production)
- **Access**: QA team and stakeholders
- **Auto-deployment**: On `develop` branch pushes

#### 4. Production Environment
- **Purpose**: Live application for end users
- **Configuration**: Vercel production environment variables
- **Database**: Production database
- **Access**: End users
- **Auto-deployment**: On `main` branch pushes

### Environment Variables

#### Required Variables per Environment

```bash
# All Environments
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NODE_ENV=environment_name

# Production/Staging Only
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_ACCESS_TOKEN=your_access_token

# Webhook URLs (environment-specific)
MAKE_WEBHOOK_URL=environment_specific_webhook
SLACK_WEBHOOK_URL=environment_specific_webhook
```

## 🛠️ Deployment Commands

### Local Development

```bash
# Start development server
pnpm run dev

# Run tests
pnpm run test:all

# Validate before deployment
pnpm run deploy:validate
```

### Database Operations

```bash
# Health check
pnpm run db:health-check

# Validate migrations
pnpm run supabase:validate-migrations

# Deploy migrations
pnpm run supabase:deploy

# Reset database (development only)
pnpm run supabase:reset
```

### Deployment Commands

```bash
# Preview deployment
pnpm run deploy:preview

# Production deployment
pnpm run deploy:production

# Full CI pipeline
pnpm run ci:full
```

## 🔍 Health Checks & Monitoring

### Database Health Check

The database health check script (`scripts/db-health-check.ts`) performs:

1. **Connectivity Test**: Verifies database connection
2. **Authentication Test**: Checks Supabase Auth service
3. **Query Test**: Executes basic database queries
4. **RLS Test**: Verifies Row Level Security policies
5. **Performance Test**: Measures response latency

### Application Health Check

The health check API endpoint (`/api/health`) provides:

- Application status and uptime
- Database connectivity status
- Authentication service status
- Environment information
- Response time metrics

### Monitoring Integration

- **Vercel Analytics**: Built-in performance monitoring
- **Health Check Endpoints**: For external monitoring tools
- **Error Tracking**: Sentry integration (optional)
- **Logging**: Structured logging for debugging

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failures

```bash
# Check database health
pnpm run db:health-check

# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test Supabase CLI
supabase status
```

#### 2. Migration Failures

```bash
# Validate migrations
pnpm run supabase:validate-migrations

# Check migration status
supabase db diff

# Reset migrations (development only)
pnpm run supabase:reset
```

#### 3. Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm run build

# Check for TypeScript errors
pnpm run lint
```

#### 4. Deployment Failures

```bash
# Check Vercel status
vercel ls

# Verify deployment configuration
cat vercel.json

# Check environment variables in Vercel
vercel env ls
```

### Debugging Commands

```bash
# Full system check
pnpm run ci:full

# Pre-deployment validation
pnpm run ci:pre-deploy

# Test specific components
pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e
```

## 📊 Deployment Metrics

### Key Performance Indicators

- **Deployment Success Rate**: Target > 95%
- **Build Time**: Target < 10 minutes
- **Test Coverage**: Target > 80%
- **Database Health**: 100% uptime
- **Response Time**: < 2 seconds

### Monitoring Dashboard

Access deployment metrics through:

- **GitHub Actions**: Workflow run history and logs
- **Vercel Dashboard**: Deployment status and performance
- **Supabase Dashboard**: Database health and performance
- **Health Check Endpoints**: Real-time status monitoring

## 🔐 Security Considerations

### Environment Security

- **Secrets Management**: All sensitive data stored as GitHub secrets
- **Environment Isolation**: Separate databases per environment
- **Access Control**: Role-based access to different environments
- **Audit Logging**: Comprehensive deployment and access logs

### Database Security

- **RLS Policies**: Row Level Security enforced on all tables
- **Connection Security**: SSL/TLS encryption for all database connections
- **Access Tokens**: Rotated regularly and environment-specific
- **Backup Strategy**: Automated backups with point-in-time recovery

### Application Security

- **Security Headers**: Comprehensive security headers in `vercel.json`
- **Input Validation**: All user inputs validated and sanitized
- **Authentication**: Secure session management with Supabase Auth
- **CORS Configuration**: Properly configured for production domains

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## 🤝 Support

For deployment-related issues:

1. Check the troubleshooting section above
2. Review GitHub Actions logs for detailed error information
3. Verify environment variables and secrets configuration
4. Contact the development team for assistance

---

*Last updated: January 2025*