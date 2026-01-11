# Coffee Roulette - Frontend

Modern admin dashboard for managing the Coffee Roulette employee pairing system.

## Features

- **Authentication**: Microsoft OAuth 2.0 integration with MSAL
- **Dashboard**: Real-time analytics and system metrics
- **User Management**: View, search, filter, and manage employees
- **Department Management**: Phased rollout with enable/disable controls
- **Matching**: Trigger and preview matching rounds
- **Analytics**: Detailed reports and data exports
- **Settings**: System configuration and scheduled job management

## Tech Stack

- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Headless UI** - Accessible components
- **React Query** - Data fetching and caching
- **Recharts** - Data visualisation
- **Axios** - HTTP client
- **MSAL** - Microsoft authentication

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend API running (see `/backend` directory)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_AZURE_CLIENT_ID=your_client_id
REACT_APP_AZURE_TENANT_ID=your_tenant_id
REACT_APP_REDIRECT_URI=http://localhost:3001
```

### Development

Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3001](http://localhost:3001)

### Build

Create a production build:
```bash
npm run build
```

The optimised files will be in the `build/` directory.

### Linting

Run ESLint:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Sidebar, AdminLayout)
│   └── ProtectedRoute.jsx
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── pages/              # Page components
│   ├── Dashboard.jsx
│   ├── Users.jsx
│   ├── Departments.jsx
│   ├── Matching.jsx
│   ├── Analytics.jsx
│   ├── Settings.jsx
│   └── Login.jsx
├── services/           # API service layer
│   └── api.js
├── config/             # Configuration files
│   └── msal.js
├── App.jsx             # Main app component
├── index.js            # Entry point
└── index.css           # Global styles
```

## Design System

The app uses a comprehensive Tailwind-based design system with:

- **Colors**: Primary (blue) and accent (purple) palettes
- **Components**: Pre-styled buttons, cards, inputs, badges, tables
- **Animations**: Smooth transitions with Framer Motion
- **Icons**: Heroicons for consistent iconography

## Authentication Flow

1. User clicks "Sign in with Microsoft" on login page
2. MSAL redirects to Microsoft login
3. User authenticates and consents to permissions
4. Microsoft returns access token
5. Frontend exchanges token for JWT from backend
6. JWT stored in localStorage for subsequent requests
7. Protected routes verify authentication before rendering

## API Integration

All API calls go through the centralised service layer in `src/services/api.js`:

- **Automatic JWT injection** via Axios interceptors
- **Error handling** with automatic redirect on 401
- **Organised by domain**: auth, analytics, users, departments, matching, settings

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Internal use only - Mercator IT Solutions Ltd.
