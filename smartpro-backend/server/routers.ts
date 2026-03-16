import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import {
  createAuditLog,
  createAttachment,
  createCommunication,
  createServiceCase,
  createServiceRequest,
  generateCaseNumber,
  getDashboardStats,
  getServiceCaseByRequestId,
  getServiceCaseById,
  getServiceRequestById,
  listAttachments,
  listCommunications,
  listServiceCases,
  listServiceRequests,
  listServiceTypes,
  listUsers,
  updateAttachmentStatus,
  updateServiceCase,
  updateServiceRequest,
  updateUserRole,
  upsertJobRecord,
} from "./db";

// ─── RBAC helpers ─────────────────────────────────────────────────────────────

const REVIEWER_ROLES = ["reviewer", "coordinator", "operations_admin", "platform_admin", "super_admin", "admin"];
const ADMIN_ROLES = ["operations_admin", "platform_admin", "super_admin", "admin"];
const SUPER_ROLES = ["platform_admin", "super_admin", "admin"];

function requireRole(roles: string[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }
    return next({ ctx });
  });
}

const reviewerProcedure = requireRole(REVIEWER_ROLES);
const adminProcedure = requireRole(ADMIN_ROLES);
const superAdminProcedure = requireRole(SUPER_ROLES);

// ─── AI Intake Helper ─────────────────────────────────────────────────────────

