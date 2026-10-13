# Screenshots

| File                      | Screen                                                   |
| ------------------------- | -------------------------------------------------------- |
| `01-landing.png`          | Landing page (signed out)                                |
| `02-dashboard.png`        | Pizza menu after sign-in                                 |
| `03-builder.png`          | Custom pizza builder, mid-build, with live pricing       |
| `04-order-review.png`     | Order summary before payment                             |
| `05-order-tracking.png`   | Customer order tracking, mid-lifecycle                   |
| `06-admin-orders.png`     | Admin order queue with per-status counts                 |
| `07-admin-inventory.png`  | Admin inventory with low/out-of-stock states             |

All are captures of the real web client (Vite dev server, Chromium at 1360×900,
2× device scale). The API responses behind them are fixtures matching the shapes
the Express API returns, populated with this repository's own seed data
(`server/seed/`), because the machine they were captured on had no MongoDB
available. Pizza artwork is generated locally for the same reason — the seeded
catalogue points at Unsplash URLs that were unreachable there.

The UI, routing, styling, state and formatting are the application's own.
