# ClawPulse Deployment Guide

## Prerequisites

1. Vercel account
2. GitHub OAuth App
3. Vercel Postgres database

## Setup

### 1. Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App:
   - Application name: ClawPulse
   - Homepage URL: `https://clawpulse.vercel.app`
   - Authorization callback URL: `https://clawpulse.vercel.app/api/auth/callback/github`
3. Note the Client ID and generate a Client Secret

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to link to your Vercel project
```

### 3. Add Vercel Postgres

1. Go to your project in Vercel dashboard
2. Storage → Create Database → Postgres
3. Connect to your project
4. This will auto-add `POSTGRES_URL` to your environment variables

### 4. Initialize Database

Run the schema file:

```bash
# From Vercel Postgres dashboard, run SQL query:
cat sql/schema.sql
# Copy and paste the contents into the SQL editor
```

Or connect locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull .env.local

# Run migrations (create a simple script or use the Vercel dashboard)
```

### 5. Set Environment Variables

In Vercel project settings, add:

```
NEXTAUTH_URL=https://clawpulse.vercel.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
GITHUB_ID=<your-github-oauth-client-id>
GITHUB_SECRET=<your-github-oauth-client-secret>
```

### 6. Redeploy

```bash
vercel --prod
```

## CLI Publishing

To publish the CLI to npm:

```bash
cd cli
npm login
npm publish
```

Users can then install:

```bash
npm install -g clawpulse
```

## Environment Variables Summary

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | Vercel Postgres connection string | Yes |
| `NEXTAUTH_URL` | Full URL of your deployment | Yes |
| `NEXTAUTH_SECRET` | Random secret for session encryption | Yes |
| `GITHUB_ID` | GitHub OAuth App Client ID | Yes |
| `GITHUB_SECRET` | GitHub OAuth App Client Secret | Yes |

## Local Development

```bash
# Copy environment variables
cp .env.example .env.local

# Add your values to .env.local

# Run dev server
pnpm dev
```

Visit `http://localhost:3000`

## Database Schema Updates

When updating the schema:

1. Update `sql/schema.sql`
2. Run the new migrations in Vercel Postgres dashboard
3. Or create a migration script using Drizzle/Prisma if you prefer

## Monitoring

- Check Vercel dashboard for deployment logs
- Monitor Postgres usage in Vercel Storage
- GitHub OAuth app dashboard for auth stats
