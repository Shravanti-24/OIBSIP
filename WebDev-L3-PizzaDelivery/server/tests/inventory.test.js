import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { env } from '../config/env.js';

// No live MongoDB is available in this test environment (see tests/setup.js).
// These tests exercise auth/role gating and pre-database validation only.
function fakeAuthToken(role = 'user') {
  return jwt.sign({ sub: '000000000000000000000000', role }, env.jwtSecret, { expiresIn: '1h' });
}

const adminHeader = () => ({ Authorization: `Bearer ${fakeAuthToken('admin')}` });
const userHeader = () => ({ Authorization: `Bearer ${fakeAuthToken('user')}` });
const validId = '000000000000000000000001';

describe('GET /api/admin/inventory', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).get('/api/admin/inventory');
    expect(res.status).toBe(401);
  });

  it('rejects a normal (non-admin) user', async () => {
    const res = await request(app).get('/api/admin/inventory').set(userHeader());
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/inventory/:id', () => {
  it('rejects a normal (non-admin) user', async () => {
    const res = await request(app).get(`/api/admin/inventory/${validId}`).set(userHeader());
    expect(res.status).toBe(403);
  });

  it('rejects a malformed id before touching the database', async () => {
    const res = await request(app).get('/api/admin/inventory/not-an-id').set(adminHeader());
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/admin/inventory/:id', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).patch(`/api/admin/inventory/${validId}`).send({ quantity: 10 });
    expect(res.status).toBe(401);
  });

  it('rejects a normal user even with an otherwise valid payload', async () => {
    const res = await request(app).patch(`/api/admin/inventory/${validId}`).set(userHeader()).send({ quantity: 10 });
    expect(res.status).toBe(403);
  });

  it('rejects a malformed id before touching the database', async () => {
    const res = await request(app)
      .patch('/api/admin/inventory/not-an-id')
      .set(adminHeader())
      .send({ quantity: 10 });
    expect(res.status).toBe(400);
  });

  it('rejects a negative quantity before touching the database', async () => {
    const res = await request(app).patch(`/api/admin/inventory/${validId}`).set(adminHeader()).send({ quantity: -5 });
    expect(res.status).toBe(400);
  });

  it('rejects a non-numeric quantity before touching the database', async () => {
    const res = await request(app)
      .patch(`/api/admin/inventory/${validId}`)
      .set(adminHeader())
      .send({ quantity: 'abc' });
    expect(res.status).toBe(400);
  });

  it('rejects an out-of-range quantity before touching the database', async () => {
    const res = await request(app)
      .patch(`/api/admin/inventory/${validId}`)
      .set(adminHeader())
      .send({ quantity: Infinity });
    expect(res.status).toBe(400);
  });

  it('rejects a negative threshold before touching the database', async () => {
    const res = await request(app)
      .patch(`/api/admin/inventory/${validId}`)
      .set(adminHeader())
      .send({ threshold: -1 });
    expect(res.status).toBe(400);
  });

  it('rejects an empty update body before touching the database', async () => {
    const res = await request(app).patch(`/api/admin/inventory/${validId}`).set(adminHeader()).send({});
    expect(res.status).toBe(400);
  });
});
