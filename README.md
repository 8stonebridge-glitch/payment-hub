# Payment Hub — Convex Setup Guide

## Why Convex?

- **No SQL** — schema defined in JavaScript
- **No RLS policies** — access rules in plain code
- **Real-time automatic** — UI updates instantly when data changes
- **One command deploys** — no database migrations
- **Seed data in JS** — run one function, done

**Time required:** ~15 minutes

---

## Prerequisites

- Node.js v18+ → [nodejs.org](https://nodejs.org)
- A code editor (VS Code recommended)

---

## Step 1: Install & Init (5 minutes)

```bash
# Open terminal in the project folder
cd payment-hub

# Install dependencies
npm install

# Initialize Convex (creates your free cloud project)
npx convex dev
```

When prompted:
- **Create a new project?** → Yes
- **Project name?** → `payment-hub`
- **Link it?** → Yes

This will:
- Create your Convex cloud project (free)
- Generate your `VITE_CONVEX_URL` automatically in `.env.local`
- Deploy your schema + functions
- Start watching for changes

**Leave this terminal running** — it auto-deploys as you code.

---

## Step 2: Seed Data (1 minute)

Open a **second terminal**:

```bash
npx convex run seed:run
```

You should see: `"Seeded: 2 companies + 6 users + counter"`

That's it — your database now has:
- 2 companies (QuickMove, AeroCool)
- 6 users (3 requesters, 2 admins, 1 finance)
- Payment ref counter

**Verify in dashboard:** Go to [dashboard.convex.dev](https://dashboard.convex.dev) → your project → Data tab. You'll see all tables populated.

---

## Step 3: Start the App (1 minute)

In the first terminal (with `npx convex dev` running), open a new terminal:

```bash
npm run dev:frontend
```

Open `http://localhost:3000` — Payment Hub is running!

**Or run both together:**
```bash
npm run dev
```

---

## Step 4: Test Login

All test users have the password: **`password123`**

| Email | Role | Company |
|-------|------|---------|
| `adebayo@quickmove.ng` | Requester | QuickMove |
| `fatima@quickmove.ng` | Requester | QuickMove |
| `emeka@aerocool.ng` | Requester | AeroCool |
| `chidinma@paymenthub.ng` | Admin | All |
| `tolu@paymenthub.ng` | Admin | All |
| `olumide@paymenthub.ng` | Finance | All |

---

## Step 5: Deploy to Vercel (5 minutes)

### Push to GitHub

```bash
git init
git add .
git commit -m "Payment Hub with Convex"

# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/payment-hub.git
git branch -M main
git push -u origin main
```

### Deploy

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub
2. Click **Add New → Project** → import `payment-hub`
3. Add **Environment Variable**:
   - Key: `VITE_CONVEX_URL`
   - Value: (copy from your `.env.local` file)
4. Click **Deploy**
5. Live in ~1 minute!

### Set Convex production deployment

```bash
npx convex deploy
```

This pushes your schema + functions to production (separate from dev).

---

## Project Structure

```
payment-hub/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.local                    ← Auto-generated (your Convex URL)
│
├── convex/                       ← ALL BACKEND CODE
│   ├── schema.ts                 ← Tables & indexes (like SQL schema but JS)
│   ├── auth.ts                   ← Login, sessions, auth helpers
│   ├── seed.ts                   ← One-click seed: companies + users
│   ├── companies.ts              ← List, get, create companies
│   ├── users.ts                  ← List users
│   ├── requests.ts               ← All request logic (create, approve, pay...)
│   └── _generated/               ← Auto-generated types (don't edit)
│
└── src/
    ├── main.jsx                  ← Entry point with ConvexProvider
    ├── App.jsx                   ← Current prototype UI
    └── lib/
        └── convex.js             ← React hooks (useAuth, useRequests, etc.)
```

---

## How to Connect the UI to Convex

The file `src/lib/convex.js` has ready-to-use React hooks. Here's how to wire them in:

### 1. Replace the login page

```jsx
import { useAuth } from './lib/convex';

function App() {
  const { user, token, login, logout, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <LoginPage onLogin={login} />;

  // user = { _id, name, email, role, company }
  return <MainApp user={user} token={token} onLogout={logout} />;
}

// In LoginPage:
const handleLogin = async (email, password) => {
  try {
    await login(email, password);
  } catch (err) {
    alert(err.message); // "Invalid email or password"
  }
};
```

### 2. Replace mock data with live queries

```jsx
import { useRequests, useCompanies } from './lib/convex';

function MainApp({ user, token }) {
  const { companies } = useCompanies(token);
  const {
    requests,      // ← auto-updates in real-time!
    createRequest,
    approve,
    reject,
    recall,
    pay,
    requestProof,
    uploadProof,
    resubmit,
  } = useRequests(token);

  // These work exactly like your current handlers:
  const doApprove = (id) => approve(id);
  const doReject = (id, reason, note) => reject(id, reason, note);
  const doPay = (reqId, liId) => pay(reqId, liId); // auto-generates ref!
  const doRecall = (id) => recall(id);
}
```

### 3. Real-time is automatic

With Convex, when Admin approves a request, Finance sees it instantly — no refresh, no polling, no WebSocket setup. The `useQuery` hooks re-render automatically.

---

## Adding New Users

### Via Convex Dashboard
1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project → **Data** tab → `users` table
3. Click **Add document** and fill in:

```json
{
  "email": "newuser@company.ng",
  "passwordHash": "h_1bkl6gf",
  "name": "New User",
  "role": "requester",
  "company": "quickmove",
  "isActive": true
}
```

> Note: `h_1bkl6gf` is the hash for "password123". For a different password, you can create a quick Convex function to hash it.

### Via Terminal
```bash
npx convex run auth:signUp '{"email":"new@company.ng","password":"pass123","name":"New User","role":"requester","company":"quickmove"}'
```

---

## Adding New Companies

Use the Add Company button in the app (admin only), or via dashboard:

```json
{
  "companyId": "swifthaulage",
  "name": "Swift Haulage Ltd",
  "short": "SHL",
  "color": "#FF6B6B",
  "categories": ["Fuel", "Maintenance", "Tolls", "Others"],
  "prefix": {"Fuel": "SF", "Maintenance": "SM", "Tolls": "ST", "Others": "SO"}
}
```

---

## Convex vs Supabase Comparison

| Feature | Supabase | Convex |
|---------|----------|--------|
| Schema | SQL files | JavaScript |
| Auth | Dashboard + SQL | Built-in functions |
| Access control | RLS policies (SQL) | JS functions |
| Real-time | Enable per table | Automatic |
| Seed data | Manual SQL scripts | `npx convex run seed:run` |
| Deploy | Separate DB + host | One command |
| Debug | SQL logs | Dashboard with live data |
| Setup time | ~30-60 min | ~15 min |

---

## Cost

| | Free Tier | Covers |
|--|-----------|--------|
| **Convex** | 1M function calls/mo, 1GB storage | Small-medium business |
| **Vercel** | 100GB bandwidth, custom domains | Production traffic |

**Total: $0** to start. Paid plans only needed at scale.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npx convex dev` fails | Make sure Node.js v18+ is installed |
| "Not authenticated" | Token expired — log out and back in |
| Seed already run | Check dashboard → Data tab. Delete all docs to re-seed |
| Schema change errors | `npx convex dev` auto-deploys changes. Check terminal for errors |
| Functions not updating | Make sure `npx convex dev` is running in background |

---

## Next Steps

1. ✅ Download and unzip
2. ✅ `npm install`
3. ✅ `npx convex dev` (creates project + deploys)
4. ✅ `npx convex run seed:run` (adds users + companies)
5. ✅ `npm run dev:frontend` (start app)
6. ✅ Push to GitHub + deploy on Vercel
