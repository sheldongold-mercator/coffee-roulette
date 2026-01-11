# Coffee Roulette - Claude Code Context

## Project Overview

Coffee Roulette is an internal web application for Mercator IT Solutions that facilitates random employee pairing for monthly coffee meetings. It promotes cross-department collaboration and team building.

**Target Users:** 200+ employees (internal only)

## Tech Stack

### Backend (`/backend`)
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MySQL 8.0
- **ORM:** Sequelize
- **Authentication:** Passport.js with Azure AD OAuth 2.0, JWT tokens
- **Scheduling:** node-cron
- **Email:** AWS SES via Nodemailer
- **Process Manager:** PM2
- **Logging:** Winston (JSON format)

### Frontend (`/frontend`)
- **Framework:** React 18
- **Styling:** Tailwind CSS with custom design system
- **Animations:** Framer Motion
- **State/Data:** React Query, React Context
- **Auth:** MSAL (Microsoft Authentication Library)
- **Charts:** Recharts
- **Code Editor:** Monaco Editor (for template management)

## Project Structure

```
coffee-roulette/
├── backend/
│   └── src/
│       ├── config/         # Database, passport, Graph API config
│       ├── controllers/    # Request handlers (adminXxxController.js pattern)
│       ├── jobs/           # Cron job definitions
│       ├── middleware/     # Auth, validation, error handling
│       ├── models/         # Sequelize models (PascalCase.js)
│       ├── routes/         # API route definitions
│       ├── services/       # Business logic (xxxService.js pattern)
│       ├── templates/      # Email/Teams notification templates
│       └── utils/          # Helpers, logger
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── config/         # MSAL configuration
│       ├── contexts/       # React Context providers
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Route page components
│       └── services/       # API client (api.js)
└── kubernetes/             # K8s deployment manifests
```

## Key Commands

### Backend
```bash
cd /var/www/coffee-roulette/backend
npm run dev          # Development with nodemon
npm start            # Production start
npm test             # Run tests
node init-db.js      # Sync database models
pm2 restart coffee-roulette  # Restart production server
pm2 logs coffee-roulette     # View logs
```

### Frontend
```bash
cd /var/www/coffee-roulette/frontend
npm start            # Development server (port 3001)
npm run build        # Production build
npm test             # Run tests
```

## Coding Conventions

### Backend
- **Controllers:** `adminXxxController.js` for admin endpoints, handle request/response only
- **Services:** `xxxService.js` for business logic, singleton exports (`module.exports = new XxxService()`)
- **Models:** PascalCase filenames, registered in `models/index.js`
- **Routes:** Grouped under `/api/admin/*` for admin, `/api/public/*` for unauthenticated
- **Error Handling:** Use `next(error)` pattern, centralised error middleware
- **Logging:** Use Winston logger (`require('../utils/logger')`)

### Frontend
- **Components:** PascalCase filenames, functional components with hooks
- **Pages:** One component per route in `/pages`
- **API Calls:** Use `api.js` service with React Query for data fetching
- **Styling:** Tailwind utility classes, custom `.btn`, `.card`, `.input` classes
- **Icons:** Heroicons (`@heroicons/react/24/outline`)
- **Animations:** Framer Motion for page transitions and micro-interactions

### General
- **No emojis** in code or comments unless user requests
- **Prefer editing** existing files over creating new ones
- **Follow existing patterns** - check similar files before implementing

## Database

### Key Tables
- `users` - Employee data synced from Microsoft, includes `opt_out_token` for tokenised opt-out
- `departments` - Organisation units with `is_active` for phased rollout
- `matching_rounds` - Monthly matching execution records
- `pairings` - User pairings with meeting details
- `meeting_feedback` - User feedback and ratings
- `notification_templates` - Custom email/Teams templates (with file fallback)
- `system_settings` - Key-value configuration store
- `admin_users` - Admin role assignments

### Model Registration
All models must be added to `backend/src/models/index.js` to be available via destructuring.

## Authentication

- **Microsoft OAuth 2.0** via Azure AD (multi-tenant support)
- **JWT tokens** for API authentication (7-day expiry)
- **Admin middleware** checks `admin_users` table for role-based access
- **Public endpoints** under `/api/public/*` require no auth (tokenised opt-out links)

## Environment Variables

Backend requires in `.env`:
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `EMAIL_FROM`

Frontend requires in `.env`:
- `REACT_APP_AZURE_CLIENT_ID`, `REACT_APP_AZURE_TENANT_ID`
- `REACT_APP_API_URL`

## Current Features

1. **Admin Dashboard** - Analytics, user management, department controls
2. **Matching Algorithm** - Smart pairing with cross-department bonuses, repeat penalties
3. **Department Phased Rollout** - Enable departments gradually with auto opt-in
4. **Tokenised Opt-Out** - One-click opt-out links without authentication
5. **Template Management** - Monaco editor for customising email/Teams templates
6. **Microsoft Integration** - User sync, calendar events, Teams notifications

## Testing

- Backend: Jest (run with `npm test`)
- Frontend: React Testing Library (run with `npm test`)
- Always test API changes with `curl` or check PM2 logs after restart

## Important Notes

- **PM2 process name:** `coffee-roulette` (not `coffee-roulette-backend`)
- **Frontend build location:** `/var/www/coffee-roulette/frontend/build`
- **Backend port:** 3000
- **Frontend dev port:** 3001
- **Grace period:** New opt-ins wait 48 hours before being eligible for matching
- **Template fallback:** Custom templates in DB, falls back to file templates when `is_active=false`
