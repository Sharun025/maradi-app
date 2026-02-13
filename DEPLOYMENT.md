# Maradi App – GitHub & Vercel Deployment Guide

## 1. Push to GitHub

### Create a new repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `maradi-app` (or your preferred name)
3. Choose **Private** or **Public**
4. Do **not** initialize with README, .gitignore, or license
5. Click **Create repository**

### Push from your local project

From the project root (`maradi-app`):

```bash
cd /Users/sharun/Documents/cursor/maradi-app/maradi-app

# Add the remote (replace YOUR_USERNAME and YOUR_REPO with your values)
git remote add origin https://github.com/YOUR_USERNAME/maradi-app.git

# Commit (if not done yet)
git add -A
git commit -m "Initial commit: Maradi app with web + mobile"

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 2. Deploy on Vercel

### Import the project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your `maradi-app` repo (after it’s pushed to GitHub)
3. Or use **Import Git Repository** and select the repository

### Project settings (auto-detected for Turborepo)

Vercel should detect the Turborepo setup and set:

- **Root Directory:** `.` (repo root) — **must be repo root** so workspace deps (@repo/database, etc.) resolve
- **Framework:** Next.js
- **Build Command:** `npx turbo run build --filter=...web` (the `...web` ensures dependencies are built first)

**If you see "Can't resolve '@repo/database'":** Go to **Project Settings → General → Root Directory** and set it to **`.`** (or leave empty). Do not set it to `apps/web`.
- **Output Directory:** (auto-detected from Next.js)

### Environment variables

Add these in **Project Settings → Environment Variables** on Vercel:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Neon, Supabase) | Yes |
| `JWT_SECRET` | JWT signing secret (32+ chars, random) | Yes |
| `REFRESH_SECRET` | Refresh token secret (32+ chars, random) | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | For uploads |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | For uploads |
| `RESEND_API_KEY` | Resend API key (for OTP emails) | For auth |
| `RESEND_FROM_EMAIL` | From email for OTP | Optional |
| `RESEND_FROM_NAME` | From name for OTP | Optional |

### Deploy

Click **Deploy** and wait for the build to finish. Vercel will give you a URL like `https://maradi-app-xxx.vercel.app`.

---

## 3. Continuous deployment

After the first deploy, every push to `main` will trigger a new deployment. Preview branches are deployed as preview URLs.

---

## 4. Database setup for production

For production you typically use a hosted PostgreSQL service:

- **Neon** – [neon.tech](https://neon.tech)
- **Supabase** – [supabase.com](https://supabase.com)
- **Vercel Postgres** – [vercel.com/storage/postgres](https://vercel.com/storage/postgres)

Create a database and set `DATABASE_URL` in Vercel. Run migrations with:

```bash
npx prisma migrate deploy
```

(This can be run locally against the production DB or added to a deploy step.)
