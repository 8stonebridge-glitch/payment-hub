import { mutation } from "./_generated/server";
import { simpleHash } from "./auth";

// ── Run once to seed companies + users ──────────────────────
// Call from Convex dashboard: Functions → seed → run
export const run = mutation({
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("companies").first();
    if (existing) return "Already seeded!";

    // ── Companies ──────────────────────────────────────────
    await ctx.db.insert("companies", {
      companyId: "quickmove",
      name: "QuickMove Logistics",
      short: "QML",
      color: "#00C896",
      categories: ["Repair", "Movement", "Commission", "Others"],
      prefix: { Repair: "QR", Movement: "QM", Commission: "QC", Others: "QO" },
    });

    await ctx.db.insert("companies", {
      companyId: "aerocool",
      name: "AeroCool Services",
      short: "ACS",
      color: "#54A0FF",
      categories: ["Purchase", "Repair", "Logistics", "Others"],
      prefix: { Purchase: "AP", Repair: "AR", Logistics: "AL", Others: "AO" },
    });

    // ── Users (password for all: password123) ──────────────
    const hash = simpleHash("password123");

    await ctx.db.insert("users", {
      email: "adebayo@quickmove.ng",
      passwordHash: hash,
      name: "Adebayo Ogundimu",
      role: "requester",
      company: "quickmove",
      isActive: true,
    });

    await ctx.db.insert("users", {
      email: "fatima@quickmove.ng",
      passwordHash: hash,
      name: "Fatima Bello",
      role: "requester",
      company: "quickmove",
      isActive: true,
    });

    await ctx.db.insert("users", {
      email: "emeka@aerocool.ng",
      passwordHash: hash,
      name: "Emeka Nwosu",
      role: "requester",
      company: "aerocool",
      isActive: true,
    });

    await ctx.db.insert("users", {
      email: "chidinma@paymenthub.ng",
      passwordHash: hash,
      name: "Chidinma Okafor",
      role: "admin",
      company: "all",
      isActive: true,
    });

    await ctx.db.insert("users", {
      email: "tolu@paymenthub.ng",
      passwordHash: hash,
      name: "Tolu Bakare",
      role: "admin",
      company: "all",
      isActive: true,
    });

    await ctx.db.insert("users", {
      email: "olumide@paymenthub.ng",
      passwordHash: hash,
      name: "Olumide Adeyemi",
      role: "finance",
      company: "all",
      isActive: true,
    });

    // ── Payment ref counter ────────────────────────────────
    await ctx.db.insert("counters", { name: "payment_ref", value: 100 });

    return "Seeded: 2 companies + 6 users + counter";
  },
});
