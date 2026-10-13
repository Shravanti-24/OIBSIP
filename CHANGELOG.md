# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-13

First complete release: ordering, payment, fulfilment and inventory all work
end to end.

### Added

- Email-verified accounts with JWT sessions in httpOnly cookies, password
  reset, and enumeration-safe forgot-password and resend-verification
  responses.
- A ready-made pizza catalogue and a four-step custom builder, priced by the
  server on every request.
- Razorpay checkout in INR with server-side signature verification, made
  idempotent so a replayed callback cannot charge or deduct stock twice.
- Atomic, quantity-guarded inventory deduction with rollback, and an order
  flagged as blocked rather than lost when an ingredient is short.
- A three-stage order lifecycle an admin advances one step at a time, with
  status history, and customer-side tracking that polls every five seconds.
- An admin dashboard for inventory (optimistic locking on concurrent edits)
  and for the order queue.
- A scheduled low-stock check that emails one consolidated alert per new
  shortage and re-arms when the item is restocked.
- Docker Compose stack, GitHub Actions CI, and API and architecture docs.

[1.0.0]: https://github.com/Shravanti-24/pizza-house/releases/tag/v1.0.0
