# Maradi App - Turborepo Monorepo

A Turborepo monorepo with Expo React Native (mobile), Next.js (web), shared database (Prisma), and shared types.

## What's inside

### Apps

- **`apps/mobile`** – Expo React Native app (TypeScript)
- **`apps/web`** – Next.js 15 app with App Router (TypeScript, Tailwind CSS)

### Packages

- **`packages/database`** – Prisma with PostgreSQL (shared schema and client)
- **`packages/shared`** – Common types and utilities
- **`packages/ui`** – Shared React components
- **`packages/eslint-config`** – ESLint configs (Next.js, Expo, base)
- **`packages/typescript-config`** – Shared tsconfigs

## Getting started

### Prerequisites

- Node.js >= 18
- PostgreSQL (for database package)
- npm (v11.6.0 recommended)

### Setup

```bash
# Install dependencies
npm install

# Copy database env and set your PostgreSQL URL
cp packages/database/.env.example packages/database/.env
# Edit packages/database/.env and set DATABASE_URL

# Generate Prisma client
cd packages/database && npm run db:generate && cd ../..
```

### Development

```bash
# Run all apps in development
npm run dev

# Run specific app
npm run dev --filter=web
npm run dev --filter=mobile
```

### Build

```bash
# Build all apps and packages
npm run build

# Build specific app
npm run build --filter=web
npm run build --filter=mobile
```

### Linting & formatting

```bash
npm run lint
npm run format
npm run check-types
```

## Database

The `packages/database` package uses Prisma with PostgreSQL:

```bash
cd packages/database

# Generate Prisma client (run after schema changes)
npm run db:generate

# Push schema to database (dev)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

Set `DATABASE_URL` in `packages/database/.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/maradi_db"
```

## Tech stack

- **Mobile**: Expo 54, React Native, TypeScript, Expo Router
- **Web**: Next.js 15, App Router, React 19, Tailwind CSS, TypeScript
- **Database**: Prisma, PostgreSQL
- **Tooling**: ESLint, Prettier, Turborepo
