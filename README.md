# Coffee Roulette

Internal web application for Mercator IT Solutions to facilitate random employee pairing for coffee meetings, promoting cross-department collaboration and team building.

## Overview

Coffee Roulette automatically pairs employees monthly for casual coffee meetings, with features including:

- **Random Pairing Algorithm**: Smart matching with constraints to avoid recent repeats and encourage cross-department connections
- **Microsoft Integration**: OAuth authentication, Outlook calendar auto-scheduling, Teams notifications
- **Department Management**: Phased rollout capability - enable specific departments gradually
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
- **Scheduling**: node-cron
- **Email**: AWS SES via Nodemailer
- **API Integration**: Microsoft Graph API

### Frontend
- **Framework**: React 18
- **Auth**: MSAL (Microsoft Authentication Library)
- **Routing**: React Router v6
- **State Management**: React Context + React Query
- **Charts**: Recharts

### Deployment
- **Containerization**: Docker
- **Orchestration**: Kubernetes (AWS EKS)
- **Database**: MySQL container (with RDS migration path)
- **Email Service**: AWS SES
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

# AWS SES
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
EMAIL_FROM=noreply@your-company.com
```

### 3. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Coffee Roulette
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: `http://localhost:3000/api/auth/microsoft/callback`
5. After creation, note the **Application (client) ID** and **Directory (tenant) ID**
6. Create a **Client Secret** under Certificates & secrets
7. Grant API permissions:
   - Microsoft Graph: `User.Read`, `Calendars.ReadWrite`, `People.Read`

### 4. AWS SES Setup

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Verify your sender email address
3. Request production access (to send to any email)
4. Create IAM user with SES send permissions
5. Note the Access Key ID and Secret Access Key

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

- `GET /api/admin/users` - List users
- `POST /api/admin/users/sync` - Sync from Microsoft
- `GET /api/admin/departments` - List departments
- `POST /api/admin/departments/:id/enable` - Enable department
- `POST /api/admin/matching/run` - Trigger matching manually
- `GET /api/admin/analytics/overview` - Get analytics

## Database Schema

Key tables:
- **users**: Employee information synced from Microsoft
- **departments**: Organization departments with enrollment status
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

### Matching Algorithm

The pairing algorithm:
1. Fetches eligible participants (opted-in, active, department enabled)
2. Checks recent pairings (last 3 rounds)
3. Scores potential matches:
   - **-50 points** per recent pairing (penalty)
   - **+20 points** for cross-department matching (bonus)
   - **+10 points** for cross-seniority matching (bonus)
4. Selects highest-scoring matches
5. Handles odd numbers (one person sits out, prioritized next round)
6. Assigns random icebreaker topics

### Automated Jobs

Configured via node-cron:
- **Monthly Matching**: 1st of month at 9 AM
- **Notification Queue**: Every 5 minutes
- **Meeting Reminders**: 7 days and 1 day before
- **Feedback Requests**: 1 day after scheduled meeting
- **User Sync**: Daily from Microsoft Graph API

### Notifications

- **Email**: AWS SES with HTML templates
- **Microsoft Teams**: Webhook integration with adaptive cards
- **Queue-based**: Reliable delivery with retry logic

### Calendar Integration

- Auto-find common free time slots
- Create Outlook calendar events
- Include Teams meeting links
- Fallback to manual scheduling

## Configuration

System settings (stored in `system_settings` table):

```
matching.frequency=monthly
matching.lookback_rounds=3
matching.cross_department_weight=20
matching.cross_seniority_weight=10
calendar.auto_schedule=true
calendar.meeting_duration_minutes=30
```

Admins can update these via the UI or API.

## Security

- Microsoft OAuth 2.0 (no password storage)
- JWT tokens with expiration
- Role-based access control
- Rate limiting
- Helmet.js security headers
- Input validation
- SQL injection protection (Sequelize ORM)
- Audit logging

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
