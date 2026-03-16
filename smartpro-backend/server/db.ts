import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  attachments,
  auditLogs,
  communications,
  InsertAttachment,
  InsertServiceRequest,
  InsertUser,
  jobQueue,
  serviceCases,
  serviceRequests,
  serviceTypes,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  const isOwner = user.openId === ENV.ownerOpenId;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (isOwner) {
    values.role = "super_admin";
    updateSet.role = "super_admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function listUsers(filters?: { role?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.role) conditions.push(eq(users.role, filters.role as any));
  if (filters?.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive));
  return db
    .select()
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: role as any, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── Service Types ────────────────────────────────────────────────────────────

export async function listServiceTypes(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = activeOnly ? [eq(serviceTypes.isActive, true)] : [];
  return db
    .select()
    .from(serviceTypes)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(serviceTypes.category, serviceTypes.nameEn);
}

// ─── Service Requests ─────────────────────────────────────────────────────────

export async function createServiceRequest(data: InsertServiceRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(serviceRequests).values(data);
  return result[0];
}

export async function getServiceRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, id))
    .limit(1);
  return result[0];
}

export async function listServiceRequests(filters?: {
  clientUserId?: number;
  status?: string;
  serviceTypeId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.clientUserId) conditions.push(eq(serviceRequests.clientUserId, filters.clientUserId));
  if (filters?.status) conditions.push(eq(serviceRequests.status, filters.status as any));
  if (filters?.serviceTypeId) conditions.push(eq(serviceRequests.serviceTypeId, filters.serviceTypeId));
  return db
    .select()
    .from(serviceRequests)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(serviceRequests.createdAt))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);
}

export async function updateServiceRequest(
  id: number,
  data: Partial<InsertServiceRequest>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(serviceRequests)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(serviceRequests.id, id));
}

export async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const db = await getDb();
  if (!db) return `SR-${year}-0001`;
  const [row] = await db.execute(
    sql`SELECT COUNT(*) as cnt FROM service_requests WHERE YEAR(createdAt) = ${year}`
  ) as any;
  const count = (row?.[0]?.cnt ?? 0) + 1;
  return `SR-${year}-${String(count).padStart(4, "0")}`;
}

// ─── Service Cases ────────────────────────────────────────────────────────────

export async function createServiceCase(serviceRequestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(serviceCases).values({ serviceRequestId });
}

export async function getServiceCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(serviceCases).where(eq(serviceCases.id, id)).limit(1);
  return result[0];
}

export async function getServiceCaseByRequestId(serviceRequestId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(serviceCases)
    .where(eq(serviceCases.serviceRequestId, serviceRequestId))
    .limit(1);
  return result[0];
}

export async function listServiceCases(filters?: {
  assignedReviewerId?: number;
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.assignedReviewerId)
    conditions.push(eq(serviceCases.assignedReviewerId, filters.assignedReviewerId));
  if (filters?.status) conditions.push(eq(serviceCases.status, filters.status as any));
  if (filters?.priority) conditions.push(eq(serviceCases.priority, filters.priority as any));
  return db
    .select()
    .from(serviceCases)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(serviceCases.createdAt))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);
}

export async function updateServiceCase(
  id: number,
  data: Partial<typeof serviceCases.$inferInsert>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(serviceCases)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(serviceCases.id, id));
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export async function createAttachment(data: InsertAttachment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(attachments).values(data);
  return result[0];
}

export async function listAttachments(serviceRequestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(attachments)
    .where(eq(attachments.serviceRequestId, serviceRequestId))
    .orderBy(desc(attachments.createdAt));
}

export async function getAttachmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);
  return result[0];
}

export async function updateAttachmentStatus(
  id: number,
  validationStatus: string,
  validationNotes?: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(attachments)
    .set({ validationStatus: validationStatus as any, validationNotes, updatedAt: new Date() })
    .where(eq(attachments.id, id));
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function createAuditLog(data: {
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      ...data,
      oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
      newValues: data.newValues ? JSON.stringify(data.newValues) : null,
    } as any);
  } catch (e) {
    console.warn("[Audit] Failed to write audit log:", e);
  }
}

// ─── Job Queue ────────────────────────────────────────────────────────────────

export async function upsertJobRecord(data: {
  jobId: string;
  queueName: string;
  jobType: string;
  entityType?: string;
  entityId?: number;
  status?: string;
  payload?: unknown;
  result?: unknown;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(jobQueue)
    .values({
      ...data,
      status: (data.status ?? "waiting") as any,
      payload: data.payload ? JSON.stringify(data.payload) : null,
      result: data.result ? JSON.stringify(data.result) : null,
    } as any)
    .onDuplicateKeyUpdate({
      set: {
        status: (data.status ?? "waiting") as any,
        result: data.result ? JSON.stringify(data.result) : null,
        errorMessage: data.errorMessage ?? null,
        updatedAt: new Date(),
      },
    });
}

// ─── Communications ───────────────────────────────────────────────────────────

export async function createCommunication(data: {
  serviceRequestId: number;
  fromUserId?: number;
  toUserId?: number;
  messageType?: string;
  subject?: string;
  bodyEn?: string;
  bodyAr?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(communications).values(data as any);
}

export async function listCommunications(serviceRequestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(communications)
    .where(eq(communications.serviceRequestId, serviceRequestId))
    .orderBy(desc(communications.createdAt));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  const [totalRequests] = await db.execute(sql`SELECT COUNT(*) as cnt FROM service_requests`) as any;
  const [pendingCases] = await db.execute(
    sql`SELECT COUNT(*) as cnt FROM service_cases WHERE status IN ('open','assigned','in_review')`
  ) as any;
  const [totalUsers] = await db.execute(sql`SELECT COUNT(*) as cnt FROM users`) as any;
  const [completedToday] = await db.execute(
    sql`SELECT COUNT(*) as cnt FROM service_requests WHERE status IN ('approved','rejected') AND DATE(updatedAt) = CURDATE()`
  ) as any;
  return {
    totalRequests: totalRequests?.[0]?.cnt ?? 0,
    pendingCases: pendingCases?.[0]?.cnt ?? 0,
    totalUsers: totalUsers?.[0]?.cnt ?? 0,
    completedToday: completedToday?.[0]?.cnt ?? 0,
  };
}
