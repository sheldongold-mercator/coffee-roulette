# Coffee Roulette - Technical Setup Request

## Project Overview

I've completed the development of **Coffee Roulette**, an internal employee pairing system for Mercator IT Solutions. The application is designed to facilitate monthly coffee meetups between employees across departments to foster cross-team connections and company culture.

**Target Users:** 200+ employees
**Use Case:** Internal only (not public-facing)

---

## What's Been Built

### 1. Backend API (Node.js + Express)
**Location:** `backend/`

**Features:**
- ✅ Complete REST API with 40+ endpoints
- ✅ MySQL database with schema and seed data
- ✅ Smart matching algorithm (prevents recent repeats, balances cross-department pairings)
- ✅ Microsoft OAuth 2.0 authentication with JWT tokens
- ✅ Microsoft Graph API integration for user sync
- ✅ Email notifications (AWS SES)
- ✅ Microsoft Teams webhook notifications with adaptive cards
- ✅ Outlook calendar integration (auto-creates meeting invites)
- ✅ Scheduled jobs (user sync, matching rounds, notification processing)
- ✅ Analytics and reporting endpoints
- ✅ Role-based access control (admin/user)

**Tech Stack:**
- Node.js 18+ with Express
- MySQL 8.0 (Sequelize ORM)
- Passport.js + JWT for authentication
- Docker containerised
- Winston logging
- Cron-based job scheduling

### 2. Admin Dashboard (React)
**Location:** `frontend/`

**Features:**
- ✅ Microsoft OAuth login with MSAL
- ✅ Dashboard with real-time analytics and charts
- ✅ User management (search, filter, sync from Microsoft)
- ✅ Department management (phased rollout controls)
- ✅ Matching round management (trigger, preview, history)
- ✅ Detailed analytics and data exports (CSV)
- ✅ System settings and scheduled job management

**Tech Stack:**
- React 18 with hooks
- Tailwind CSS (modern, polished UI)
- Framer Motion (smooth animations)
- React Query (data fetching/caching)
- Recharts (data visualisation)
- @azure/msal-browser + @azure/msal-react

**Design:** Professional, polished admin interface with custom design system

---

## GitHub Repository

**Repository URL:** https://github.com/sheldongold-mercator/coffee-roulette

**Branch:** `master`
**Latest Commits:**
- Backend: Complete implementation (all 8 phases)
- Frontend: Polished React admin dashboard

---

## What I Need From You (As quick as you are able please)

To complete local testing before AWS deployment, I need Azure AD / Microsoft 365 configuration:

### Azure AD App Registration

**Option 1:** Create a new Azure AD app registration for Coffee Roulette
**Option 2:** Provide access to an existing app registration if suitable

### Required Information:
1. **Azure AD Client ID** (Application/Client ID)
2. **Azure AD Tenant ID** (Directory/Tenant ID)
3. **Azure AD Client Secret** (App secret/key)

### Redirect URIs to Configure:
Please add these redirect URIs to the Azure AD app:

**For Local Development:**
- `http://localhost:3001` (Frontend React dev server)
- `http://localhost:3000/api/auth/microsoft/callback` (Backend API callback)

**For AWS Production (Coming Soon):**
- `https://coffee-roulette.mercator.com` (or whatever subdomain we decide)
- `https://coffee-roulette-api.mercator.com/api/auth/microsoft/callback` (Backend API)

### API Permissions Required:
The app needs these Microsoft Graph API permissions:
- `User.Read` - Read signed-in user's profile
- `User.Read.All` - Read all users' profiles (for sync)
- `Calendars.ReadWrite` - Create calendar events for coffee meetings
- `Mail.Send` (if using Microsoft email instead of AWS SES)

