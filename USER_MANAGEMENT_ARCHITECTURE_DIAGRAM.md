# 🏗️ User Management & Permissions - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND LAYER (Next.js)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   Admin Users    │  │   Roles & Perms  │  │  User Activity   │          │
│  │      Page        │  │      Page        │  │      Page        │          │
│  │ /admin/users     │  │ /users/roles     │  │ /users/activity  │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                     │                      │
│           └─────────────────────┼─────────────────────┘                      │
│                                 │                                            │
│  ┌──────────────────────────────┴──────────────────────────────┐            │
│  │           User Management Dashboard Component                │            │
│  │  • User CRUD operations    • Bulk actions                   │            │
│  │  • Search & filtering      • Role assignment                │            │
│  │  • Real-time statistics    • Permission management          │            │
│  └──────────────────────────────┬──────────────────────────────┘            │
│                                 │                                            │
└─────────────────────────────────┼────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SECURITY & AUTH LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │  Auth Guard    │  │  Rate Limiter  │  │  JWT Validator │                │
│  │  (Frontend)    │  │   (Upstash)    │  │   (Supabase)   │                │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘                │
│           │                   │                   │                          │
│           └───────────────────┼───────────────────┘                          │
│                               │                                              │
│  ┌────────────────────────────┴────────────────────────────┐                │
│  │              RBAC Guard (lib/rbac/guard.ts)             │                │
│  │  • checkPermission()      • withRBAC() HOC             │                │
│  │  • checkAnyPermission()   • withAnyRBAC() HOC          │                │
│  │  • guardPermission()      • Enforcement modes          │                │
│  └────────────────────────────┬────────────────────────────┘                │
│                               │                                              │
└───────────────────────────────┼──────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (Next.js API Routes)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│  │  User Management  │  │  Role Management  │  │     Permission    │       │
│  │      APIs         │  │       APIs        │  │       APIs        │       │
│  ├───────────────────┤  ├───────────────────┤  ├───────────────────┤       │
│  │ GET /users        │  │ GET /roles        │  │ GET /permissions  │       │
│  │ POST /users       │  │ POST /roles       │  │ GET /users/[id]/  │       │
│  │ PUT /users/[id]   │  │ PUT /roles/[id]   │  │     permissions   │       │
│  │ DELETE /users/[id]│  │ DELETE /roles/[id]│  │ POST /users/[id]/ │       │
│  │ GET /users/       │  │ GET /users/roles  │  │     permissions   │       │
│  │   management      │  │                   │  │                   │       │
│  │ POST /users/      │  │                   │  │                   │       │
│  │   management      │  │                   │  │                   │       │
│  └───────┬───────────┘  └───────┬───────────┘  └───────┬───────────┘       │
│          │                      │                      │                     │
│          └──────────────────────┼──────────────────────┘                     │
│                                 │                                            │
└─────────────────────────────────┼────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │              Permission Evaluator (lib/rbac/evaluate.ts)     │           │
│  │  • evaluatePermission()    • hasAnyPermission()             │           │
│  │  • hasAllPermissions()     • Context evaluation             │           │
│  └────────────────────────────┬─────────────────────────────────┘           │
│                               │                                              │
│  ┌────────────────────────────┴─────────────────────────────────┐           │
│  │            Permission Cache (lib/rbac/cache.ts)              │           │
│  │  • 15-minute TTL           • Redis support                   │           │
│  │  • User permissions cache  • Automatic fallback to DB        │           │
│  └────────────────────────────┬─────────────────────────────────┘           │
│                               │                                              │
│  ┌────────────────────────────┴─────────────────────────────────┐           │
│  │              Audit Logger (lib/rbac/audit.ts)                │           │
│  │  • Permission checks      • Role changes                     │           │
│  │  • User actions           • Security events                  │           │
│  └────────────────────────────┬─────────────────────────────────┘           │
│                               │                                              │
└───────────────────────────────┼──────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER (PostgreSQL + Supabase)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │                         Core Tables                             │         │
│  ├────────────────────────────────────────────────────────────────┤         │
│  │                                                                 │         │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │         │
│  │  │    users     │  │    roles     │  │   permissions    │     │         │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────────┤     │         │
│  │  │ id           │  │ id           │  │ id               │     │         │
│  │  │ email        │  │ name         │  │ resource         │     │         │
│  │  │ full_name    │  │ category     │  │ action           │     │         │
│  │  │ role         │  │ description  │  │ scope            │     │         │
│  │  │ status       │  │ created_at   │  │ name             │     │         │
│  │  │ phone        │  │ updated_at   │  │ description      │     │         │
│  │  │ department   │  └──────┬───────┘  └──────┬───────────┘     │         │
│  │  │ created_at   │         │                 │                 │         │
│  │  │ updated_at   │         │                 │                 │         │
│  │  └──────┬───────┘         │                 │                 │         │
│  │         │                 │                 │                 │         │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┘         │
│            │                 │                 │                           │
│  ┌─────────┴─────────────────┴─────────────────┴─────────────────┐         │
│  │                    Mapping Tables                              │         │
│  ├────────────────────────────────────────────────────────────────┤         │
│  │                                                                 │         │
│  │  ┌───────────────────────┐  ┌──────────────────────────┐       │         │
│  │  │  role_permissions     │  │ user_role_assignments    │       │         │
│  │  ├───────────────────────┤  ├──────────────────────────┤       │         │
│  │  │ role_id               │  │ id                       │       │         │
│  │  │ permission_id         │  │ user_id                  │       │         │
│  │  │ created_at            │  │ role_id                  │       │         │
│  │  └───────────────────────┘  │ assigned_by              │       │         │
│  │                             │ valid_from               │       │         │
│  │                             │ valid_until              │       │         │
│  │                             │ is_active                │       │         │
│  │                             │ context (JSONB)          │       │         │
│  │                             └──────────────────────────┘       │         │
│  └─────────────────────────────────────────────────────────────────┘         │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │                     Audit & Activity Tables                     │         │
│  ├────────────────────────────────────────────────────────────────┤         │
│  │                                                                 │         │
│  │  ┌──────────────────────┐  ┌──────────────────────────┐        │         │
│  │  │    audit_logs        │  │  user_activity_log       │        │         │
│  │  ├──────────────────────┤  ├──────────────────────────┤        │         │
│  │  │ id                   │  │ id                       │        │         │
│  │  │ user_id              │  │ user_id                  │        │         │
│  │  │ event_type           │  │ action                   │        │         │
│  │  │ permission           │  │ resource_type            │        │         │
│  │  │ resource             │  │ resource_id              │        │         │
│  │  │ action               │  │ details (JSONB)          │        │         │
│  │  │ result               │  │ ip_address               │        │         │
│  │  │ ip_address           │  │ user_agent               │        │         │
│  │  │ timestamp            │  │ created_at               │        │         │
│  │  └──────────────────────┘  └──────────────────────────┘        │         │
│  └─────────────────────────────────────────────────────────────────┘         │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │              Materialized View (for performance)                │         │
│  ├────────────────────────────────────────────────────────────────┤         │
│  │                                                                 │         │
│  │  ┌──────────────────────────────────────────────────────┐      │         │
│  │  │            user_permissions (MV)                     │      │         │
│  │  ├──────────────────────────────────────────────────────┤      │         │
│  │  │ Optimized view of user permissions                   │      │         │
│  │  │ • user_id + all their permissions                    │      │         │
│  │  │ • Joined from roles & role_permissions               │      │         │
│  │  │ • Refreshed on role assignment changes               │      │         │
│  │  │ • Indexed for fast lookups                           │      │         │
│  │  └──────────────────────────────────────────────────────┘      │         │
│  └─────────────────────────────────────────────────────────────────┘         │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │                    Security Features                            │         │
│  ├────────────────────────────────────────────────────────────────┤         │
│  │  • Row Level Security (RLS) on all tables                      │         │
│  │  • Strategic indexes on key columns                            │         │
│  │  • Foreign key constraints                                     │         │
│  │  • Automatic timestamp updates (triggers)                      │         │
│  │  • Built-in permission check functions                         │         │
│  │  • Materialized view auto-refresh                              │         │
│  └────────────────────────────────────────────────────────────────┘         │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### User Creation Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Admin   │────▶│ Frontend │────▶│   API    │────▶│ Database │
│   User   │     │   Page   │     │  Route   │     │  (RLS)   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                 │                 │                 │
     │ 1. Click       │                 │                 │
     │    "Create"    │                 │                 │
     │                │                 │                 │
     │                │ 2. POST /users  │                 │
     │                │────────────────▶│                 │
     │                │                 │                 │
     │                │                 │ 3. Validate     │
     │                │                 │    auth token   │
     │                │                 │                 │
     │                │                 │ 4. Check RBAC   │
     │                │                 │    (admin?)     │
     │                │                 │                 │
     │                │                 │ 5. INSERT user  │
     │                │                 │────────────────▶│
     │                │                 │                 │
     │                │                 │ 6. RLS Check    │
     │                │                 │    (passed)     │
     │                │                 │                 │
     │                │                 │◀────────────────│
     │                │                 │ 7. User created │
     │                │                 │                 │
     │                │ 8. Success      │                 │
     │                │◀────────────────│                 │
     │                │                 │                 │
     │ 9. Show        │                 │                 │
     │    success     │                 │                 │
     │    toast       │                 │                 │
     │◀───────────────│                 │                 │
