# 🏆 Event Organization & Voting Management System

A full-stack, enterprise-grade web application designed for organizing events, managing participants and teams, casting secure ballots with anti-fraud controls, and viewing live leaderboard analytics and vote tallies in real time.

---

## 🌟 Key Features

### 🗳️ Secure & Fraud-Resistant Voting
- **One-Vote-Per-User Enforcement**: Ensures voters can only submit one verified ballot per active event.
- **Atomic MongoDB Updates**: Prevents race conditions during concurrent voting tallies.
- **Audit Logging**: Comprehensive audit trail tracking ballot submissions, administrative actions, and status updates.

### 📊 Live Analytics & Visualizations
- **Interactive Leaderboard**: Real-time standings showing ranking, vote counts, and percentage share.
- **Data Charts**: Vote distribution bar charts and share breakdowns powered by **Recharts**.
- **Honor Podium**: Visual champion, 2nd, and 3rd place showcase with podium styling.
- **CSV Data Export**: Export official results directly for post-event auditing and records.

### 👥 Comprehensive User & Event Management
- **Role-Based Access**: Specialized interfaces for Administrators, Voters, and Participants.
- **Event Scheduling**: Configure event dates, voting windows (Live, Upcoming, Closed), categories, and rules.
- **Candidate Profiles**: Rich participant portfolios including team details, leadership, institutions, and achievements.
- **OTP Verification**: Secure email-based OTP delivery with local development fallbacks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v7, Recharts, Lucide React, Tailwind CSS / Vanilla CSS |
| **Backend** | Node.js, Express 5, Mongoose (MongoDB ODM), JWT, BcryptJS, Nodemailer, OTP-Generator |
| **Database** | MongoDB (NoSQL) |

---

## 📁 Repository Structure

```
├── ev_backend/             # Express.js REST API & MongoDB models
│   ├── config/             # Database connection & configurations
│   ├── controllers/        # Request handlers (events, votes, users, notifications)
│   ├── middleware/         # Auth, validation, and error middlewares
│   ├── models/             # Mongoose schemas (User, Event, Vote, UserEvent, AuditLog)
│   ├── routes/             # REST API endpoint definitions
│   ├── seed/               # Initial database seed scripts
│   └── utils/              # OTP, emailer, and helper functions
├── ev_frontend/            # React + Vite client application
│   ├── public/             # Static assets & icons
│   └── src/
│       ├── components/     # UI Views (Home, Results, Voting, Admin, Auth)
│       ├── context/        # React Context (Auth, Event, Toast)
│       └── services/       # Axios API client
├── scripts/                # Database migration, simulation, and test utilities
├── package.json            # Root multi-package management & scripts
└── README.md               # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or later recommended)
- [MongoDB](https://www.mongodb.com/) (Running locally or a MongoDB Atlas URI)

---

### 1. Installation

Install dependencies for both backend and frontend in one command from the project root:

```bash
npm run install:all
```

---

### 2. Environment Configuration

#### Backend (`ev_backend/.env`)
Create a `.env` file in the `ev_backend` directory (refer to `ev_backend/.env.example`):

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/event_voting
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
NODE_ENV=development
```

---

### 3. Database Seeding (Optional)

Populate the database with sample events, participants, and categories:

```bash
npm run seed
```

---

### 4. Running the Application

You can run both services independently or using the root convenience scripts:

#### Start Frontend:
```bash
npm run dev
# Opens at http://localhost:5173
```

#### Start Backend:
```bash
npm run dev:backend
# Runs at http://localhost:3000
```

#### Build Frontend for Production:
```bash
npm run build
```

---

## 📡 REST API Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/events` | List all events with computed voting status |
| `GET` | `/events/:id` | Get details for a specific event |
| `POST` | `/votes` | Submit a ballot for an event candidate |
| `GET` | `/votes/results/:eventId` | Retrieve live vote tallies, leader, and percentages |
| `GET` | `/user_events` | Fetch participant registrations and team profiles |
| `POST` | `/users/send-otp` | Request OTP for user authentication / registration |
| `POST` | `/users/verify-otp` | Verify OTP code and issue JWT session token |
| `GET` | `/admin/export/results/:eventId` | Download CSV export of verified vote results |

---

## 🧪 Testing & Utilities

Run the vote testing script located in `scripts/`:

```bash
npm run test:vote
```

---

## 📄 License

This project is licensed under the ISC License.
