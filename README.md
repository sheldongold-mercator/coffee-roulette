# Coffee Roulette

Internal web application for Mercator IT Solutions to facilitate random employee pairing for coffee meetings, promoting cross-department collaboration and team building.

## Overview

Coffee Roulette automatically pairs employees monthly for casual coffee meetings, with features including:

- **Random Pairing Algorithm**: Smart matching with constraints to avoid recent repeats and encourage cross-department connections
- **Microsoft Integration**: OAuth authentication, Outlook calendar auto-scheduling, Teams notifications
- **Department Management**: Phased rollout capability - enable specific departments gradually
- **User Onboarding**: Automatic opt-in with welcome emails and one-click opt-out links
- **Meeting Tracking**: Confirm meetings, collect feedback and ratings
- **Admin Dashboard**: Analytics, user management, matching controls
- **Automated Workflows**: Scheduled matching, notifications, and reminders

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Sequelize
- **Authentication**: Passport.js with Azure AD OAuth 2.0
- **Scheduling**: node-cron, cron-parser
- **Email**: Microsoft Graph API (Mail.Send)
- **API Integration**: Microsoft Graph API

### Frontend
- **Framework**: React 18
- **Auth**: MSAL (Microsoft Authentication Library)
- **Routing**: React Router v6
- **State Management**: React Context + React Query
- **Charts**: Recharts

### Deployment
- **Containerisation**: Docker
- **Orchestration**: Kubernetes (AWS EKS)
- **Database**: MySQL container (with RDS migration path)
- **Email Service**: Microsoft Graph API
- **CI/CD**: GitHub Actions

## Project Structure

```
coffee-roulette/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── config/            # Database, passport, Graph API
│   │   ├── controllers/       # Request handlers
│   │   ├── jobs/              # Cron jobs
│   │   ├── middleware/        # Auth, validation, errors
│   │   ├── models/            # Sequelize models
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── templates/         # Email/Teams templates
│   │   ├── utils/             # Helpers, logger
│   │   ├── app.js             # Express app configuration
│   │   └── server.js          # Server entry point
│   ├── database/
│   │   ├── init.sql           # Database schema
│   │   ├── migrations/        # Schema migrations
│   │   └── seeders/           # Seed data
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # React application
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── config/            # MSAL configuration
│   │   ├── context/           # React Context
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Route components
│   │   ├── services/          # API calls
│   │   └── App.js             # Main app component
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── nginx.conf
│   └── package.json
│
├── kubernetes/                 # K8s manifests
│   ├── backend/
│   ├── frontend/
│   ├── mysql/
│   └── ingress.yaml
│
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Local development
├── .env.example                # Environment template
├── BACKLOG.md                  # Feature backlog and bug tracking
├── CLAUDE.md                   # Claude Code context and conventions
└── README.md
```

## Prerequisites

- **Node.js**: 18.x or higher
- **Docker**: 20.x or higher
- **Docker Compose**: 2.x or higher
- **MySQL**: 8.0 (or use Docker)
- **Azure AD App Registration** (for Microsoft OAuth)
- **AWS Account** (for SES email service)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/sheldongold-mercator/coffee-roulette.git
cd coffee-roulette
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

**Required configurations:**

```env
# Microsoft Azure AD
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_TENANT_ID=your_tenant_id

# Database
DB_PASSWORD=your_secure_password

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Email (Microsoft Graph)
EMAIL_SENDER_ADDRESS=noreply@your-company.com
```

### 3. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Coffee Roulette
   - **Supported account types**: Accounts in this organisational directory only
   - **Redirect URI**: `http://localhost:3000/api/auth/microsoft/callback`
5. After creation, note the **Application (client) ID** and **Directory (tenant) ID**
6. Create a **Client Secret** under Certificates & secrets
7. Grant API permissions:
   - Microsoft Graph: `User.Read`, `Calendars.ReadWrite`, `People.Read`, `Mail.Send` (Application)

### 4. Email Setup (Microsoft Graph)

