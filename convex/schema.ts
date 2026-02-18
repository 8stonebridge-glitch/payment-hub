import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Companies ─────────────────────────────────────────────
  companies: defineTable({
    companyId: v.string(),       // "quickmove", "aerocool"
    name: v.string(),
    short: v.string(),           // "QML", "ACS"
    color: v.string(),
    categories: v.array(v.string()),
    prefix: v.any(),             // { Repair: "QR", Movement: "QM", ... }
  }).index("by_companyId", ["companyId"]),

  // ── Users / Profiles ──────────────────────────────────────
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),    // simple hash for demo
    name: v.string(),
    role: v.string(),            // "requester" | "admin" | "finance"
    company: v.string(),         // company id or "all"
    isActive: v.boolean(),
  }).index("by_email", ["email"])
    .index("by_company", ["company"])
    .index("by_role", ["role"]),

  // ── Sessions (simple token auth) ──────────────────────────
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  // ── Payment Requests ──────────────────────────────────────
  requests: defineTable({
    refId: v.string(),
    date: v.string(),             // "2026-02-17"
    company: v.string(),
    category: v.string(),
    requesterId: v.id("users"),
    description: v.string(),
    totalAmount: v.number(),      // kobo
    status: v.string(),           // pending|approved|partially_paid|paid|rejected|recalled
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.string()),
    rejectedReason: v.optional(v.string()),
    rejectedNote: v.optional(v.string()),
    rejectedBy: v.optional(v.id("users")),
    resubmitCount: v.number(),
  }).index("by_company", ["company"])
    .index("by_requester", ["requesterId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"])
    .index("by_refId", ["refId"]),

  // ── Line Items ────────────────────────────────────────────
  lineItems: defineTable({
    requestId: v.id("requests"),
    description: v.string(),
    paymentFor: v.optional(v.string()),
    quantity: v.number(),
    unitPrice: v.number(),
    total: v.number(),
    beneficiaryName: v.string(),
    accountNumber: v.string(),
    bankName: v.string(),
    isPaid: v.boolean(),
    paidBy: v.optional(v.id("users")),
    paidAt: v.optional(v.string()),
    paymentRef: v.optional(v.string()),
    proofRequested: v.boolean(),
    proofRequestedBy: v.optional(v.id("users")),
    proofImageUrl: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_request", ["requestId"]),

  // ── Timeline Events ───────────────────────────────────────
  timeline: defineTable({
    requestId: v.id("requests"),
    action: v.string(),
    actorId: v.id("users"),
    actorName: v.string(),
    note: v.optional(v.string()),
  }).index("by_request", ["requestId"]),

  // ── Payment Ref Counter ───────────────────────────────────
  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),
});
