# Deployment Guide

## Environment Variables Setup

### For Vercel Deployment

To deploy this application to Vercel, you need to set up the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:

#### Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Optional Environment Variables

```
NEXT_PUBLIC_APP_URL=your_app_url
NEXT_PUBLIC_VERCEL_URL=your_vercel_url
```

### For Local Development

Create a `.env.local` file in the root directory with the same variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### Build Issues

If you encounter build errors related to missing environment variables:

1. **During Development**: The app will use mock clients and show warnings
2. **During Production Build**: Ensure all required environment variables are set in Vercel
3. **Local Build**: Create `.env.local` file with all required variables

### Troubleshooting

- **"Supabase URL or Anon Key is missing"**: Check that environment variables are properly set
- **Build failures**: Ensure all environment variables are configured in Vercel
- **Authentication issues**: Verify that Supabase project is properly configured with authentication

### Database Setup

Before deploying, ensure your Supabase database has the required tables:

1. `promoters` table
2. `contracts` table  
3. `parties` table
4. `profiles` table

Run the migration scripts in the `supabase/migrations/` directory to set up your database schema.
