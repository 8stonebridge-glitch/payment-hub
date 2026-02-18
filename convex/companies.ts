import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUser } from "./auth";

// ── List all companies ──────────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("companies").collect();
  },
});

// ── Get one company by ID ───────────────────────────────────
export const get = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query("companies")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();
  },
});

// ── Add a new company (admin only) ──────────────────────────
export const create = mutation({
  args: {
    token: v.string(),
    companyId: v.string(),
    name: v.string(),
    short: v.string(),
    color: v.string(),
    categories: v.array(v.string()),
    prefix: v.any(),
  },
  handler: async (ctx, { token, companyId, name, short, color, categories, prefix }) => {
    const user = await getAuthUser(ctx, token);
    if (user.role !== "admin") throw new Error("Only admins can add companies");

    // Check duplicate
    const existing = await ctx.db
      .query("companies")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();
    if (existing) throw new Error("Company already exists");

    return await ctx.db.insert("companies", {
      companyId, name, short, color, categories, prefix,
    });
  },
});