Email is sent via Microsoft Graph API using the `Mail.Send` application permission:
1. Ensure `Mail.Send` is granted as an Application permission in Azure AD
2. Grant admin consent for the permission
3. Set `EMAIL_SENDER_ADDRESS` to a valid mailbox in your tenant (e.g., `noreply@your-company.com`)

### 5. Start with Docker Compose

Start all services (MySQL, Backend, Frontend):

```bash
docker-compose up -d
```

The application will be available at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **MySQL**: localhost:3306

Check logs:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 6. Initialize Database

The database schema is automatically initialized from `backend/database/init.sql` when MySQL starts for the first time.

To manually run migrations:

```bash
docker-compose exec backend npm run db:migrate
```

To seed icebreaker topics:

```bash
docker-compose exec backend npm run db:seed
```

## Development

### Backend Development

Install dependencies:

```bash
cd backend
npm install
```

Run in development mode:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

### Frontend Development

Install dependencies:

```bash
cd frontend
npm install
```

Run in development mode:

```bash
npm start
```

Run tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```

## API Documentation

### Authentication

- `POST /api/auth/microsoft/login` - Initiate Microsoft OAuth flow
- `GET /api/auth/microsoft/callback` - OAuth callback handler
- `GET /api/auth/me` - Get current user profile

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `POST /api/users/opt-in` - Opt into Coffee Roulette
- `POST /api/users/opt-out` - Opt out
- `GET /api/users/pairings` - Get pairing history
- `GET /api/users/pairings/current` - Get current pairing
- `POST /api/users/pairings/:id/confirm` - Confirm meeting completion
- `POST /api/users/pairings/:id/feedback` - Submit feedback

### Admin Endpoints

- `GET /api/admin/users` - List users with filtering (status, department, participation)
- `PUT /api/admin/users/:id` - Update user details
- `POST /api/admin/users/sync` - Sync users from Microsoft Graph API
- `GET /api/admin/users/stats` - Get user statistics
- `GET /api/admin/departments` - List departments with user counts
- `GET /api/admin/departments/:id` - Get department details
- `POST /api/admin/departments` - Create department
- `PUT /api/admin/departments/:id` - Update department
- `POST /api/admin/departments/:id/enable` - Enable department (triggers auto opt-in and welcome emails)
- `POST /api/admin/departments/:id/disable` - Disable department
- `POST /api/admin/matching/run` - Trigger matching manually
- `GET /api/admin/matching/preview` - Preview matching without executing
- `GET /api/admin/analytics/overview` - Get analytics dashboard data

### Public Endpoints (No Authentication Required)

- `GET /api/public/opt-out/:token` - One-click opt-out from Coffee Roulette
- `GET /api/public/opt-in/:token` - One-click opt back in
- `GET /api/public/status/:token` - Check subscription status

## Database Schema

Key tables:
- **users**: Employee information synced from Microsoft
  - `opt_out_token` (UUID for tokenised opt-out), `opted_in_at`, `opted_out_at`, `welcome_sent_at`
  - `skip_grace_period`, `available_from`, `override_department_exclusion` - Admin overrides
  - `matching_preference` - User matching preferences (`any`, `cross_department_only`, etc.)
  - `is_vip` - VIP users are guaranteed matches (never sit out)
  - `seniority_level` - `junior`, `mid`, `senior`, `lead`, `head`, `executive`
- **departments**: Organization departments with enrollment status
  - `is_active` controls whether department users are eligible for matching
  - `enrollment_date` records when department was first enabled
- **matching_rounds**: Monthly matching execution records
- **pairings**: User pairings with meeting details
- **meeting_feedback**: User feedback and ratings
- **icebreaker_topics**: Conversation starters
- **notification_queue**: Email and Teams notifications
- **system_settings**: Configuration key-value store
- **admin_users**: Admin role assignments
- **audit_logs**: Admin action tracking

## Deployment

### Docker Production Build

Build images:

```bash
# Backend
docker build -t coffee-roulette-backend:latest ./backend