```

### Permission Check Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────▶│  Action  │────▶│   RBAC   │────▶│  Cache/  │
│  Request │     │ Attempt  │     │  Guard   │     │    DB    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                 │                 │                 │
     │ 1. Try to      │                 │                 │
     │    perform     │                 │                 │
     │    action      │                 │                 │
     │                │                 │                 │
     │                │ 2. Check perm   │                 │
     │                │    required     │                 │
     │                │────────────────▶│                 │
     │                │                 │                 │
     │                │                 │ 3. Get user ID  │
     │                │                 │    from JWT     │
     │                │                 │                 │
     │                │                 │ 4. Check cache  │
     │                │                 │────────────────▶│
     │                │                 │                 │
     │                │                 │ 5. Cache hit/   │
     │                │                 │    miss         │
     │                │                 │◀────────────────│
     │                │                 │                 │
     │                │                 │ 6. If miss,     │
     │                │                 │    query DB     │
     │                │                 │────────────────▶│
     │                │                 │                 │
     │                │                 │ 7. Return       │
     │                │                 │    permissions  │
     │                │                 │◀────────────────│
     │                │                 │                 │
     │                │                 │ 8. Evaluate     │
     │                │                 │    permission   │
     │                │                 │                 │
     │                │                 │ 9. Log audit    │
     │                │                 │────────────────▶│
     │                │                 │                 │
     │                │ 10. Allow/Deny  │                 │
     │                │◀────────────────│                 │
     │                │                 │                 │
     │ 11. Action     │                 │                 │
     │     result     │                 │                 │
     │◀───────────────│                 │                 │
```

