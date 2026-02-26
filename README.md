# SmartPRO — Enterprise Operations Platform

> **A full-stack, multi-tenant enterprise platform** covering Contract Lifecycle Management, HR, CRM, Analytics, Marketplace, and end-to-end company workflows — built with Next.js 14, Supabase, and TypeScript.

## Platform Overview

SmartPRO is an end-to-end enterprise operations platform designed for companies in Oman and the GCC region.

| Domain | Capabilities |
|---|---|
| **Contracts** | Generation, templates, clause library, approval workflows, digital signatures |
| **HR** | Employee management, payroll, attendance, leave, recruitment, onboarding/offboarding |
| **CRM** | Parties, promoters, sales pipeline, communication logs |
| **Analytics** | KPI dashboards, custom report builder, HR analytics, contract analytics |
| **Marketplace** | Service listings, bookings, invoicing, provider management |
| **Notifications** | Email, WhatsApp, in-app, webhook automation via Make.com |
| **Admin** | Multi-tenancy, RBAC, audit logs, subscription tiers, integrations |

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI |
| **State** | TanStack Query v5, Zustand |
| **Database** | Supabase (PostgreSQL 15) with Row-Level Security |
| **Auth** | Supabase Auth |
| **Automation** | Make.com webhooks (server-side proxy) |
| **AI** | OpenAI GPT-4 |
| **i18n** | next-intl (English + Arabic, RTL) |
| **Monitoring** | Sentry |
| **CI/CD** | GitHub Actions + Vercel |

## Getting Started

### Prerequisites
- Node.js 20+, Supabase project, npm

### Installation


> contract-management-system@1.0.0 dev
> next dev

### Database Setup

Run in Supabase SQL Editor:


## Environment Variables

| Variable | Required | Description |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Required | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Required | Supabase anonymous key |
| SUPABASE_SERVICE_ROLE_KEY | Required | Service role key (server-only) |
| NEXTAUTH_SECRET | Required | Session signing secret |
| MAKE_WEBHOOK_CONTRACT | Optional | Make.com contract webhook |
| OPENAI_API_KEY | Optional | AI features |
| HELLOSIGN_API_KEY | Optional | Digital signatures |
| SENTRY_DSN | Optional | Error monitoring |

## Key API Routes

| Route | Methods | Description |
|---|---|---|
| /api/contracts | GET, POST | Contract CRUD |
| /api/contracts/clause-library | GET, POST | Clause library |
| /api/contracts/templates | GET, POST | Contract templates |
| /api/signatures | GET, POST | Digital signatures |
| /api/hr/employees | GET, POST | Employee management |
| /api/hr/leave-requests | GET, POST | Leave requests |
| /api/hr/payroll/runs | GET, POST | Payroll runs |
| /api/hr/onboarding | GET, POST, PATCH | Onboarding workflows |
| /api/crm/communications | GET, POST | Communication log |
| /api/crm/deals | GET, POST | CRM pipeline |
| /api/bookings | GET, POST | Bookings |
| /api/invoices | GET, POST | Invoices |
| /api/analytics/report-builder | GET, POST | Custom reports |
| /api/audit-logs | GET | Audit trail |

## Security

- RBAC enforced on every API route via withRBAC() guard
- RLS policies on every database table scoped to company_id
- CSP headers (no unsafe-eval)
- Webhook URLs are server-side only (no NEXT_PUBLIC_ prefix)
- Audit logs with IP and user agent tracking
- Zod input validation on all endpoints

## Deployment



## Roadmap

| Priority | Feature | Status |
|---|---|---|
| High | DocuSign/HelloSign live integration | In Progress |
| High | Work permit and visa tracking module | Planned |
| High | Full test suite (unit + integration) | Planned |
| Medium | Mobile app (React Native) | Planned |
| Medium | Payment gateway (Stripe/Thawani) | Planned |
| Low | Offline PWA support | Planned |

---
Built with Next.js 14, Supabase, and TypeScript | SmartPRO Enterprise Platform
