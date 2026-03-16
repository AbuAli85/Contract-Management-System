# SmartPRO - Full-Stack Build TODO

## Phase 1: Database Schema & Migrations
- [x] Extend drizzle schema with all SmartPRO tables (service_requests, service_cases, service_types, attachments, communications, job_records, audit_logs)
- [x] Apply database migrations via webdev_execute_sql
- [x] Seed service types (8 types seeded)

## Phase 2: Backend - Auth & RBAC
- [x] Role enum and user profile table (6 roles: client_user, reviewer, coordinator, operations_admin, platform_admin, super_admin)
- [x] RBAC middleware (requireRole helper, protectedProcedure, reviewerProcedure, adminProcedure, superAdminProcedure)
- [x] Auth procedures: logout, me (via Manus OAuth)
- [x] User profile procedure

## Phase 3: Backend - Service Requests
- [x] Service request CRUD procedures (create, list, get, cancel)
- [x] Service types list procedure
- [x] Intake job trigger on create (setImmediate AI intake)
- [x] AI intake orchestrator (runAIIntake with LLM)

## Phase 4: Backend - Service Cases
- [x] Case list / get procedures
- [x] Reviewer queue procedure (serviceCases.queue)
- [x] Case assignment procedure (serviceCases.assign)
- [x] Review submission procedure (serviceCases.submitReview)
- [x] Priority update procedure (serviceCases.updatePriority)

## Phase 5: Backend - Attachments
- [x] Upload attachment (S3 via storagePut + metadata in DB)
- [x] List attachments by request
- [x] Update attachment status

## Phase 6: Backend - AI Workflows
- [x] AI intake worker (inline via setImmediate, uses invokeLLM)
- [x] Communication creation on intake complete
- [x] Audit logging throughout

## Phase 7: Frontend - Design System & Auth
- [x] Global theme (dark mode, professional design)
- [x] Manus OAuth integration (login/logout via getLoginUrl)
- [x] Protected route pattern (redirect to login if unauthenticated)

## Phase 8: Frontend - Client Flow
- [x] Home landing page with features, workflow, CTA
- [x] New request submission form (NewRequest.tsx)
- [x] Document upload with base64 encoding (NewRequest.tsx)
- [x] My requests list with search and filtering (MyRequests.tsx)
- [x] Request detail with attachments, communications, cancel (RequestDetail.tsx)

## Phase 9: Frontend - Reviewer/Admin Flow
- [x] Reviewer queue dashboard with stats and filters (ReviewerDashboard.tsx)
- [x] Case detail with AI analysis, documents, review form (CaseDetail.tsx)
- [x] Admin panel with stats, user management, role assignment (AdminPanel.tsx)

## Phase 10: Tests & Delivery
- [ ] Vitest tests for key procedures (serviceRequests, serviceCases, admin)
- [ ] Checkpoint and delivery