**Type:** Delegated permissions
**Admin Consent:** Required (since we're reading all users)

### Additional Info Needed:
- Do we have AWS SES configured? If not, I can use Microsoft Graph to send emails instead
- Do we have Microsoft Teams webhook URLs for notifications?

---

## Current Status

### ✅ Completed
- Backend API fully implemented and tested
- Frontend admin dashboard completed
- Docker Compose setup for local development
- Database schema with seed data
- All code committed to GitHub

### 🔄 Currently Running Locally
- Backend API: http://localhost:3000 (Docker)
- MySQL Database: localhost:3306 (Docker)
- Frontend Dev Server: http://localhost:3001 (React dev server)

### 🎯 Next Steps (After You Provide Credentials)

**Phase 1: Local Testing**
1. Configure `.env` files with Azure AD credentials
2. Test Microsoft OAuth login flow
3. Test user sync from Microsoft 365
4. Test calendar integration
5. Test email/Teams notifications
6. Full end-to-end testing with real data

**Phase 2: AWS Deployment** (Immediately After Local Testing)
1. Set up AWS infrastructure:
   - EKS (Kubernetes) cluster
   - RDS MySQL instance (or keep containerised)
   - Load balancers
   - SSL certificates
2. Configure subdomains:
   - `coffee-roulette.mercator.com` (Frontend)
   - `coffee-roulette-api.mercator.com` (Backend API)
3. Deploy application to production
4. Configure production Azure AD redirect URIs
5. Set up monitoring and logging

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React Admin Dashboard (Tailwind CSS, Framer Motion)       │
│  - Microsoft OAuth Login (MSAL)                             │
│  - Analytics Dashboard, User Management, Matching           │
│  Port: 3001 (local) → https://coffee-roulette.mercator.com │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/REST API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│  Node.js + Express (Docker Container)                       │
│  - JWT Authentication                                        │
│  - 40+ REST Endpoints                                        │
│  - Matching Algorithm                                        │
│  - Scheduled Jobs (cron)                                     │
│  Port: 3000 (local) → https://coffee-roulette-api.mercator.com
└─────┬──────────────┬──────────────┬────────────────┬────────┘
      │              │              │                │
      ↓              ↓              ↓                ↓
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐
│  MySQL   │  │Microsoft │  │ AWS SES  │  │ MS Teams        │
│ Database │  │ Graph    │  │ Email    │  │ Webhooks        │
│          │  │ API      │  │          │  │                 │
│ - Users  │  │          │  │          │  │ Adaptive Cards  │
│ - Pairs  │  │ - Users  │  │          │  │                 │
│ - Rounds │  │ - Calendar│ │          │  │                 │
└──────────┘  └──────────┘  └──────────┘  └─────────────────┘
```

---

## Environment Variables Needed

Once you provide the Azure AD details, I'll configure these in `.env` files:

**Backend (`backend/.env`):**
```env
MICROSOFT_CLIENT_ID=<provided-by-tech-team>
MICROSOFT_CLIENT_SECRET=<provided-by-tech-team>
MICROSOFT_TENANT_ID=<provided-by-tech-team>
```

**Frontend (`frontend/.env`):**
```env
REACT_APP_AZURE_CLIENT_ID=<provided-by-tech-team>
REACT_APP_AZURE_TENANT_ID=<provided-by-tech-team>
REACT_APP_REDIRECT_URI=http://localhost:3001
```

---

## Security Considerations

- JWT tokens with 7-day expiration
- All passwords hashed with bcrypt
- HTTPS only in production
- Environment variables for all secrets (not committed to Git)
- CORS configured for frontend domain only
- Admin-only endpoints with middleware protection
- Docker containers with non-root users

---

## Timeline

**Urgency:** High Priority

**Estimated Timeline:**
- **Today/Tomorrow:** Need Azure AD credentials from you
- **1-2 Days:** Local testing and validation
- **2-3 Days:** AWS deployment and production setup
- **Target Launch:** End of this week

---

## Questions for You

1. **Azure AD App:** Should I create a new app registration, or do you want to handle that?
2. **Subdomain Preferences:** Any preference on subdomain names? (`coffee-roulette.mercator.dev` vs `coffee.mercator.dev`, etc.)
3. **AWS Account:** Which AWS account should I deploy to? Do I need access provisioned?
4. **Email Provider:** Should I use AWS SES or Microsoft Graph API for sending emails?
5. **Teams Notifications:** Do we have existing Teams webhook URLs, or should I create new ones?

---

## How to Help

**Most Urgent:**
1. Provide Azure AD Client ID, Tenant ID, and Client Secret
2. Configure the redirect URIs in Azure AD app
3. Grant admin consent for the required API permissions

**Also Needed Soon:**
1. AWS account access for deployment
2. Subdomain configuration/DNS access
3. Teams webhook URLs (if we want Teams notifications)

---

## Contact

Feel free to reach out if you have any questions or need clarification on any of the technical details. I'm ready to proceed with local testing as soon as I have the Azure AD credentials.

Thanks for your help with this!

**Sheldon Gold**
