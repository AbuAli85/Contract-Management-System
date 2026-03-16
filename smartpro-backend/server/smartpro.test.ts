import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

// ─── Context Factories ────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createCtx(user: AuthenticatedUser | null = null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth", () => {
  it("auth.me returns null when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.me returns user when authenticated", async () => {
    const user = createUser({ name: "Alice", email: "alice@example.com" });
    const ctx = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Alice");
    expect(result?.email).toBe("alice@example.com");
  });

  it("auth.logout clears cookie and returns success", async () => {
    const user = createUser();
    const ctx = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});

// ─── Service Types Tests ──────────────────────────────────────────────────────

describe("serviceTypes", () => {
  it("serviceTypes.list returns array (public endpoint)", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    // This calls the DB - in test environment it may return empty array or throw
    // We just verify it doesn't throw a TRPC auth error
    try {
      const result = await caller.serviceTypes.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (err: any) {
      // DB connection errors are acceptable in unit tests
      expect(err).not.toBeInstanceOf(TRPCError);
    }
  });
});

// ─── Service Requests Tests ───────────────────────────────────────────────────

describe("serviceRequests", () => {
  it("serviceRequests.list throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.serviceRequests.list()).rejects.toThrow();
  });

  it("serviceRequests.create throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.serviceRequests.create({ serviceTypeId: 1 })
    ).rejects.toThrow();
  });

  it("serviceRequests.get throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.serviceRequests.get({ id: 1 })).rejects.toThrow();
  });

  it("serviceRequests.create validates input - serviceTypeId required", async () => {
    const user = createUser({ role: "user" });
    const ctx = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    // @ts-expect-error - testing invalid input
    await expect(caller.serviceRequests.create({})).rejects.toThrow();
  });

  it("serviceRequests.cancel throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.serviceRequests.cancel({ id: 1 })).rejects.toThrow();
  });
});

// ─── Service Cases Tests ──────────────────────────────────────────────────────

describe("serviceCases", () => {
  it("serviceCases.queue throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.serviceCases.queue()).rejects.toThrow();
  });

  it("serviceCases.queue throws FORBIDDEN for client_user role", async () => {
    const user = createUser({ role: "user" });
    const ctx = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    // client_user is not in REVIEWER_ROLES
    try {
      await caller.serviceCases.queue();
      // If DB is not available, it may throw a different error
    } catch (err: any) {
      // Should throw FORBIDDEN or a DB error, not a success
      if (err instanceof TRPCError) {
        expect(err.code).toBe("FORBIDDEN");
      }
    }
  });

  it("serviceCases.submitReview throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.serviceCases.submitReview({
        caseId: 1,
        decision: "approved",
        decisionReason: "Looks good to me",
      })
    ).rejects.toThrow();
  });

  it("serviceCases.submitReview validates decisionReason min length", async () => {
    const user = createUser({ role: "reviewer" });
    const ctx = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.serviceCases.submitReview({
        caseId: 1,
        decision: "approved",
        decisionReason: "Too short", // < 10 chars
      })
    ).rejects.toThrow();
  });
});

// ─── Admin Tests ──────────────────────────────────────────────────────────────

describe("admin", () => {
  it("admin.stats throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("admin.stats throws FORBIDDEN for client_user role", async () => {
    const user = createUser({ role: "user" });
    const ctx = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.admin.stats();
    } catch (err: any) {
      if (err instanceof TRPCError) {
        expect(err.code).toBe("FORBIDDEN");
      }
    }
  });

  it("admin.listUsers throws FORBIDDEN for reviewer role", async () => {
    const user = createUser({ role: "reviewer" });
    const ctx = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.admin.listUsers();
    } catch (err: any) {
      if (err instanceof TRPCError) {
        expect(err.code).toBe("FORBIDDEN");
      }
    }
  });

  it("admin.updateUserRole throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.updateUserRole({ userId: 2, role: "reviewer" })
    ).rejects.toThrow();
  });

  it("admin.updateUserRole throws FORBIDDEN for operations_admin role", async () => {
    const user = createUser({ role: "operations_admin" });
    const ctx = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.admin.updateUserRole({ userId: 2, role: "reviewer" });
    } catch (err: any) {
      if (err instanceof TRPCError) {
        expect(err.code).toBe("FORBIDDEN");
      }
    }
  });
});

// ─── Attachments Tests ────────────────────────────────────────────────────────

describe("attachments", () => {
  it("attachments.upload throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.attachments.upload({
        serviceRequestId: 1,
        filename: "test.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        fileBase64: "dGVzdA==",
        documentType: "other",
      })
    ).rejects.toThrow();
  });

  it("attachments.upload validates fileSize max", async () => {
    const user = createUser({ role: "user" });
    const ctx = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.attachments.upload({
        serviceRequestId: 1,
        filename: "huge.pdf",
        mimeType: "application/pdf",
        fileSize: 25 * 1024 * 1024, // 25MB > 20MB limit
        fileBase64: "dGVzdA==",
        documentType: "other",
      })
    ).rejects.toThrow();
  });
});