# Frontend
docker build -t coffee-roulette-frontend:latest ./frontend
```

### Kubernetes Deployment

1. Create secrets:

```bash
kubectl create secret generic app-secrets \
  --from-literal=db-password=your_password \
  --from-literal=jwt-secret=your_secret \
  --from-literal=microsoft-client-secret=your_secret
```

2. Apply manifests:

```bash
kubectl apply -f kubernetes/
```

3. Verify deployment:

```bash
kubectl get pods
kubectl get services
```

## Features

### User Onboarding & Opt-Out Flow

Coffee Roulette uses a frictionless onboarding system with tokenised opt-out:

**Department Activation (Phased Rollout)**
1. Admin enables a department via the dashboard
2. All active users in that department are automatically opted-in
3. Welcome emails are sent to all users with:
   - Explanation of Coffee Roulette
   - How the program works
   - One-click opt-out link (no login required)
4. Users have a 48-hour grace period before being included in matching

**New User Sync**
- When users are synced from Microsoft Graph API, new users in active departments are:
  - Automatically opted-in
  - Sent a welcome email
  - Given a 48-hour grace period before matching

**One-Click Opt-Out**
- Each user has a unique `opt_out_token` (UUID)
- Opt-out links work without authentication: `/api/public/opt-out/:token`
- Users can opt back in via `/api/public/opt-in/:token`
- Status can be checked via `/api/public/status/:token`

**Participation Status**
Users have three participation statuses:
- **Eligible**: Opted-in, active user in an active department (can be matched)
- **Opted-in Excluded**: Opted-in but department is inactive (won't be matched)
- **Opted Out**: User has opted out of the program

### Matching Algorithm

The pairing algorithm:
1. Fetches eligible participants (opted-in, active, department enabled, past grace period)
   - Respects `available_from` date for delayed participation
   - Honours `override_department_exclusion` for users in inactive departments
   - Skips grace period if `skip_grace_period` is set
2. Checks recent pairings (last 3 rounds)
3. Scores potential matches:
   - **-50 points** per recent pairing (penalty)
   - **+20 points** for cross-department matching (bonus)
   - **+10 points** for cross-seniority matching (bonus)
   - Respects user `matching_preference` settings
4. Selects highest-scoring matches
5. Handles odd numbers (one person sits out, prioritised next round)
   - VIP users (`is_vip = true`) are guaranteed a match
6. Assigns random icebreaker topics

**Grace Period**: Users who opted in within the last 48 hours are excluded from matching, giving them time to opt-out if desired. This is configurable via `matching.grace_period_hours`. Admins can bypass this per-user with `skip_grace_period`.

### Automated Jobs

Configured via node-cron with dynamic scheduling:
- **Matching Rounds**: Configurable (weekly, bi-weekly, or monthly) with manual trigger option
- **Notification Queue**: Every 5 minutes
- **Meeting Reminders**: 7 days and 1 day before
- **Feedback Requests**: 1 day after scheduled meeting
- **User Sync**: Daily from Microsoft Graph API

### Notifications

- **Email**: Microsoft Graph API with HTML templates
- **Microsoft Teams**: Webhook integration with adaptive cards
- **Queue-based**: Reliable delivery with retry logic

**Email Templates** (in `backend/src/templates/emails/`):
- `welcome.js` - Welcome email for new participants with opt-out link
- `pairingNotification.js` - Notification when matched with a coffee partner
- `meetingReminder.js` - Reminders before scheduled meetings
- `feedbackRequest.js` - Request for feedback after meetings

### User Portal

Employees access the portal to view their coffee matches and manage participation:

**Portal Features:**
- **Current Match View**: See your coffee partner with their details (name, department, role, email)
- **Contact Options**: Quick buttons to send email or start Teams chat with partner
- **Meeting Confirmation**: "We Had Our Coffee!" button to confirm meeting completion
- **Feedback System**: Rate your experience (1-5 stars), share topics discussed, leave comments
- **Pairing History**: View all past coffee matches and feedback
- **Profile Management**: Update preferences and opt-in/opt-out status

**Portal Flow:**
1. User receives matching notification email with portal link
2. Views their assigned coffee partner
3. Reaches out to schedule meeting
4. After meeting, clicks "We Had Our Coffee!" to confirm
5. Feedback form automatically opens for rating and comments
6. Can update feedback later via "Change Feedback" button

### Template Management (Admin)

Admins can customise email and Teams notification templates via the admin dashboard:

**Features:**
- **Monaco Code Editor**: Edit HTML/text emails and Teams Adaptive Card JSON with syntax highlighting
- **Live Preview**: Preview templates with sample data before saving
- **Variable Reference**: See available template variables with descriptions
- **Restore Defaults**: One-click restore to original file-based templates

**Accessing Template Editor:**
1. Navigate to Admin Dashboard → Templates
2. Select Email or Teams tab
3. Click "Edit" on any template
4. Modify content and preview
5. Save changes or restore default

**How It Works:**
- Custom templates are stored in the `notification_templates` database table
- When a template has a custom version (`is_active = true`), it's used instead of the file-based default
- Restoring default sets `is_active = false`, falling back to the original file template
- Templates use `${variableName}` syntax for variable interpolation

### Calendar Integration

- Auto-find common free time slots
- Create Outlook calendar events
- Include Teams meeting links
- Fallback to manual scheduling

## Configuration

System settings (stored in `system_settings` table):

```
matching.schedule_type=monthly
matching.auto_schedule_enabled=true
matching.next_run_date=2026-02-01
matching.lookback_rounds=3
matching.cross_department_weight=20
matching.cross_seniority_weight=10
matching.grace_period_hours=48
matching.repeat_penalty=50
calendar.auto_schedule=true
calendar.meeting_duration_minutes=30
```

| Setting | Default | Description |
|---------|---------|-------------|
| `matching.schedule_type` | monthly | Schedule preset: `weekly`, `biweekly`, or `monthly` |
| `matching.auto_schedule_enabled` | true | Enable automatic scheduled matching |
| `matching.next_run_date` | (calculated) | Next scheduled matching run date |
| `matching.lookback_rounds` | 3 | Number of previous rounds to check for repeat pairings |
| `matching.cross_department_weight` | 20 | Bonus points for cross-department matches |
| `matching.cross_seniority_weight` | 10 | Bonus points for cross-seniority matches |
| `matching.repeat_penalty` | 50 | Penalty points per recent repeat pairing |
| `matching.grace_period_hours` | 48 | Hours new opt-ins must wait before being eligible for matching |
| `calendar.auto_schedule` | true | Automatically schedule meetings via Outlook |
| `calendar.meeting_duration_minutes` | 30 | Default meeting duration |

Admins can update these via the UI or API.

## Security

- Microsoft OAuth 2.0 (no password storage)
- JWT tokens with expiration
- Role-based access control (super_admin, admin, viewer)
- Rate limiting (100 requests per 15 minutes in production)
- Helmet.js security headers
- Input validation
- SQL injection protection (Sequelize ORM)
- Audit logging for admin actions
- Tokenised opt-out links (UUID v4, unique per user, no auth required)

## Monitoring

- **Health Check**: `GET /health`
- **Readiness Check**: `GET /ready`
- **Logs**: Winston logger (JSON format in production)
- **CloudWatch**: (when deployed to AWS)

## Troubleshooting

### Database connection failed

Check MySQL is running:

```bash
docker-compose ps mysql
```

Test connection:

```bash
docker-compose exec mysql mysql -u app_user -p coffee_roulette
```

### Frontend can't reach backend

Check network configuration in `docker-compose.yml` and ensure all services are on the same network.

### OAuth redirect not working

Ensure your Azure AD app redirect URI matches exactly:
- Development: `http://localhost:3000/api/auth/microsoft/callback`
- Production: `https://your-domain.com/api/auth/microsoft/callback`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Commit with descriptive message
5. Create pull request

## Support

For issues or questions, contact the Mercator IT team or create an issue in the repository.

## License

Internal use only - Mercator IT Solutions Ltd.
