import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple hash for demo — in production use Clerk or bcrypt via action
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(36);
}

function generateToken() {
  return "tok_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 14);
}

// ── Sign In ─────────────────────────────────────────────────
export const signIn = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!user) throw new Error("Invalid email or password");
    if (!user.isActive) throw new Error("Account is disabled");
    if (user.passwordHash !== simpleHash(password)) throw new Error("Invalid email or password");

    // Clean up old sessions for this user
    const oldSessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    for (const s of oldSessions) {
      await ctx.db.delete(s._id);
    }

    // Create new session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
    };
  },
});

// ── Sign Out ────────────────────────────────────────────────
export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (session) await ctx.db.delete(session._id);
  },
});

// ── Get Current User (from token) ───────────────────────────
export const me = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!token) return null;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) return null;

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
    };
  },
});

// ── Helper: Validate session and return user (for use in other functions) ──
export async function getAuthUser(ctx, token) {
  if (!token) throw new Error("Not authenticated");
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) throw new Error("Session expired");
  const user = await ctx.db.get(session.userId);
  if (!user || !user.isActive) throw new Error("Account not found");
  return user;
}

// ── Utility: hash a password (used in seed) ─────────────────
export { simpleHash };