async function runAIIntake(
  _requestId: number,
  serviceTypeName: string,
  description: string,
  formData: unknown
) {
  try {
    const prompt = `Analyze this service request:
Service Type: ${serviceTypeName}
Description: ${description || "No description provided"}
Form Data: ${JSON.stringify(formData || {})}

Respond with JSON:
{
  "summary": "2-3 sentence summary in English",
  "summaryAr": "2-3 sentence summary in Arabic",
  "confidenceScore": 0.85,
  "flags": ["flag1"],
  "priority": "medium",
  "estimatedComplexity": "standard",
  "missingDocuments": [],
  "recommendations": ["rec1"]
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an AI intake specialist for SmartPRO, an Oman-based business services platform. Analyze service requests and provide structured assessments. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "intake_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              summaryAr: { type: "string" },
              confidenceScore: { type: "number" },
              flags: { type: "array", items: { type: "string" } },
              priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
              estimatedComplexity: { type: "string" },
              missingDocuments: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
            },
            required: ["summary", "summaryAr", "confidenceScore", "flags", "priority", "estimatedComplexity", "missingDocuments", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    if (!content) throw new Error("No AI response");
    return JSON.parse(content);
  } catch (e) {
    console.error("[AI Intake] Failed:", e);
    return {
      summary: "Intake analysis pending manual review.",
      summaryAr: "تحليل الطلب في انتظار المراجعة اليدوية.",
      confidenceScore: 0.5,
      flags: [] as string[],
      priority: "medium",
      estimatedComplexity: "standard",
      missingDocuments: [] as string[],
      recommendations: [] as string[],
    };
  }
}

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ─────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Service Types ────────────────────────────────────────────────────────
  serviceTypes: router({
    list: publicProcedure.query(async () => listServiceTypes(true)),
  }),

  // ─── Service Requests ─────────────────────────────────────────────────────
  serviceRequests: router({
    create: protectedProcedure
      .input(z.object({
        serviceTypeId: z.number().int().positive(),
        titleEn: z.string().min(3).max(500).optional(),
        descriptionEn: z.string().max(5000).optional(),
        applicantName: z.string().max(255).optional(),
        applicantEmail: z.string().email().optional(),
        applicantPhone: z.string().max(32).optional(),
        formData: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const caseNumber = await generateCaseNumber();
        const serviceTypesList = await listServiceTypes(false);
        const serviceType = serviceTypesList.find((st) => st.id === input.serviceTypeId);
        const jobId = `intake-${caseNumber}-${Date.now()}`;

        await createServiceRequest({
          serviceTypeId: input.serviceTypeId,
          titleEn: input.titleEn,
          descriptionEn: input.descriptionEn,
          applicantName: input.applicantName,
          applicantEmail: input.applicantEmail,
          applicantPhone: input.applicantPhone,
          formData: input.formData ?? null,
          caseNumber,
          clientUserId: ctx.user.id,
          status: "submitted",
          submittedAt: new Date(),
          intakeJobId: jobId,
        } as any);

        await upsertJobRecord({
          jobId,
          queueName: "intake",
          jobType: "ai_intake",
          entityType: "service_request",
          status: "waiting",
        });

        // Run AI intake asynchronously
        setImmediate(async () => {
          try {
            const requests = await listServiceRequests({ clientUserId: ctx.user.id });
            const created = requests.find((r) => r.caseNumber === caseNumber);
            if (!created) return;

            await updateServiceRequest(created.id, { status: "intake_processing" });
            await upsertJobRecord({ jobId, queueName: "intake", jobType: "ai_intake", entityType: "service_request", entityId: created.id, status: "active" });

            const analysis = await runAIIntake(
              created.id,
              serviceType?.nameEn ?? "Unknown Service",
              input.descriptionEn ?? "",
              input.formData
            );

            await updateServiceRequest(created.id, {
              status: "intake_complete",
              aiSummary: analysis.summary,
              aiConfidenceScore: String(analysis.confidenceScore),
              aiFlags: JSON.stringify(analysis.flags),
            });

            await createServiceCase(created.id);

            await upsertJobRecord({ jobId, queueName: "intake", jobType: "ai_intake", entityType: "service_request", entityId: created.id, status: "completed", result: analysis });

            await createCommunication({
              serviceRequestId: created.id,
              messageType: "status_update",
              subject: "Request Received & Processed",
              bodyEn: `Your request ${caseNumber} has been received and processed. ${analysis.summary}`,
              bodyAr: `تم استلام طلبك ${caseNumber} ومعالجته. ${analysis.summaryAr}`,
            });

            await createAuditLog({
              userId: ctx.user.id,
              action: "ai_intake_complete",
              entityType: "service_request",
              entityId: created.id,
              newValues: { caseNumber, confidenceScore: analysis.confidenceScore },
            });
          } catch (e) {
            console.error("[Intake Job] Failed:", e);
            await upsertJobRecord({ jobId, queueName: "intake", jobType: "ai_intake", status: "failed", errorMessage: String(e) });
          }
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "service_request_created",
          entityType: "service_request",
          newValues: { caseNumber, serviceTypeId: input.serviceTypeId },
        });

        return { caseNumber, jobId };
      }),

    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const isReviewer = REVIEWER_ROLES.includes(ctx.user.role);
        return listServiceRequests({
          clientUserId: isReviewer ? undefined : ctx.user.id,
          status: input?.status,
          limit: input?.limit,
          offset: input?.offset,
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const request = await getServiceRequestById(input.id);
        if (!request) throw new TRPCError({ code: "NOT_FOUND" });
        const isReviewer = REVIEWER_ROLES.includes(ctx.user.role);
        if (!isReviewer && request.clientUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const [attachmentsList, comms, serviceCase] = await Promise.all([
          listAttachments(input.id),
          listCommunications(input.id),
          getServiceCaseByRequestId(input.id),
        ]);
        return { ...request, attachments: attachmentsList, communications: comms, serviceCase };
      }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const request = await getServiceRequestById(input.id);
        if (!request) throw new TRPCError({ code: "NOT_FOUND" });
        if (request.clientUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (!["draft", "submitted"].includes(request.status)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot cancel a request in this state" });
        }
        await updateServiceRequest(input.id, { status: "cancelled" });
        await createAuditLog({ userId: ctx.user.id, action: "request_cancelled", entityType: "service_request", entityId: input.id });
        return { success: true };
      }),
  }),

  // ─── Service Cases ────────────────────────────────────────────────────────
  serviceCases: router({
    queue: reviewerProcedure
      .input(z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const isAdmin = ADMIN_ROLES.includes(ctx.user.role);
        const cases = await listServiceCases({
          assignedReviewerId: isAdmin ? undefined : ctx.user.id,
          status: input?.status,
          priority: input?.priority,
          limit: input?.limit,
          offset: input?.offset,
        });
        const enriched = await Promise.all(
          cases.map(async (c) => {
            const request = await getServiceRequestById(c.serviceRequestId);
            return { ...c, request };
          })
        );
        return enriched;
      }),

    get: reviewerProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const serviceCase = await getServiceCaseById(input.id);
        if (!serviceCase) throw new TRPCError({ code: "NOT_FOUND" });
        const request = await getServiceRequestById(serviceCase.serviceRequestId);
        const [attachmentsList, comms] = await Promise.all([
          request ? listAttachments(request.id) : Promise.resolve([]),
          request ? listCommunications(request.id) : Promise.resolve([]),
        ]);
        return { ...serviceCase, request, attachments: attachmentsList, communications: comms };
      }),

    assign: adminProcedure
      .input(z.object({
        caseId: z.number().int().positive(),
        reviewerId: z.number().int().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const serviceCase = await getServiceCaseById(input.caseId);
        if (!serviceCase) throw new TRPCError({ code: "NOT_FOUND" });
        await updateServiceCase(input.caseId, { assignedReviewerId: input.reviewerId, status: "assigned" });
        await createAuditLog({ userId: ctx.user.id, action: "case_assigned", entityType: "service_case", entityId: input.caseId, newValues: { reviewerId: input.reviewerId } });
        return { success: true };
      }),

    submitReview: reviewerProcedure
      .input(z.object({
        caseId: z.number().int().positive(),
        decision: z.enum(["approved", "rejected", "deferred"]),
        decisionReason: z.string().min(10).max(2000),
        reviewerNotes: z.string().max(5000).optional(),
        internalNotes: z.string().max(5000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const serviceCase = await getServiceCaseById(input.caseId);
        if (!serviceCase) throw new TRPCError({ code: "NOT_FOUND" });
        const isAssigned = serviceCase.assignedReviewerId === ctx.user.id;
        const isAdmin = ADMIN_ROLES.includes(ctx.user.role);
        if (!isAssigned && !isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Not assigned to this case" });

        await updateServiceCase(input.caseId, {
          decision: input.decision,
          decisionReason: input.decisionReason,
          reviewerNotes: input.reviewerNotes,
          internalNotes: input.internalNotes,
          status: "resolved",
          decisionAt: new Date(),
        });

        const requestStatus = input.decision === "approved" ? "approved" : input.decision === "rejected" ? "rejected" : "under_review";
        await updateServiceRequest(serviceCase.serviceRequestId, { status: requestStatus as any });

        await createCommunication({
          serviceRequestId: serviceCase.serviceRequestId,
          fromUserId: ctx.user.id,
          messageType: "status_update",
          subject: `Decision: ${input.decision.toUpperCase()}`,
          bodyEn: `Your request has been ${input.decision}. Reason: ${input.decisionReason}`,
          bodyAr: `تم ${input.decision === "approved" ? "قبول" : "رفض"} طلبك. السبب: ${input.decisionReason}`,
        });

        await createAuditLog({ userId: ctx.user.id, action: "review_submitted", entityType: "service_case", entityId: input.caseId, newValues: { decision: input.decision } });
        return { success: true };
      }),

    updatePriority: reviewerProcedure
      .input(z.object({
        caseId: z.number().int().positive(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateServiceCase(input.caseId, { priority: input.priority });
        await createAuditLog({ userId: ctx.user.id, action: "priority_updated", entityType: "service_case", entityId: input.caseId, newValues: { priority: input.priority } });
        return { success: true };
      }),
  }),

  // ─── Attachments ──────────────────────────────────────────────────────────
  attachments: router({
    upload: protectedProcedure
      .input(z.object({
        serviceRequestId: z.number().int().positive(),
        filename: z.string().min(1).max(500),
        mimeType: z.string().min(1).max(128),
        fileSize: z.number().int().positive().max(20 * 1024 * 1024),
        fileBase64: z.string(),
        documentType: z.enum(["identity", "proof_of_address", "supporting", "legal", "financial", "medical", "other"]).default("other"),
      }))
      .mutation(async ({ ctx, input }) => {
        const request = await getServiceRequestById(input.serviceRequestId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND" });
        const isReviewer = REVIEWER_ROLES.includes(ctx.user.role);
        if (!isReviewer && request.clientUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const buffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.filename.split(".").pop() ?? "bin";
        const storageKey = `attachments/${request.caseNumber ?? input.serviceRequestId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url } = await storagePut(storageKey, buffer, input.mimeType);

        await createAttachment({
          serviceRequestId: input.serviceRequestId,
          uploadedByUserId: ctx.user.id,
          filename: storageKey,
          originalName: input.filename,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          storageKey,
          storageUrl: url,
          documentType: input.documentType,
          validationStatus: "pending",
        });

        await createAuditLog({ userId: ctx.user.id, action: "attachment_uploaded", entityType: "attachment", newValues: { filename: input.filename, serviceRequestId: input.serviceRequestId } });
        return { success: true, url };
      }),

    list: protectedProcedure
      .input(z.object({ serviceRequestId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const request = await getServiceRequestById(input.serviceRequestId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND" });
        const isReviewer = REVIEWER_ROLES.includes(ctx.user.role);
        if (!isReviewer && request.clientUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return listAttachments(input.serviceRequestId);
      }),

    updateStatus: reviewerProcedure
      .input(z.object({
        attachmentId: z.number().int().positive(),
        validationStatus: z.enum(["pending", "valid", "invalid", "requires_review"]),
        validationNotes: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateAttachmentStatus(input.attachmentId, input.validationStatus, input.validationNotes);
        await createAuditLog({ userId: ctx.user.id, action: "attachment_status_updated", entityType: "attachment", entityId: input.attachmentId, newValues: { validationStatus: input.validationStatus } });
        return { success: true };
      }),
  }),

  // ─── Communications ───────────────────────────────────────────────────────
  communications: router({
    list: protectedProcedure
      .input(z.object({ serviceRequestId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const request = await getServiceRequestById(input.serviceRequestId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND" });
        const isReviewer = REVIEWER_ROLES.includes(ctx.user.role);
        if (!isReviewer && request.clientUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return listCommunications(input.serviceRequestId);
      }),

    send: protectedProcedure
      .input(z.object({
        serviceRequestId: z.number().int().positive(),
        subject: z.string().max(500).optional(),
        bodyEn: z.string().min(1).max(5000),
        messageType: z.enum(["client_message", "reviewer_note", "request_info"]).default("client_message"),
      }))
      .mutation(async ({ ctx, input }) => {
        const request = await getServiceRequestById(input.serviceRequestId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND" });
        await createCommunication({
          serviceRequestId: input.serviceRequestId,
          fromUserId: ctx.user.id,
          messageType: input.messageType,
          subject: input.subject,
          bodyEn: input.bodyEn,
        });
        return { success: true };
      }),
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(async () => getDashboardStats()),

    listUsers: adminProcedure
      .input(z.object({ role: z.string().optional() }).optional())
      .query(async ({ input }) => listUsers({ role: input?.role })),

    updateUserRole: superAdminProcedure
      .input(z.object({
        userId: z.number().int().positive(),
        role: z.enum(["client_user", "reviewer", "coordinator", "operations_admin", "platform_admin"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserRole(input.userId, input.role);
        await createAuditLog({ userId: ctx.user.id, action: "user_role_updated", entityType: "user", entityId: input.userId, newValues: { role: input.role } });
        return { success: true };
      }),

    listReviewers: adminProcedure.query(async () => listUsers({ role: "reviewer" })),
  }),
});

export type AppRouter = typeof appRouter;
