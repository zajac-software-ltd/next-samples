# Environment Variable Configuration

This document explains the environment variable setup for the Next.js authentication system.

## File Structure

```
/
├── .env.example          # Template with example values (committed to git)
├── .env.local           # Local development secrets (ignored by git)
└── .gitignore           # Ignores .env*.local files
```

## Environment Files

### `.env.example`
- Contains template environment variables
- Shows which variables are required
- Provides examples of expected values
- **Committed to git** for team sharing

### `.env.local`
- Contains actual secrets for local development
- **Never committed to git** (ignored by .gitignore)
- Automatically loaded by Next.js in development
- Takes precedence over other env files

## Setup Instructions

1. **Copy the template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update with real values:**
   Edit `.env.local` and replace placeholder values:
   
   ```bash
   # Generate a secure NextAuth secret
   openssl rand -base64 64
   
   # Generate a password pepper
   node -e "console.log(require('crypto').randomUUID())"
   ```

3. **Never commit secrets:**
   The `.gitignore` is configured to ignore `.env.local`

## Next.js Environment Variable Loading Order

Next.js loads environment variables in this order (later files override earlier ones):

1. `.env`
2. `.env.local` (ignored by git)
3. `.env.development` (when NODE_ENV=development)
4. `.env.development.local` (when NODE_ENV=development, ignored by git)

## Security Best Practices

- ✅ Use `.env.example` as a template
- ✅ Generate strong, random secrets
- ✅ Use different secrets per environment


## Production Deployment

For production, set environment variables through your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Railway: Variables tab
- Docker: docker run -e or docker-compose environment
