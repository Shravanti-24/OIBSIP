# Architecture

Two deployable units and a database. The web client is a static Vite bundle; the
API is a stateless Express process; MongoDB holds all state. Nothing is shared
in process memory between requests except the low-stock scheduler, which is
deliberately tied to the API process lifetime.

```
┌──────────────┐   /api/* (cookie)   ┌──────────────┐        ┌─────────┐
│  React SPA   │ ──────────────────► │  Express API │ ─────► │ MongoDB │
│ (Vite build) │ ◄────────────────── │              │ ◄───── │         │
└──────────────┘    JSON + Set-Cookie└──────┬───────┘        └─────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                         Razorpay        Resend     node-cron
                        (payments)      (email)   (low-stock check)
```

## Request path

`server/app.js` composes the middleware stack in a fixed order: `helmet`, CORS
restricted to `CLIENT_URL` with credentials, JSON parsing, cookie parsing,
request logging (development only), then one router per resource, then the
404 handler and the error handler.

Every route follows the same four layers:

| Layer          | Responsibility                                                    |
| -------------- | ----------------------------------------------------------------- |
| **route**      | Path, auth middleware, rate limiter, validator chain              |
| **controller** | Read the request, call one service, shape the response. No logic. |
| **service**    | All business rules and every database write                       |
| **model**      | Schema, indexes, constraints                                      |
| **utils**      | `ApiError`, JWT, cookies, money, secure tokens, `asyncHandler`    |

Controllers never contain business rules and services never touch `req`/`res`,
so every rule is reachable from a unit test without an HTTP layer. `asyncHandler`
wraps each controller so a rejected promise reaches the error handler instead of
hanging the request, and `ApiError` carries the status code, which is the only
thing the error handler trusts — unexpected errors become a generic `500` in
production and never leak a stack trace.

## Trust boundary

The client is treated as an untrusted caller throughout. Three rules follow
from that, and most of the server's design is downstream of them:

1. **The server owns every price.** `services/pricing.service.js` and
   `services/order.service.js` re-derive each item's price from the current
   `Ingredient` and `Pizza` documents. A `price`, `unitPrice` or `totalAmount`
   in the request body is not read on order creation. The builder's
   `POST /builder/validate` exists so the UI can _display_ an authoritative
   price before checkout, not so it can submit one.
2. **The server owns payment outcomes.** `POST /payments/verify` recomputes the
   Razorpay HMAC signature with the key secret. A client claim of success is
   worthless without it.
3. **The server owns the lifecycle.** `constants/orderStatus.js` is the single
   source of truth for the three stages and their legal transitions; the Order
   schema enum, the admin validators and the transition service all import it,
   so the states cannot drift apart.

Role checks live in `middleware/auth.middleware.js` (`requireAuth`,
`requireRole`). The frontend's route guards mirror them for UX only — a hidden
link is not access control. Public registration hardcodes `role: 'user'`, so no
request shape can create an admin; admins exist only via `npm run seed:admin`.

## Money

Prices are whole rupees in the database and the UI. `utils/money.js` converts to
paise for Razorpay, which bills in the currency's smallest unit, and back again.
Keeping that conversion in one module — with its own tests — is what stops a
₹250 order from being charged as ₹2.50.

## Concurrency

Three places can be hit by two actors at once, each handled explicitly rather
than hopefully:

- **Payment verification** updates under an atomic
  `paymentStatus !== 'paid'` condition, so a duplicated or replayed webhook
  cannot pay an order twice or deduct its stock twice.
- **Inventory deduction** decrements each ingredient with a single atomic,
  quantity-guarded update (`$gte` the amount needed), so concurrent orders
  cannot drive stock negative. If any ingredient turns out to be short, the
  deductions already applied for that order are rolled back and the order is
  marked `fulfillmentStatus: 'blocked'` — a paid order is never silently lost.
- **Manual inventory edits** use the Mongoose version key as an optimistic
  lock, so the second of two admins editing the same item gets a `409` rather
  than overwriting the first.

## Order lifecycle

```
created ──► pending ──payment verified──► paid ──► Order Received
                                            │           │
                                     stock short?       ▼
                                            │      In Kitchen
                                            ▼           │
                                         blocked        ▼
                                                 Sent to Delivery
```

`paymentStatus` (`pending`/`paid`/`failed`), `fulfillmentStatus`
(`pending`/`confirmed`/`blocked`) and `orderStatus` (the three kitchen
stages) are separate fields because they answer separate questions and move at
different times. Only payment verification sets the first `orderStatus`; only an
admin advances it, one stage at a time, and each transition is appended to
`statusHistory` with the admin who made it.

## Live tracking

The order detail page polls `GET /orders/:id` every 5 seconds
(`client/src/hooks/useOrderStatusPolling.js`) while — and only while — the order
is paid, not blocked, and short of `Sent to Delivery`. Polling stops on the
terminal status, on unmount, and when the order id changes. A failed poll keeps
the last known status on screen and retries on the next tick.

This is polling rather than WebSockets by choice: one endpoint, no connection
state to manage, no sticky-session requirement at the load balancer, and 5
seconds of latency is invisible for a kitchen status board. The hook is the
single place that would change if push ever became worth it.

## Scheduled low-stock alerts

`server/jobs/lowStockCron.job.js` runs on node-cron inside the API process,
independent of any request — so the check happens whether or not an admin has
the inventory page open. It is started from `server.js`, never from `app.js`, so
importing the app in a test never starts a background timer.

An in-process guard skips a tick while the previous check is still running. When
an item newly falls below its threshold, one consolidated email goes to
`ADMIN_EMAIL` and each affected item is marked `lowStockAlertSent: true`, so the
next run does not re-alert for the same unresolved shortage; the flag clears when
the item is restocked above its threshold, so a later shortage alerts again. A
failed send is never marked as sent, so the next run retries it.

Running a scheduler in the web process is the right trade at this size; it is
also the first thing to move out (to a dedicated worker) if the API is ever
scaled to more than one instance, since each instance would otherwise run its
own copy of the check.

## Client structure

```
client/src/
├── components/   Presentational building blocks and the route guards
├── pages/        One component per route
├── layouts/      AuthLayout, DashboardLayout
├── context/      authContext.js (the context) + AuthProvider.jsx (the provider)
├── hooks/        useAuth, useOrderStatusPolling, useRazorpayCheckout
├── services/     One module per API resource, over a single Axios instance
├── utils/        Currency, validators, order-draft storage, error extraction
└── tests/        Vitest + Testing Library
```

`services/api.js` is the only place the API base URL and `withCredentials` are
configured. Pages never call Axios directly, so changing transport concerns is a
one-file change. Session state is the single piece of global state; everything
else is local to a page, which is why there is no state-management library here.
