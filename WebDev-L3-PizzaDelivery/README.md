# Pizza House - Full-Stack Application

Oasis Infobyte Web Development & Designing Internship - Level 3, Task 1.

A full-stack pizza ordering platform: user authentication with email verification,
a pizza catalogue plus a custom pizza builder with dynamic pricing, Razorpay
(test-mode) checkout with server-verified payments, automatic inventory
deduction, an admin dashboard for inventory and order management, a three-stage
order lifecycle with live polling-based status updates on the customer side, and
a scheduled low-stock email alert job.

## Tech stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios
- **Backend:** Node.js, Express 5, MongoDB, Mongoose
- **Payments:** Razorpay (test mode), INR
- **Auth:** JWT (httpOnly cookie), bcryptjs password hashing
- **Email:** Resend (verification / password reset / low-stock alerts)
- **Scheduling:** node-cron (low-stock inventory check)
- **Testing:** Vitest, Supertest

## Project structure

```
WebDev-L3-PizzaDelivery/
├── client/                 React + Vite frontend
│   ├── src/
│   │   ├── components/     Reusable UI (Button, StatusBadge, PizzaCard, route guards, ...)
│   │   ├── pages/          Route-level pages - auth, dashboard, builder, order
│   │   │                   review/tracking, admin inventory/orders
│   │   ├── layouts/        AuthLayout, DashboardLayout
│   │   ├── hooks/          useAuth, useOrderStatusPolling, useRazorpayCheckout
│   │   ├── context/        AuthContext (session state)
│   │   ├── services/       axios instance + one service module per API resource
│   │   └── utils/          currency/validators/order-draft helpers
│   └── package.json
│
├── server/                 Express backend
│   ├── config/              env.js, db.js, razorpay.js
│   ├── constants/           orderStatus.js (single source of truth for the order lifecycle)
│   ├── controllers/         auth, admin, pizza, ingredient, builder, order,
│   │                        payment, inventory, adminOrder
│   ├── middleware/          auth, validation, error handling, rate limiting
│   ├── models/               User, Ingredient, Pizza, Inventory, Order
│   ├── routes/               one router per resource
│   ├── services/             password, token, email, pricing, order, payment,
│   │                        inventory, adminOrder, lowStockAlert
│   ├── jobs/                 lowStockCron.job.js
│   ├── utils/                ApiError, JWT, secure tokens, cookies, money (INR/paise)
│   ├── seed/                  seedAdmin.js, seedCatalogue.js, seedInventory.js,
│   │                        resetOrders.js (local/demo-only reset utilities)
│   ├── tests/                 Vitest unit/integration tests
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
- A [Razorpay](https://razorpay.com) test-mode key ID/secret (optional in development -
  payment endpoints return a clear 503 until both are set)
- A [Resend](https://resend.com) API key for sending real emails (optional in development -
  emails are logged to the console if no key is configured)

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, RAZORPAY_*, RESEND_API_KEY, admin credentials
npm run dev            # starts the API on http://localhost:5000
```

Seed the database (all scripts are idempotent - safe to re-run):

```bash
npm run seed:admin        # creates the admin account from ADMIN_* env vars
npm run seed:catalogue    # 5 bases, 5 sauces, 3 cheeses, 6 vegetables + 6 ready-made pizzas
npm run seed:inventory    # one stock record per ingredient, with demo quantities/thresholds
```

### Resetting to a clean demo state

Two extra local-only scripts reset the database to a deterministic, fully-stocked
state before a demo or evaluation - see `server/seed/seedInventory.js` and
`server/seed/resetOrders.js` for exactly what each one touches:

```bash
npm run seed:inventory:reset   # restores every ingredient to its full DEMO_STOCK quantity/threshold
                                # and clears any low-stock alert flag - safe to re-run, never duplicates
npm run seed:reset:orders      # deletes every Order document (only the Order collection - users,
                                # the catalogue, and inventory are never touched)
npm run seed:reset:users       # deletes every non-admin User document (and any orders they placed) -
                                # never touches an account with role: 'admin'
```

Recommended before a demo: run `seed:reset:orders`, `seed:reset:users`, then
`seed:inventory:reset`, so the app starts with zero personal/test accounts, an empty
order history, and fully-stocked inventory, and the evaluator registers and orders as
a brand-new user rather than looking at old test data. None of these scripts run
automatically or are reachable from any API route - all are manual, local/demo-only
steps and must never be pointed at a production database.

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

## Feature overview

### Authentication

- Registration creates an unverified `user` account and emails a verification link
  (`/verify-email?token=...`). Login is rejected until the account is verified.
- JWTs are issued as an httpOnly cookie (`token`) so they are inaccessible to page
  scripts; a copy is also returned in the JSON response body for tooling/testing that
  can't use cookies.
- `requireAuth` / `requireRole('admin')` middleware protect every backend route; the
  same rules are mirrored on the frontend via `<ProtectedRoute>` / `<AdminRoute>`, but
  the backend is the authority - hiding a link is not access control.
- Public registration can never create an admin: the controller only ever reads
  `name`, `email`, and `password` from the request body and hardcodes `role: 'user'`.
  Admins are created exclusively via `npm run seed:admin`.
- Password reset and email verification tokens are random 256-bit values; only their
  SHA-256 hash is stored, and both carry an expiry (24h for verification, 1h for
  reset). A reset token is deleted the moment it's used, so it cannot be replayed.
- Forgot-password and resend-verification endpoints return an identical response
  whether or not the account exists, to prevent email enumeration.

### Catalogue, custom builder & pricing

