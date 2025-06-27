# Authentication System

This Next.js application now includes a complete authentication system with two user levels:

## Features

- **User Registration & Login** - Secure credential-based authentication
- **Role-Based Access Control** - Two user levels: `USER` and `ADMIN`
- **Protected Routes** - Middleware automatically protects routes
- **User Dashboard** - Personal dashboard for authenticated users
- **Admin Panel** - User management interface for admins only
- **Session Management** - JWT-based sessions with NextAuth.js

## User Levels

### 1. Regular User (USER)
- Can access their own dashboard
- Can view and edit their own profile
- Cannot access admin features
- Cannot view other users' data

### 2. Admin User (ADMIN)
- Has all USER permissions
- Can access admin panel
- Can view all users
- Can modify user roles
- Can delete users (except their own account)

## Test Accounts

The system has been seeded with test accounts:

### Admin Account
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** ADMIN

### Regular User Account
- **Email:** `user@example.com`
- **Password:** `user123`
- **Role:** USER

## Routes

### Public Routes
- `/` - Home page
- `/auth/signin` - Login page
- `/auth/signup` - Registration page
- `/users-with-suspense` - Public users page

### Protected Routes (require authentication)
- `/dashboard` - User dashboard
- `/admin/users` - Admin user management (ADMIN only)

### API Routes
- `POST /api/auth/register` - User registration
- `GET /api/admin/users` - Get all users (ADMIN only)
- `GET /api/users/[id]` - Get user by ID (own data or ADMIN)
- `PUT /api/users/[id]` - Update user (own data or ADMIN)
- `DELETE /api/users/[id]` - Delete user (ADMIN only)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your actual values:
   - Database connection string
   - NextAuth secret (generate with `openssl rand -base64 64`)
   - Password pepper (generate with `node -e "console.log(require('crypto').randomUUID())"`)

3. **Set up the database:**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed test users:**
   ```bash
   npm run db:seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Visit the application:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Try logging in with the test accounts

## Environment Variables

The application uses `.env.local` for local development secrets (never committed to git):

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL (http://localhost:3000 for development)
- `NEXTAUTH_SECRET` - Secret for JWT signing (generate with `openssl rand -base64 64`)
- `PASSWORD_PEPPER` - Additional password security (generate with crypto.randomUUID())

### Optional Variables
- Email configuration for future email features
- OAuth provider credentials if using external authentication

### Security Notes
- Never commit `.env.local` to version control
- Use strong, randomly generated secrets
- Rotate secrets regularly in production
- Use different secrets for different environments

## Architecture

### Authentication Flow
1. User submits credentials via login form
2. Credentials validated against database
3. JWT token created with user role
4. Token stored in secure session
5. Middleware checks token for protected routes

### Authorization
- **Route Protection:** Middleware checks authentication status
- **Role-Based Access:** Components check user role for admin features
- **API Security:** Server-side role validation for all API routes

### Database Schema
- **User Model:** Stores user data with role field
- **NextAuth Tables:** Sessions, accounts, verification tokens
- **Role Enum:** `USER` | `ADMIN`

## Security Features

- **Password Hashing:** bcrypt with salt rounds
- **CSRF Protection:** Built into NextAuth.js
- **JWT Security:** Signed tokens with secret
- **Route Protection:** Server-side middleware
- **Role Validation:** Both client and server-side

## Extending the System

### Adding New Roles
1. Update the `UserRole` enum in `prisma/schema.prisma`
2. Run `prisma migrate dev`
3. Update type definitions in `types/next-auth.d.ts`
4. Add role checks in components and API routes

### Adding New Protected Routes
1. Add route patterns to `middleware.ts` config
2. Wrap components with `<ProtectedRoute>`
3. Add role requirements if needed

### Customizing UI
- Auth components are in `/app/auth/`
- Protected components use the `useAuth` hook
- Styling uses Tailwind CSS with dark mode support
