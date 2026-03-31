# SkillVerse

A fullstack skill-sharing and mentorship platform where learners connect with mentors, exchange skills, explore courses, and engage in a social learning community.

## Features

- **Social Feed** — Create, edit, delete posts with images; like, comment, repost, save, and share
- **Real-Time Messaging** — 1:1 conversations powered by Socket.io with typing indicators
- **Mentorship** — Browse mentors, request mentorship, manage schedules, and leave reviews
- **Skill Exchange** — Request and manage skill exchanges with other users
- **Courses & Enrollment** — Explore courses and track your learning progress
- **Follow System** — Follow/unfollow users, manage followers and pending requests
- **Notifications** — Real-time notifications for interactions, mentorship, and messages
- **User Profiles** — Public and private profile views with activity tabs
- **Authentication** — Email/password and Google OAuth with JWT-based sessions
- **Onboarding** — Guided setup flow for new users

## Tech Stack

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose 9
- Socket.io (real-time)
- Passport.js (Google OAuth)
- JWT + bcryptjs (authentication)
- Multer (file uploads)

**Frontend**
- React 19
- Vite 8
- Tailwind CSS 3
- React Router 7
- Axios
- Socket.io-client
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/talharoar86-hub/skillverse-app.git
cd skillverse-app

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

**Backend** (`backend/.env`)
```
MONGODB_URI=mongodb://localhost:27017/skillverse
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
PORT=5000
```

**Frontend** (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000
```

### Running the App

```bash
# From root — run backend and frontend separately
npm run dev:backend   # Starts Express on port 5000
npm run dev:frontend  # Starts Vite on port 5173

# Or individually
cd backend && npm start
cd frontend && npm run dev
```

## Project Structure

```
skillverse/
├── backend/
│   ├── config/          # Passport strategy
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, upload, role guards
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic
│   ├── uploads/         # User-uploaded files
│   └── server.js        # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── auth/        # Login, signup, OAuth, context
│   │   ├── components/  # Shared UI components
│   │   ├── context/     # Socket, notification providers
│   │   ├── feed/        # Home feed
│   │   ├── learn/       # Courses, mentors, learning
│   │   ├── mentor/      # Mentor dashboard
│   │   ├── messages/    # Chat and conversations
│   │   ├── onboarding/  # New user setup flow
│   │   ├── pages/       # Notifications, post detail
│   │   ├── profile/     # User profile pages
│   │   ├── services/    # API client and helpers
│   │   └── utils/       # Utility functions
│   └── ...
│
└── package.json         # Root scripts
```

## API Routes

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Authentication & OAuth |
| `/api/user` | User management |
| `/api/posts` | Posts & comments |
| `/api/feed` | Feed aggregation |
| `/api/follow` | Follow/unfollow |
| `/api/messages` | Conversations & chat |
| `/api/mentor` | Mentor profiles |
| `/api/mentorship` | Mentorship requests |
| `/api/courses` | Course management |
| `/api/enrollment` | Course enrollment |
| `/api/exchange` | Skill exchange |
| `/api/schedule` | Mentor schedules |
| `/api/reviews` | Mentor reviews |
| `/api/notifications` | User notifications |

## License

ISC
