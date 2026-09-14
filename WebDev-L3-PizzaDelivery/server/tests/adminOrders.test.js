import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { env } from '../config/env.js';

// No live MongoDB is available in this test environment (see tests/setup.js).
// A signed token lets requests pass requireAuth without touching the
// database, so these tests exercise auth/role gating and the pre-database
// validation in adminOrderValidators.js.
function fakeAuthToken(role = 'user') {
  return jwt.sign({ sub: '000000000000000000000000', role }, env.jwtSecret, { expiresIn: '1h' });
}

const userAuthHeader = () => ({ Authorization: `Bearer ${fakeAuthToken('user')}` });
const adminAuthHeader = () => ({ Authorization: `Bearer ${fakeAuthToken('admin')}` });

describe('GET /api/admin/orders', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).get('/api/admin/orders');
    expect(res.status).toBe(401);
  });

  it('rejects a normal (non-admin) user', async () => {
    const res = await request(app).get('/api/admin/orders').set(userAuthHeader());
    expect(res.status).toBe(403);
  });

  it('rejects an invalid status filter before touching the database', async () => {
    const res = await request(app).get('/api/admin/orders?status=cooking').set(adminAuthHeader());
    expect(res.status).toBe(400);
  });

  it('rejects an invalid page/limit before touching the database', async () => {
    const res = await request(app).get('/api/admin/orders?page=0').set(adminAuthHeader());
    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/orders/:id', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).get('/api/admin/orders/000000000000000000000001');
    expect(res.status).toBe(401);
  });

  it('rejects a normal (non-admin) user', async () => {
    const res = await request(app).get('/api/admin/orders/000000000000000000000001').set(userAuthHeader());
    expect(res.status).toBe(403);
  });

  it('rejects a malformed order id before touching the database', async () => {
    const res = await request(app).get('/api/admin/orders/not-an-id').set(adminAuthHeader());
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/admin/orders/:id/status', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/000000000000000000000001/status')
      .send({ status: 'In Kitchen' });
    expect(res.status).toBe(401);
  });

  it('rejects a normal (non-admin) user', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/000000000000000000000001/status')
      .set(userAuthHeader())
      .send({ status: 'In Kitchen' });
    expect(res.status).toBe(403);
  });

  it('rejects a missing status', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/000000000000000000000001/status')
      .set(adminAuthHeader())
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects an unknown status value before touching the database', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/000000000000000000000001/status')
      .set(adminAuthHeader())
      .send({ status: 'cooking' });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed order id before touching the database', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/not-an-id/status')
      .set(adminAuthHeader())
      .send({ status: 'In Kitchen' });
    expect(res.status).toBe(400);
  });
});
