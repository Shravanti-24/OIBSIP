# API reference

Base URL: `http://localhost:5000/api` in development, `"$CLIENT_URL"`-adjacent
in deployment. Every response is JSON and carries a `success` boolean:

```jsonc
// success
{ "success": true, "message": "Logged in successfully", "data": { "user": {} } }

// failure
{ "success": false, "message": "Invalid email or password" }

// failure with field-level validation details
{
  "success": false,
  "message": "Validation failed",
  "details": [{ "field": "password", "message": "Password must be at least 8 characters" }]
}
```

## Authentication

Authentication is a JWT in an **httpOnly cookie** named `token`, set on login
and cleared on logout. It is deliberately never included in a response body, so
page scripts cannot read it. Send credentialed requests with cookies
(`withCredentials: true` in Axios, `credentials: 'include'` in `fetch`).

Two middlewares guard the routes below:

| Marker    | Requirement                                                |
| --------- | ---------------------------------------------------------- |
| **—**     | Public                                                     |
| **auth**  | A valid session cookie                                     |
| **admin** | A valid session cookie belonging to a `role: 'admin'` user |

The frontend mirrors these rules in its route guards, but the API is the
authority — hiding a link is not access control.

## Rate limits

Authentication endpoints are rate limited per IP over a 15-minute window:
30 requests for registration/verification, 10 for login, password reset and
payment endpoints. Exceeding a limit returns `429` with a `success: false` body.

---

## Health

| Method | Path      | Access | Purpose                                             |
| ------ | --------- | ------ | --------------------------------------------------- |
| `GET`  | `/health` | —      | Liveness probe: uptime and MongoDB connection state |

---

## Auth — `/auth`

| Method | Path                   | Access | Purpose                                                    |
| ------ | ---------------------- | ------ | ---------------------------------------------------------- |
| `POST` | `/register`            | —      | Create an unverified account and email a verification link |
| `GET`  | `/verify-email?token=` | —      | Consume a verification token and mark the account verified |
| `POST` | `/resend-verification` | —      | Re-send the verification email                             |
| `POST` | `/login`               | —      | Verify credentials and set the session cookie              |
| `POST` | `/logout`              | —      | Clear the session cookie                                   |
| `POST` | `/forgot-password`     | —      | Email a password-reset link                                |
| `POST` | `/reset-password`      | —      | Consume a reset token and set a new password               |
| `GET`  | `/me`                  | auth   | The signed-in user                                         |

Notes that matter when integrating:

- **Registration can never create an admin.** The controller reads only `name`,
  `email` and `password` and hardcodes `role: 'user'`. Admins come from
  `npm run seed:admin`.
- **Login is rejected until the email is verified** (`403`).
- `forgot-password` and `resend-verification` return an identical response
  whether or not the account exists, so neither can be used to enumerate
  registered emails.
- Verification and reset tokens are random 256-bit values; only their SHA-256
  hash is stored. Verification tokens last 24 hours, reset tokens 1 hour, and a
  reset token is deleted the moment it is used.

```http
POST /api/auth/register
Content-Type: application/json

{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "pizza123" }
```

---

## Admin auth — `/admin`

| Method | Path      | Access | Purpose                                     |
| ------ | --------- | ------ | ------------------------------------------- |
| `POST` | `/login`  | —      | Admin login (rejects non-admin credentials) |
| `POST` | `/logout` | —      | Clear the session cookie                    |
| `GET`  | `/me`     | admin  | The signed-in admin                         |

---

## Catalogue — `/pizzas`, `/ingredients`

| Method | Path                     | Access | Purpose                                                |
| ------ | ------------------------ | ------ | ------------------------------------------------------ |
| `GET`  | `/pizzas`                | auth   | Ready-made pizzas, active only, in display order       |
| `GET`  | `/ingredients`           | auth   | Active builder ingredients, sorted by category         |
| `GET`  | `/ingredients?category=` | auth   | One category: `base`, `sauce`, `cheese` or `vegetable` |

Both endpoints return only `isActive` records. `/ingredients` is a flat array
ordered by category, then display order, then name - the four builder steps are
grouped on the client. An unknown `category` is a `400`, not an empty list, and
`/pizzas` arrives with its base, sauce, cheese and vegetables populated.

---

## Custom pizza builder — `/builder`

| Method | Path        | Access | Purpose                                                  |
| ------ | ----------- | ------ | -------------------------------------------------------- |
| `POST` | `/validate` | auth   | Validate a build and return the authoritative unit price |

