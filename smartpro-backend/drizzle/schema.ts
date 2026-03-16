import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  decimal,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", [
    "user",
    "admin",
    "client_user",
    "reviewer",
    "coordinator",
    "operations_admin",
    "platform_admin",
    "super_admin",
  ])
    .default("client_user")
    .notNull(),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  preferredLanguage: mysqlEnum("preferredLanguage", ["en", "ar"]).default("en"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Service Types ────────────────────────────────────────────────────────────

export const serviceTypes = mysqlTable("service_types", {
  id: int("id").autoincrement().primaryKey(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  descriptionEn: text("descriptionEn"),
  descriptionAr: text("descriptionAr"),
  category: varchar("category", { length: 100 }),
  estimatedDays: int("estimatedDays").default(7),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServiceType = typeof serviceTypes.$inferSelect;

// ─── Service Requests ─────────────────────────────────────────────────────────

export const serviceRequests = mysqlTable(
  "service_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    caseNumber: varchar("caseNumber", { length: 32 }).unique(),
    clientUserId: int("clientUserId").notNull(),
    serviceTypeId: int("serviceTypeId").notNull(),
    status: mysqlEnum("status", [
      "draft",
      "submitted",
      "intake_processing",
      "intake_complete",
      "under_review",
      "pending_info",
      "approved",
      "rejected",
      "cancelled",
    ])
      .default("draft")
      .notNull(),
    titleEn: varchar("titleEn", { length: 500 }),
    titleAr: varchar("titleAr", { length: 500 }),
    descriptionEn: text("descriptionEn"),
    descriptionAr: text("descriptionAr"),
    applicantName: varchar("applicantName", { length: 255 }),
    applicantEmail: varchar("applicantEmail", { length: 320 }),
    applicantPhone: varchar("applicantPhone", { length: 32 }),
    formData: json("formData"),
    aiSummary: text("aiSummary"),
    aiConfidenceScore: decimal("aiConfidenceScore", { precision: 5, scale: 2 }),
    aiFlags: json("aiFlags"),
    intakeJobId: varchar("intakeJobId", { length: 128 }),
    submittedAt: timestamp("submittedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("idx_sr_client").on(t.clientUserId),
    index("idx_sr_status").on(t.status),
    index("idx_sr_service_type").on(t.serviceTypeId),
  ]
);

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = typeof serviceRequests.$inferInsert;

// ─── Service Cases ────────────────────────────────────────────────────────────

export const serviceCases = mysqlTable(
  "service_cases",
  {
    id: int("id").autoincrement().primaryKey(),
    serviceRequestId: int("serviceRequestId").notNull().unique(),
    assignedReviewerId: int("assignedReviewerId"),
    assignedCoordinatorId: int("assignedCoordinatorId"),
    status: mysqlEnum("status", [
      "open",
      "assigned",
      "in_review",
      "pending_info",
      "escalated",
      "resolved",
      "closed",
    ])
      .default("open")
      .notNull(),
    priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
    reviewerNotes: text("reviewerNotes"),
    internalNotes: text("internalNotes"),
    decision: mysqlEnum("decision", ["approved", "rejected", "deferred", "pending"]).default(
      "pending"
    ),
    decisionReason: text("decisionReason"),
    decisionAt: timestamp("decisionAt"),
    dueDate: timestamp("dueDate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("idx_case_reviewer").on(t.assignedReviewerId),
    index("idx_case_status").on(t.status),
    index("idx_case_request").on(t.serviceRequestId),
  ]
);

export type ServiceCase = typeof serviceCases.$inferSelect;
export type InsertServiceCase = typeof serviceCases.$inferInsert;

// ─── Attachments ──────────────────────────────────────────────────────────────

export const attachments = mysqlTable(
  "attachments",
  {
    id: int("id").autoincrement().primaryKey(),
    serviceRequestId: int("serviceRequestId").notNull(),
    uploadedByUserId: int("uploadedByUserId").notNull(),
    filename: varchar("filename", { length: 500 }).notNull(),
    originalName: varchar("originalName", { length: 500 }).notNull(),
    mimeType: varchar("mimeType", { length: 128 }).notNull(),
    fileSize: int("fileSize").notNull(),
    storageKey: varchar("storageKey", { length: 1000 }).notNull(),
    storageUrl: text("storageUrl").notNull(),
    documentType: mysqlEnum("documentType", [
      "identity",
      "proof_of_address",
      "supporting",
      "legal",
      "financial",
      "medical",
      "other",
    ]).default("other"),
    validationStatus: mysqlEnum("validationStatus", [
      "pending",
      "valid",
      "invalid",
      "requires_review",
    ]).default("pending"),
    validationNotes: text("validationNotes"),
    isRequired: boolean("isRequired").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("idx_att_request").on(t.serviceRequestId),
    index("idx_att_uploader").on(t.uploadedByUserId),
  ]
);

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    action: varchar("action", { length: 128 }).notNull(),
    entityType: varchar("entityType", { length: 64 }).notNull(),
    entityId: int("entityId"),
    oldValues: json("oldValues"),
    newValues: json("newValues"),
    ipAddress: varchar("ipAddress", { length: 64 }),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("idx_audit_user").on(t.userId),
    index("idx_audit_entity").on(t.entityType, t.entityId),
    index("idx_audit_created").on(t.createdAt),
  ]
);

export type AuditLog = typeof auditLogs.$inferSelect;

// ─── Job Queue Tracking ───────────────────────────────────────────────────────

export const jobQueue = mysqlTable(
  "job_queue",
  {
    id: int("id").autoincrement().primaryKey(),
    jobId: varchar("jobId", { length: 128 }).notNull().unique(),
    queueName: varchar("queueName", { length: 64 }).notNull(),
    jobType: varchar("jobType", { length: 64 }).notNull(),
    entityType: varchar("entityType", { length: 64 }),
    entityId: int("entityId"),
    status: mysqlEnum("status", [
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed",
    ]).default("waiting"),
    payload: json("payload"),
    result: json("result"),
    errorMessage: text("errorMessage"),
    attempts: int("attempts").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("idx_job_entity").on(t.entityType, t.entityId),
    index("idx_job_status").on(t.status),
  ]
);

export type JobQueueRecord = typeof jobQueue.$inferSelect;

// ─── Communications ───────────────────────────────────────────────────────────

export const communications = mysqlTable(
  "communications",
  {
    id: int("id").autoincrement().primaryKey(),
    serviceRequestId: int("serviceRequestId").notNull(),
    fromUserId: int("fromUserId"),
    toUserId: int("toUserId"),
    messageType: mysqlEnum("messageType", [
      "system",
      "reviewer_note",
      "client_message",
      "status_update",
      "request_info",
    ]).default("system"),
    subject: varchar("subject", { length: 500 }),
    bodyEn: text("bodyEn"),
    bodyAr: text("bodyAr"),
    isRead: boolean("isRead").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("idx_comm_request").on(t.serviceRequestId)]
);

export type Communication = typeof communications.$inferSelect;
