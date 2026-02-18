import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUser } from "./auth";

// ── Helper: generate payment ref ────────────────────────────
async function nextPayRef(ctx) {
  const counter = await ctx.db
    .query("counters")
    .withIndex("by_name", (q) => q.eq("name", "payment_ref"))
    .first();
  const next = (counter?.value || 100) + 1;
  if (counter) {
    await ctx.db.patch(counter._id, { value: next });
  }
  const d = new Date();
  const ds = d.getFullYear().toString()
    + String(d.getMonth() + 1).padStart(2, "0")
    + String(d.getDate()).padStart(2, "0");
  return "TRF-" + ds + "-" + String(next).padStart(3, "0");
}

// ── Helper: generate request ref ────────────────────────────
async function nextReqRef(ctx, company, category, prefix) {
  const catPrefix = prefix?.[category] || "XX";
  const existing = await ctx.db
    .query("requests")
    .withIndex("by_company", (q) => q.eq("company", company))
    .collect();
  const count = existing.filter((r) => r.category === category).length + 1;
  return catPrefix + "-" + String(count).padStart(3, "0");
}

// ── Helper: add timeline event ──────────────────────────────
async function addTimeline(ctx, requestId, actorId, actorName, action, note) {
  await ctx.db.insert("timeline", {
    requestId, actorId, actorName, action, note,
  });
}

// ═══════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════

// ── Get all requests visible to current user ────────────────
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getAuthUser(ctx, token);

    let requests;
    if (user.role === "requester") {
      requests = await ctx.db
        .query("requests")
        .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
        .collect();
    } else {
      // Admin/finance see all
      requests = await ctx.db.query("requests").collect();
    }

    // Attach line items + timeline to each request
    const full = await Promise.all(
      requests.map(async (r) => {
        const lineItems = await ctx.db
          .query("lineItems")
          .withIndex("by_request", (q) => q.eq("requestId", r._id))
          .collect();
        const timeline = await ctx.db
          .query("timeline")
          .withIndex("by_request", (q) => q.eq("requestId", r._id))
          .collect();
        return {
          ...r,
          id: r._id,
          ref_id: r.refId,
          line_items: lineItems
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((li) => ({
              ...li,
              id: li._id,
              payment_for: li.paymentFor,
              unit_price: li.unitPrice,
              is_paid: li.isPaid,
              paid_by: li.paidBy,
              paid_at: li.paidAt,
              payment_ref: li.paymentRef,
              proof_requested: li.proofRequested,
              proof_requested_by: li.proofRequestedBy,
              proof_image_url: li.proofImageUrl,
              beneficiary_name: li.beneficiaryName,
              account_number: li.accountNumber,
              bank_name: li.bankName,
              sort_order: li.sortOrder,
            })),
          timeline: timeline.sort(
            (a, b) => (a._creationTime || 0) - (b._creationTime || 0)
          ).map((t) => ({
            ...t,
            id: t._id,
            actor_name: t.actorName,
            created_at: new Date(t._creationTime).toISOString(),
          })),
          requester_id: r.requesterId,
          total_amount: r.totalAmount,
          approved_by: r.approvedBy,
          approved_at: r.approvedAt,
          rejected_reason: r.rejectedReason,
          rejected_note: r.rejectedNote,
          rejected_by: r.rejectedBy,
          resubmit_count: r.resubmitCount,
          created_at: new Date(r._creationTime).toISOString(),
          updated_at: new Date(r._creationTime).toISOString(),
        };
      })
    );

    return full.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },
});

// ═══════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════

// ── Create new request ──────────────────────────────────────
export const create = mutation({
  args: {
    token: v.string(),
    company: v.string(),
    category: v.string(),
    description: v.string(),
    lineItems: v.array(
      v.object({
        description: v.string(),
        paymentFor: v.optional(v.string()),
        quantity: v.number(),
        unitPrice: v.number(),
        total: v.number(),
        beneficiaryName: v.string(),
        accountNumber: v.string(),
        bankName: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args.token);

    // Get company prefix for ref ID
    const co = await ctx.db
      .query("companies")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.company))
      .first();

    const refId = await nextReqRef(ctx, args.company, args.category, co?.prefix);
    const totalAmount = args.lineItems.reduce((s, li) => s + li.total, 0);

    const requestId = await ctx.db.insert("requests", {
      refId,
      date: new Date().toISOString().split("T")[0],
      company: args.company,
      category: args.category,
      requesterId: user._id,
      description: args.description,
      totalAmount,
      status: "pending",
      resubmitCount: 0,
    });

    // Insert line items
    for (let i = 0; i < args.lineItems.length; i++) {
      const li = args.lineItems[i];
      await ctx.db.insert("lineItems", {
        requestId,
        description: li.description,
        paymentFor: li.paymentFor || "",
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        total: li.total,
        beneficiaryName: li.beneficiaryName,
        accountNumber: li.accountNumber,
        bankName: li.bankName,
        isPaid: false,
        proofRequested: false,
        sortOrder: i,
      });
    }

    await addTimeline(ctx, requestId, user._id, user.name, "submitted", "Request submitted");
    return { requestId, refId };
  },
});

// ── Approve ─────────────────────────────────────────────────
export const approve = mutation({
  args: { token: v.string(), requestId: v.id("requests") },
  handler: async (ctx, { token, requestId }) => {
    const user = await getAuthUser(ctx, token);
    if (user.role !== "admin") throw new Error("Only admins can approve");

    await ctx.db.patch(requestId, {
      status: "approved",
      approvedBy: user._id,
      approvedAt: new Date().toISOString(),
    });

    await addTimeline(ctx, requestId, user._id, user.name, "approved", "Approved for payment");
  },
});

