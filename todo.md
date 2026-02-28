# SmartPRO Enterprise Platform — Production Readiness TODO

## Phase 1: Security Hardening & Project Structure
- [ ] Move all NEXT_PUBLIC_ webhook URLs to server-only env vars + proxy API routes
- [ ] Tighten Content Security Policy (remove unsafe-eval, unsafe-inline)
- [ ] Remove authentication bypass in /api/generate-contract
- [ ] Update @sentry/nextjs to latest (v8)
- [ ] Enable Sentry with proper DSN configuration
- [ ] Clean up root directory (move .md/.sql/.sh/.ps1 files to /docs and /scripts)
- [ ] Enable CI/CD pipeline (re-enable ci.yml, add proper secrets)

## Phase 2: Contract & Document Module
- [ ] Implement e-signature-service.ts (DocuSign/HelloSign integration)
- [ ] Build signature-pad component with backend persistence
- [ ] Build clause library service (CRUD for reusable clauses)
- [ ] Build clause library UI (manage, search, insert into contracts)
- [ ] Build dynamic contract template engine (user-created templates)
- [ ] Build template management UI (create, edit, preview templates)
- [ ] Add contract version control (track changes, diff view)
- [ ] Add full-text search for contracts and documents

## Phase 3: HR Module Completion
- [ ] Build recruitment module: job postings page + API
- [ ] Build recruitment module: applications tracking page + API
- [ ] Build applicant tracking system (ATS) kanban board
- [ ] Build structured onboarding workflow (checklist + tasks)
- [ ] Build offboarding workflow (exit checklist, asset return, settlement)
- [ ] Enhance payroll: tax calculation and deductions
- [ ] Enhance payroll: payslip PDF generation
- [ ] Add leave management: request, approve, balance tracking
- [ ] Add performance review module

## Phase 4: CRM Module
- [ ] Build communication log (log emails, calls, meetings per contact)
- [ ] Build sales pipeline / deals tracker (kanban + list view)
- [ ] Build opportunity management (create, assign, track deals)
- [ ] Complete marketplace: payment processing integration
- [ ] Complete marketplace: provider ratings and reviews
- [ ] Complete marketplace: service discovery and search
- [ ] Build client portal with self-service contract access

## Phase 5: Analytics & Reporting
- [ ] Complete custom report builder (finish report-builder.tsx)
- [ ] Add scheduled report delivery (email PDF reports)
- [ ] Add contract analytics: approval time, rejection rate, value trends
- [ ] Add HR analytics: headcount, turnover, attendance heatmap
- [ ] Add CRM analytics: pipeline conversion, deal velocity
- [ ] Fix audit log to use proper audit_logs table (not webhook_logs)
- [ ] Add real-time dashboard refresh via Supabase subscriptions

## Phase 6: Code Quality & Testing
- [ ] **Routing consolidation:** Phased cutover pages/ → app/ (see `docs/ROUTING_MIGRATION.md`)
- [ ] Reduce `any` type usage in critical paths (auth, contracts, RBAC)
- [ ] Consolidate 9 login form components into 1 unified component
- [ ] Consolidate multiple dashboard variants into role-based single component
- [ ] Add unit tests for auth service
- [ ] Add unit tests for RBAC guard
- [ ] Add unit tests for contract generation
- [ ] Add unit tests for HR payroll service
- [ ] Add integration tests for contract approval workflow
- [ ] Add E2E tests for HR module
- [ ] Replace console.log with structured logger across all files
- [ ] Fix i18n: replace hardcoded strings with translation keys

## Phase 7: Database & Infrastructure
- [ ] Add missing database migration for clause_library table
- [ ] Add missing database migration for contract_templates table
- [ ] Add missing database migration for recruitment tables
- [ ] Add missing database migration for communication_logs table
- [ ] Add missing database migration for deals/pipeline table
- [ ] Add missing database migration for audit_logs proper table
- [ ] Add missing database migration for digital_signatures table
- [ ] Add proper indexes for all new tables
- [ ] Add RLS policies for all new tables
- [ ] Validate all existing migrations run cleanly in sequence