- `GET /api/pizzas` and `GET /api/ingredients` serve the ready-made catalogue and the
  four ingredient categories (base, sauce, cheese, vegetable) used by the builder.
- The custom builder (`/customize`) walks the user through exactly one base, one
  sauce, one cheese, and any number of vegetables, then calls
  `POST /api/builder/validate` for an authoritative price before the order summary.
- **The backend is always the price authority.** `services/pricing.service.js` and
  `services/order.service.js` re-derive every price from the current Ingredient/Pizza
  records; a client-supplied `price`/`unitPrice`/`totalAmount` is never trusted or
  read on order creation.

### Orders & Razorpay payments

- `POST /api/orders` creates a `pending` order with a server-computed total.
- `POST /api/payments/create-order` creates (or reuses) a Razorpay order in INR.
- `POST /api/payments/verify` verifies the Razorpay signature server-side before an
  order is ever marked `paid` - the frontend cannot declare a payment successful on
  its own. The verify step is idempotent (an atomic `paymentStatus !== 'paid'`
  conditional update) so a duplicate/replayed verification request can't be
  processed twice or double-deduct inventory.
- On successful verification, stock is deducted for every ingredient in the order
  (`services/inventory.service.js`), each ingredient decremented with a single
  atomic, quantity-guarded update so concurrent orders can never drive stock
  negative; if any ingredient is short, prior deductions for that order are rolled
  back and the order is marked `fulfillmentStatus: 'blocked'` rather than silently
  losing the customer's payment.

### Order lifecycle & live tracking

- Three sequential, admin-only stages: `Order Received` → `In Kitchen` →
  `Sent to Delivery` (`constants/orderStatus.js`). The backend rejects any
  transition other than the single allowed "next" status for the order's current
  stage - skipping a stage or moving backwards is impossible even with a crafted
  request.
- The customer's order detail page (`/orders/:id`) polls `GET /api/orders/:id`
  every 5 seconds while the order is paid, not blocked by a stock issue, and hasn't
  yet reached `Sent to Delivery` (`client/src/hooks/useOrderStatusPolling.js`).
  Polling stops automatically at `Sent to Delivery`, on unmount, and while the page
  is loading; a failed poll keeps the last known status on screen and retries on
  the next tick rather than surfacing an error.

### Admin: inventory & orders

- `/admin/inventory` lists every ingredient's stock with category/status filters and
  low-stock/out-of-stock summary counts. Manual updates use Mongoose's version key
  as an optimistic lock, so two admins editing the same item concurrently get a
  clear conflict instead of a silently lost update.
- `/admin/orders` lists paid/confirmed orders with status counts and lets an admin
  advance an order exactly one stage at a time; `/admin/orders/:id` shows the full
  item breakdown, customer, Razorpay identifiers, and status history.

### Low-stock automation

- A cron job (`server/jobs/lowStockCron.job.js`, node-cron) runs independently of any
  request and checks every inventory item against its configured threshold, using
  the same low-stock/out-of-stock definitions as the admin dashboard. An in-process
  guard skips a tick if the previous check is still running, so a slow DB or email
  provider can never cause two checks to overlap.
- When an item is newly below its threshold, one consolidated email is sent to
  `ADMIN_EMAIL`. Each affected item is then marked `lowStockAlertSent: true` so the
  next run does not re-alert for the same unresolved shortage; the flag is cleared
  as soon as the item is restocked back to its threshold, so a later shortage
  triggers a fresh alert. A failed email send is never marked as sent, so the next
  scheduled run retries it.
- The schedule defaults to every minute (`* * * * *`) so the feature is easy to
  demonstrate; set `LOW_STOCK_CRON_SCHEDULE` in `.env` to something coarser (e.g.
  `*/15 * * * *`) for production.

## Environment variables

See `server/.env.example` and `client/.env.example` for the full list with
descriptions. No secrets are committed to this repository.

## Deployment

The app is a standard two-service deployment - it has not been deployed anywhere
by this repository, but the code is ready for it:

- **Frontend** (`client/`) - any static host that can serve a Vite build
  (Vercel, Netlify, ...). Build with `npm run build`, publish the `dist/` folder.
  Set `VITE_API_URL` to the deployed backend's `/api` URL at build time.
- **Backend** (`server/`) - any Node host that runs `npm start`
  (Render, Railway, ...). Set every variable in `server/.env.example`, in
  particular `CLIENT_URL` to the deployed frontend's origin (used for CORS and
  for the links inside verification/reset emails) and `NODE_ENV=production`
  (this also switches the auth cookie to `secure` + `SameSite=None`, required
  for a cross-origin frontend/backend pair to keep the login session).
- **Database** - MongoDB Atlas (or any reachable MongoDB instance). Point
  `MONGO_URI` at it and run the seed scripts once against it.
- **Payments** - Razorpay test-mode keys work unchanged in a deployed
  environment; no code change is needed to go from local to deployed test-mode
  checkout.
- **Email** - Resend needs a verified sending domain/address in `EMAIL_FROM`
  for production sends; in development, an unset `RESEND_API_KEY` just logs
  the email content to the console instead of failing.

Nothing in the codebase hardcodes `localhost` - `CLIENT_URL`, `VITE_API_URL`,
`MONGO_URI` and CORS are all environment-driven, so the same code runs
locally and deployed without edits.



  set `LOW_STOCK_CRON_SCHEDULE` to something coarser before any real deployment.
- There is no admin UI for managing user accounts or the pizza/ingredient
  catalogue - both are managed via the seed scripts, matching the assignment
  scope (inventory + order management are the required admin surfaces).
