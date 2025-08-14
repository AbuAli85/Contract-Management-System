# Docker Setup for Contract Management System

This document provides comprehensive instructions for setting up and running the Contract Management System using Docker and Docker Compose.

## 🐳 Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (included with Docker Desktop)
- Git

## 📁 Files Overview

- **`Dockerfile`** - Multi-stage production build
- **`docker-compose.yml`** - Production configuration
- **`docker-compose.override.yml`** - Development configuration (auto-applied)
- **`.dockerignore`** - Excludes unnecessary files from build context

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory with your Supabase credentials:

```bash
# Copy the example file
cp env.security.example .env

# Edit .env with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:postgres@db:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-here
UPSTASH_REDIS_REST_URL=redis://your-redis-url.upstash.io:6379
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

### 2. Development Mode (with Hot Reload)

```bash
# Start development environment
docker-compose up --build

# Or explicitly use override file
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

**Features:**
- Hot reload enabled
- Source code mounted for live editing
- Node.js 18 Alpine image
- Automatic dependency installation

### 3. Production Mode

```bash
# Build and start production environment
docker-compose up --build

# Run in background
docker-compose up -d --build
```

**Features:**
- Multi-stage build for optimized image size
- Standalone Next.js output
- Production-optimized Node.js runtime
- Health checks enabled

## 🔧 Configuration Details

### Production Dockerfile

The production Dockerfile uses a multi-stage build approach:

1. **Dependencies Stage**: Installs production dependencies
2. **Builder Stage**: Builds the Next.js application
3. **Runner Stage**: Creates lightweight runtime with only necessary files

**Key Features:**
- `output: 'standalone'` from `next.config.js` is utilized
- Only copies `/public`, `.next/standalone`, and `.next/static`
- Runs as non-root user for security
- Optimized for minimal image size

### Docker Compose Services

#### Web Service
- **Production**: Built from Dockerfile
- **Development**: Uses `node:18-alpine` with volume mounts
- **Port**: 3000 (mapped to host)
- **Health Check**: `/api/health` endpoint

#### Database Service
- **Image**: `supabase/postgres:15.1.0.117`
- **Port**: 5432 (mapped to host)
- **Credentials**: `postgres/postgres`
- **Persistence**: Named volumes for data

## 📊 Usage Commands

### Development Commands

```bash
# Start development environment
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Production Commands

```bash
# Build production image
docker-compose build

# Start production services
docker-compose up -d

# View production logs
docker-compose logs -f web

# Stop production services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v
```

### Utility Commands

```bash
# Check service status
docker-compose ps

# Execute commands in running container
docker-compose exec web npm run lint
docker-compose exec db psql -U postgres -d postgres

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Stop conflicting service or change port in docker-compose.yml
```

#### 2. Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### 3. Database Connection Issues
```bash
# Check database logs
docker-compose logs db

# Verify database is running
docker-compose exec db pg_isready -U postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up --build
```

#### 4. Environment Variables
```bash
# Verify environment file
docker-compose config

# Check environment in container
docker-compose exec web env | grep NEXT_PUBLIC
```

### Performance Optimization

#### 1. Development Mode
- Source code is mounted for instant updates
- Node modules are cached in named volume
- Hot reload enabled for fast development

#### 2. Production Mode
- Multi-stage build reduces final image size
- Only necessary files are copied
- Non-root user for security
- Health checks for monitoring

## 🚀 Deployment

### Local Production Testing
```bash
# Test production build locally
docker-compose up --build

# Verify application works
curl http://localhost:3000/api/health
```

### Production Deployment
1. Ensure `.env` file has production values
2. Build and start services: `docker-compose up -d --build`
3. Monitor logs: `docker-compose logs -f`
4. Check health: `curl http://your-domain/api/health`

## 📝 Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | `eyJ...` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://...` |
| `NEXT_PUBLIC_APP_URL` | Application public URL | Yes | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | Yes | `your-secret-key` |
| `UPSTASH_REDIS_REST_URL` | Redis connection URL | No | `redis://...` |
| `UPSTASH_REDIS_REST_TOKEN` | Redis authentication token | No | `token` |

## 🔒 Security Considerations

- Database runs with minimal privileges
- Non-root user in production containers
- Environment variables for sensitive data
- Health checks for monitoring
- Restart policies for reliability

## 📚 Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Supabase Docker Images](https://supabase.com/docs/guides/self-hosting/docker)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

## 🤝 Support

For issues related to Docker setup:
1. Check the troubleshooting section above
2. Verify environment variables are set correctly
3. Check Docker and Docker Compose versions
4. Review application logs for specific errors
