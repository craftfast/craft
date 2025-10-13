# Authentication Setup Guide

This guide explains how to set up authentication for Craft, including Google OAuth, GitHub OAuth, and Email/Password authentication.

## 🔐 Authentication Methods

Craft supports three authentication methods:

1. **Google OAuth** - Sign in with Google account
2. **GitHub OAuth** - Sign in with GitHub account
3. **Email + Password** - Traditional email/password authentication

## 📋 Prerequisites

- PostgreSQL database (already configured via Neon)
- NextAuth.js v4 installed
- Environment variables configured

## 🚀 Quick Start

### 1. Database is Already Migrated

The auth tables have been created in your database:

- `users` - User accounts
- `accounts` - OAuth provider accounts
- `sessions` - User sessions
- `verification_tokens` - Email verification tokens

### 2. Environment Variables

Your `.env` file already has the required variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Database
DATABASE_URL="your-postgresql-connection-string"
```

### 3. OAuth Provider Setup

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://craft.tech/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret to your `.env` file

#### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - Application name: `Craft`
   - Homepage URL: `http://localhost:3000` or `https://craft.tech`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Generate a new client secret
6. Copy the Client ID and Client Secret to your `.env` file

## 🎯 Authentication Flow

### User Registration (Sign Up)

```
1. User visits /auth/signup
2. Chooses auth method:
   - Google → Redirects to Google consent screen
   - GitHub → Redirects to GitHub authorization
   - Email → Fills out registration form
3. Account created in database
4. User automatically signed in
5. Redirected to / (dashboard)
```

### User Login (Sign In)

```
1. User visits /auth/signin
2. Chooses auth method
3. Credentials verified
4. Session created
5. Redirected to intended page or /
```

### Session Management

- **Strategy**: JWT (JSON Web Tokens)
- **Storage**: Secure httpOnly cookies
- **Expiration**: 30 days (default)
- **Refresh**: Automatic on page load

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/
│   │       │   └── route.ts         # NextAuth API handler
│   │       └── register/
│   │           └── route.ts         # Email registration endpoint
│   └── auth/
│       ├── signin/
│       │   └── page.tsx            # Sign-in page
│       ├── signup/
│       │   └── page.tsx            # Sign-up page
│       └── error/
│           └── page.tsx            # Error page
├── components/
│   └── SessionProvider.tsx         # Client-side session provider
└── lib/
    └── auth.ts                     # NextAuth configuration
```

## 🔧 Configuration Details

### NextAuth Options

```typescript
// src/lib/auth.ts

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),     // Database adapter
  providers: [                         // Auth providers
    GoogleProvider({ ... }),
    GitHubProvider({ ... }),
    CredentialsProvider({ ... }),
  ],
  session: {
    strategy: "jwt",                  // Use JWT for sessions
  },
  pages: {
    signIn: "/auth/signin",           // Custom sign-in page
    error: "/auth/error",             // Custom error page
  },
  callbacks: {
    jwt: { ... },                     // JWT customization
    session: { ... },                 // Session customization
  },
};
```

### Password Security

- **Hashing**: bcryptjs with 12 salt rounds
- **Minimum Length**: 8 characters
- **Storage**: Hashed password stored in `users.password`

## 🧪 Testing Authentication

### Test Email/Password Auth

```bash
# Sign up with email
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "test1234",
  "name": "Test User"
}

# Sign in
POST /api/auth/signin/credentials
{
  "email": "test@example.com",
  "password": "test1234"
}
```

### Test OAuth

1. Click "Continue with Google" or "Continue with GitHub"
2. Complete OAuth flow in popup/redirect
3. Check database for new user record
4. Verify session created

## 🐛 Troubleshooting

### OAuth Errors

**Error**: "Callback URL mismatch"

- **Solution**: Make sure redirect URIs match exactly in OAuth app settings

**Error**: "Invalid client"

- **Solution**: Double-check Client ID and Client Secret in `.env`

### Email/Password Errors

**Error**: "User already exists"

- **Solution**: User is already registered, use sign-in instead

**Error**: "Invalid credentials"

- **Solution**: Check email/password are correct

### Session Issues

**Error**: "Session required"

- **Solution**: User needs to sign in first

**Error**: "NEXTAUTH_SECRET not set"

- **Solution**: Add NEXTAUTH_SECRET to `.env` file

## 🔒 Security Best Practices

✅ **Implemented**:

- Password hashing with bcrypt
- Secure httpOnly cookies
- CSRF protection (built into NextAuth)
- OAuth 2.0 security
- Environment variables for secrets

🔜 **Recommended** (Future):

- Email verification
- Two-factor authentication (2FA)
- Rate limiting on auth endpoints
- Password reset flow
- Account recovery options

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Guide](https://docs.github.com/en/developers/apps/building-oauth-apps)

## 🎉 You're All Set!

Authentication is now fully configured. Users can:

- Sign up with Google, GitHub, or Email
- Sign in to access protected pages
- Have their session persist across page loads
- Sign out securely

Start the dev server and test it out:

```bash
npm run dev
```

Visit `http://localhost:3000/auth/signin` to test!