// ── Reject ──────────────────────────────────────────────────
export const reject = mutation({
  args: {
    token: v.string(),
    requestId: v.id("requests"),
    reason: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { token, requestId, reason, note }) => {
    const user = await getAuthUser(ctx, token);
    if (!["admin", "finance"].includes(user.role)) throw new Error("Not authorized");

    await ctx.db.patch(requestId, {
      status: "rejected",
      rejectedBy: user._id,
      rejectedReason: reason,
      rejectedNote: note || "",
    });

    await addTimeline(ctx, requestId, user._id, user.name, "rejected",
      reason + (note ? " — " + note : ""));
  },
});

// ── Recall ──────────────────────────────────────────────────
export const recall = mutation({
  args: { token: v.string(), requestId: v.id("requests") },
  handler: async (ctx, { token, requestId }) => {
    const user = await getAuthUser(ctx, token);
    const request = await ctx.db.get(requestId);
    if (!request || request.requesterId !== user._id) throw new Error("Not your request");

    // Check no payees are paid yet
    const items = await ctx.db
      .query("lineItems")
      .withIndex("by_request", (q) => q.eq("requestId", requestId))
      .collect();
    if (items.some((li) => li.isPaid)) throw new Error("Cannot recall — payments already made");

    await ctx.db.patch(requestId, { status: "recalled" });
    await addTimeline(ctx, requestId, user._id, user.name, "recalled", "Recalled for editing");
  },
});

// ── Pay Line Item ───────────────────────────────────────────
export const payItem = mutation({
  args: {
    token: v.string(),
    requestId: v.id("requests"),
    lineItemId: v.id("lineItems"),
  },
  handler: async (ctx, { token, requestId, lineItemId }) => {
    const user = await getAuthUser(ctx, token);
    if (user.role !== "finance") throw new Error("Only finance can pay");

    const payRef = await nextPayRef(ctx);
    const li = await ctx.db.get(lineItemId);
    if (!li) throw new Error("Line item not found");

    await ctx.db.patch(lineItemId, {
      isPaid: true,
      paidBy: user._id,
      paidAt: new Date().toISOString(),
      paymentRef: payRef,
    });

    // Check if all items paid
    const allItems = await ctx.db
      .query("lineItems")
      .withIndex("by_request", (q) => q.eq("requestId", requestId))
      .collect();
    const allPaid = allItems.every((item) =>
      item._id === lineItemId ? true : item.isPaid
    );
    const anyPaid = true; // we just paid one

    await ctx.db.patch(requestId, {
      status: allPaid ? "paid" : "partially_paid",
    });

    await addTimeline(ctx, requestId, user._id, user.name, "paid",
      `Paid ${li.beneficiaryName} — ${payRef}`);

    return payRef;
  },
});

// ── Request Proof ───────────────────────────────────────────
export const requestProof = mutation({
  args: {
    token: v.string(),
    requestId: v.id("requests"),
    lineItemId: v.id("lineItems"),
  },
  handler: async (ctx, { token, requestId, lineItemId }) => {
    const user = await getAuthUser(ctx, token);
    const li = await ctx.db.get(lineItemId);

    await ctx.db.patch(lineItemId, {
      proofRequested: true,
      proofRequestedBy: user._id,
    });

    await addTimeline(ctx, requestId, user._id, user.name, "proof_requested",
      `Proof requested for ${li?.beneficiaryName}`);
  },
});

// ── Upload Proof ────────────────────────────────────────────
export const uploadProof = mutation({
  args: {
    token: v.string(),
    requestId: v.id("requests"),
    lineItemId: v.id("lineItems"),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { token, requestId, lineItemId, imageUrl }) => {
    const user = await getAuthUser(ctx, token);
    const li = await ctx.db.get(lineItemId);

    await ctx.db.patch(lineItemId, {
      proofImageUrl: imageUrl || "receipt.jpg",
    });

    await addTimeline(ctx, requestId, user._id, user.name, "proof_uploaded",
      `Proof uploaded for ${li?.beneficiaryName}`);
  },
});

// ── Edit & Resubmit ─────────────────────────────────────────
export const resubmit = mutation({
  args: {
    token: v.string(),
    requestId: v.id("requests"),
    description: v.string(),
    category: v.string(),
    lineItems: v.array(
      v.object({
        description: v.string(),
        paymentFor: v.optional(v.string()),
        quantity: v.number(),
        unitPrice: v.number(),
        total: v.number(),
        beneficiaryName: v.string(),
        accountNumber: v.string(),
        bankName: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args.token);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    const totalAmount = args.lineItems.reduce((s, li) => s + li.total, 0);

    await ctx.db.patch(args.requestId, {
      description: args.description,
      category: args.category,
      totalAmount,
      status: "pending",
      rejectedReason: undefined,
      rejectedNote: undefined,
      rejectedBy: undefined,
      resubmitCount: request.resubmitCount + 1,
    });

    // Delete old line items
    const oldItems = await ctx.db
      .query("lineItems")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();
    for (const item of oldItems) {
      await ctx.db.delete(item._id);
    }

    // Insert new line items
    for (let i = 0; i < args.lineItems.length; i++) {
      const li = args.lineItems[i];
      await ctx.db.insert("lineItems", {
        requestId: args.requestId,
        description: li.description,
        paymentFor: li.paymentFor || "",
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        total: li.total,
        beneficiaryName: li.beneficiaryName,
        accountNumber: li.accountNumber,
        bankName: li.bankName,
        isPaid: false,
        proofRequested: false,
        sortOrder: i,
      });
    }

    await addTimeline(ctx, args.requestId, user._id, user.name, "resubmitted", "Edited and resubmitted");
  },
});