## Component Relationships

```
┌────────────────────────────────────────────────────────────┐
│                    User Management Pages                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Admin/Users  │  │ Users/Roles  │  │Users/Activity│     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
└───────────────────────────┼────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│              User Management Dashboard Component            │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │           useUserManagement Hook                │       │
│  │  • State management                             │       │
│  │  • API calls                                    │       │
│  │  • Data transformation                          │       │
│  └─────────────────┬───────────────────────────────┘       │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│                      API Routes                             │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ /api/users/      │  │ /api/users/      │               │
│  │   management     │  │   roles          │               │
│  └────────┬─────────┘  └────────┬─────────┘               │
│           │                     │                          │
│           └─────────────────────┴─────────┐                │
│                                           │                │
└───────────────────────────────────────────┼────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────┐
│                    RBAC Layer                               │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Guard     │  │  Evaluate   │  │   Cache     │        │
│  └─────┬───────┘  └─────┬───────┘  └─────┬───────┘        │
│        │                │                │                 │
│        └────────────────┴────────────────┘                 │
│                         │                                  │
└─────────────────────────┼──────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│                    Database                                 │
│                                                             │
│  users ───▶ user_role_assignments ───▶ roles               │
│                                           │                 │
│                                           ▼                 │
│                                    role_permissions         │
│                                           │                 │
│                                           ▼                 │
│                                      permissions            │
│                                                             │
│  Materialized View: user_permissions                        │
│  (Optimized join of all above tables)                      │
└────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌────────────────────────────────────────────────────────────┐
│                      Layer 1: Transport                     │
│  • HTTPS/TLS                                               │
│  • Secure headers                                          │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                Layer 2: Authentication                      │
│  • JWT token validation                                    │
│  • Supabase auth                                           │
│  • Session management                                      │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                  Layer 3: Rate Limiting                     │
│  • Upstash Redis                                           │
│  • Per-endpoint limits                                     │
│  • IP-based tracking                                       │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│              Layer 4: Authorization (RBAC)                  │
│  • Permission checking                                     │
│  • Role validation                                         │
│  • Context evaluation                                      │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│           Layer 5: Row Level Security (RLS)                 │
│  • Database-level policies                                 │
│  • User isolation                                          │
│  • Data protection                                         │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                   Layer 6: Audit Logging                    │
│  • All actions logged                                      │
│  • Permission checks recorded                              │
│  • Security events tracked                                 │
└────────────────────────────────────────────────────────────┘
```

## Performance Optimization Flow

```
Request
   │
   ├─▶ 1. Check Permission Cache (15-min TTL)
   │      │
   │      ├─▶ Cache Hit? ──YES──▶ Return Cached Permissions
   │      │
   │      └─▶ Cache Miss? ──YES──▶ 2. Query Materialized View
   │                                     │
   │                                     ├─▶ Found? ──YES──▶ Return Permissions
   │                                     │                    + Update Cache
   │                                     │
   │                                     └─▶ Not Found? ──YES──▶ 3. Direct DB Query
   │                                                                  │
   │                                                                  └─▶ Return Permissions
   │                                                                      + Update Cache
   │
   └─▶ Process Request with Permissions
```

This architecture ensures:
- ✅ Fast permission checks (cache first)
- ✅ Reliable fallback (materialized view → direct query)
- ✅ Minimal database load
- ✅ Sub-second response times