```http
POST /api/builder/validate
{
  "baseId": "…", "sauceId": "…", "cheeseId": "…",
  "vegetableIds": ["…", "…"]
}
```

Enforces exactly one base, one sauce and one cheese, any number of vegetables,
and that every id is an active ingredient of the category it was submitted as.
The returned price is recomputed from the current `Ingredient` records — a price
supplied by the client is never read.

---

## Orders — `/orders`

| Method | Path   | Access | Purpose                                               |
| ------ | ------ | ------ | ----------------------------------------------------- |
| `POST` | `/`    | auth   | Create a `pending` order with a server-computed total |
| `GET`  | `/`    | auth   | The caller's own orders, newest first                 |
| `GET`  | `/:id` | auth   | One of the caller's own orders                        |

```http
POST /api/orders
{
  "items": [
    { "type": "ready-made", "pizzaId": "…", "quantity": 2 },
    { "type": "custom", "baseId": "…", "sauceId": "…", "cheeseId": "…",
      "vegetableIds": ["…"], "quantity": 1 }
  ]
}
```

- **The server is the price authority.** `price`, `unitPrice` and `totalAmount`
  are re-derived from the current catalogue; the same fields in the request body
  are ignored.
- Each item stores a frozen snapshot of the ingredients it was built from, so a
  later catalogue price change never rewrites order history.
- `GET /:id` is scoped to the caller. Another user's order id returns `404`, not
  `403` — the distinction would itself leak that the order exists.

---

## Payments — `/payments`

| Method | Path            | Access | Purpose                                               |
| ------ | --------------- | ------ | ----------------------------------------------------- |
| `POST` | `/create-order` | auth   | Create (or reuse) the Razorpay order for an order     |
| `POST` | `/verify`       | auth   | Verify the Razorpay signature and mark the order paid |

```http
POST /api/payments/verify
{
  "orderId": "…",
  "razorpayOrderId": "…",
  "razorpayPaymentId": "…",
  "razorpaySignature": "…"
}
```

- The signature is verified **server-side** with the Razorpay key secret. The
  frontend cannot declare a payment successful.
- Verification is idempotent: it updates under an atomic
  `paymentStatus !== 'paid'` condition, so a replayed request cannot mark the
  order paid twice or deduct inventory twice.
- On success, stock is deducted for every ingredient in the order with atomic,
  quantity-guarded updates. If an ingredient is short, earlier deductions for
  that order are rolled back and the order is flagged
  `fulfillmentStatus: 'blocked'` rather than silently losing a paid order.
- Both endpoints return `503` with a clear message when `RAZORPAY_KEY_ID` /
  `RAZORPAY_KEY_SECRET` are unset, which is the default in local development.

---

## Admin: inventory — `/admin/inventory`

| Method  | Path   | Access | Purpose                                                |
| ------- | ------ | ------ | ------------------------------------------------------ |
| `GET`   | `/`    | admin  | Every ingredient's stock, with low/out-of-stock counts |
| `GET`   | `/:id` | admin  | One inventory record                                   |
| `PATCH` | `/:id` | admin  | Update `quantity` and/or `threshold`                   |

`PATCH` takes `quantity`, `threshold` or both (neither is a `400`). It uses the
document's Mongoose version key as an **optimistic lock**: pass the `version` you
read, and if another admin changed the item since, the update returns `409`
instead of silently overwriting their edit. Omitting `version` opts out of the
check and performs a last-write-wins update.

---

## Admin: orders — `/admin/orders`

| Method  | Path          | Access | Purpose                                                |
| ------- | ------------- | ------ | ------------------------------------------------------ |
| `GET`   | `/`           | admin  | The order queue with per-status counts (paginated)     |
| `GET`   | `/:id`        | admin  | Full order detail, including customer and Razorpay ids |
| `PATCH` | `/:id/status` | admin  | Advance the order exactly one stage                    |

Query parameters on `GET /`: `status`, `page` (default 1), `limit` (default 20,
max 100). The queue contains only orders that have cleared payment and
inventory confirmation — a `pending` order is not yet actionable for a kitchen.

The lifecycle is a strictly forward-only, one-step-at-a-time state machine:

```
Order Received  →  In Kitchen  →  Sent to Delivery
```

`PATCH /:id/status` accepts only the single legal next status for the order's
current stage. Skipping a stage, repeating one or moving backwards is a `400`,
however the request is crafted. Each transition appends to the order's
`statusHistory` with the admin who made it.
