import { v } from "convex/values";
import { query } from "./_generated/server";

// ── List all active users ───────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .collect();
    // Strip password hashes
    return users
      .filter((u) => u.isActive)
      .map(({ passwordHash, ...rest }) => rest);
  },
});

// ── List users by company ───────────────────────────────────
export const byCompany = query({
  args: { company: v.string() },
  handler: async (ctx, { company }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_company", (q) => q.eq("company", company))
      .collect();
    return users
      .filter((u) => u.isActive)
      .map(({ passwordHash, ...rest }) => rest);
  },
});
