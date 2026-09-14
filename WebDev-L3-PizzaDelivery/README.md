# Pizza Delivery - Full-Stack Application

Oasis Infobyte Web Development & Designing Internship - Level 3, Task 1.

A full-stack pizza ordering and inventory management platform. This phase of the build
establishes the project foundation and a complete authentication system (registration,
email verification, login, JWT authorization, forgot/reset password, and a separate
admin login). The pizza catalogue, ordering, payments, and inventory management are
planned for later phases.

## Tech stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios
- **Backend:** Node.js, Express 5, MongoDB, Mongoose
- **Auth:** JWT (httpOnly cookie), bcryptjs password hashing
- **Email:** Resend (transactional email for verification / password reset / low-stock alerts)
- **Scheduling:** node-cron (low-stock inventory check)
- **Testing:** Vitest, Supertest

## Project structure

```
WebDev-L3-PizzaDelivery/
├── client/                 React + Vite frontend
│   ├── src/
│   │   ├── components/     Reusable UI (Button, TextField, Alert, route guards, ...)
│   │   ├── pages/          Route-level pages (Login, Register, Dashboard, ...)
│   │   ├── layouts/        AuthLayout, DashboardLayout
│   │   ├── hooks/          useAuth
│   │   ├── context/        AuthContext (session state)
│   │   ├── services/       api.js (axios instance), auth.service.js
│   │   └── utils/          validators, error formatting
│   └── package.json
│
├── server/                 Express backend
│   ├── config/             env.js, db.js
│   ├── controllers/        auth.controller.js, admin.controller.js
│   ├── middleware/         auth, validation, error handling, rate limiting
│   ├── models/             User.js
│   ├── routes/             auth, admin, health
│   ├── services/           password, token, email
│   ├── utils/              ApiError, JWT, secure tokens, cookies
│   ├── seed/               seedAdmin.js
│   ├── tests/              Vitest unit/integration tests
│   ├── app.js / server.js
│   └── package.json
│
├── screenshots/
└── docs/
```

## Getting started

### Prerequisites

- Node.js 20+
- A MongoDB connection string (local `mongod` or MongoDB Atlas)
- A [Resend](https://resend.com) API key for sending real emails (optional in development -
  emails are logged to the console if no key is configured)

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, RESEND_API_KEY, admin credentials
npm run dev            # starts the API on http://localhost:5000
```

Create the admin account (idempotent - safe to re-run):

```bash
npm run seed:admin
```

Run the test suite:

```bash
npm test
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env   # defaults to the Vite dev proxy, usually no changes needed
npm run dev            # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so no CORS
configuration is needed in development.

## Authentication overview

- Registration creates an unverified `user` account and emails a verification link
  (`/verify-email?token=...`). Login is rejected until the account is verified.
- JWTs are issued as an httpOnly cookie (`token`) so they are inaccessible to page
  scripts; a copy is also returned in the JSON response body for tooling/testing that
  can't use cookies.
- `requireAuth` / `requireRole('admin')` middleware protect backend routes; the same
  rules are mirrored on the frontend via `<ProtectedRoute>` / `<AdminRoute>`, but the
  backend is the authority - hiding a link is not access control.
- Public registration can never create an admin: the controller only ever reads
  `name`, `email`, and `password` from the request body and hardcodes `role: 'user'`.
  Admins are created exclusively via `npm run seed:admin`, which reads
  `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the environment.
- Password reset and email verification tokens are random 256-bit values; only their
  SHA-256 hash is stored, and both carry an expiry (24h for verification, 1h for
  reset). A reset token is deleted the moment it's used, so it cannot be replayed.
- Forgot-password and resend-verification endpoints return an identical response
  whether or not the account exists, to prevent email enumeration.

## Real-time order status updates (polling)

The user's order detail page (`/orders/:id`) polls `GET /api/orders/:id` every 5
seconds while the order is paid, not blocked by a stock issue, and hasn't yet
reached `Sent to Delivery` (`client/src/hooks/useOrderStatusPolling.js`). The
existing endpoint already scopes results to the requesting user, so no separate
status route was needed and a user still can never poll someone else's order.
Polling stops automatically at `Sent to Delivery`, on unmount, and while the
page is loading; a failed poll keeps the last known status on screen and retries
on the next tick rather than surfacing an error.

**To demonstrate:** log in as a user, open a paid order, and in a second
session (admin) advance its status via the admin orders page. The user's page
updates within ~5 seconds without a manual refresh, and polling stops once the
order reaches `Sent to Delivery`.

## Low-stock automation

A cron job (`server/jobs/lowStockCron.job.js`, node-cron) runs independently of
any request and checks every inventory item against its configured threshold
(`server/services/lowStockAlert.service.js`), using the same low-stock/out-of-stock
definitions as the admin inventory dashboard. When an item is newly below its
threshold, one consolidated email is sent to `ADMIN_EMAIL` via the existing
Resend-based email service. Each affected item is then marked
`lowStockAlertSent: true` so the next run does not re-alert for the same
unresolved shortage; the flag is cleared as soon as the item is restocked back
to its threshold, so a later shortage triggers a fresh alert. A failed email
send is never marked as sent, so the next scheduled run retries it.

The schedule defaults to every minute (`* * * * *`) so the feature is easy to
demonstrate; set `LOW_STOCK_CRON_SCHEDULE` in `.env` to something coarser (e.g.
`*/15 * * * *`) for production.

**To demonstrate:** set `ADMIN_EMAIL` and (optionally) `RESEND_API_KEY` in
`server/.env`, start the server, log in as admin, and lower an ingredient's
quantity below its threshold on the inventory page. Within a minute, an alert
is sent (or logged to the server console if `RESEND_API_KEY` is unset) - repeat
runs do not resend it. Restock the item back to/above its threshold and the
alert flag resets; drop it below threshold again to see a new alert.

## Environment variables

See `server/.env.example` and `client/.env.example` for the full list with
descriptions. No secrets are committed to this repository.
