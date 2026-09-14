import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { env } from '../config/env.js';

// No live MongoDB is available in this test environment (see tests/setup.js).
// A signed token lets requests pass requireAuth without touching the
// database, so these tests exercise auth gating and the pre-database
// validation in order.service.js / payment endpoints.
function fakeAuthToken(role = 'user') {
  return jwt.sign({ sub: '000000000000000000000000', role }, env.jwtSecret, { expiresIn: '1h' });
}

const authHeader = () => ({ Authorization: `Bearer ${fakeAuthToken()}` });

describe('POST /api/orders', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).post('/api/orders').send({ items: [] });
    expect(res.status).toBe(401);
  });

  it('rejects an empty items array', async () => {
    const res = await request(app).post('/api/orders').set(authHeader()).send({ items: [] });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown item type before touching the database', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(authHeader())
      .send({ items: [{ type: 'discount', quantity: 1 }] });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed ready-made pizzaId before touching the database', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(authHeader())
      .send({ items: [{ type: 'ready-made', pizzaId: 'not-an-id', quantity: 1 }] });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid quantity before touching the database', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(authHeader())
      .send({ items: [{ type: 'ready-made', pizzaId: '000000000000000000000001', quantity: 0 }] });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/orders', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders/:id', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).get('/api/orders/000000000000000000000001');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/payments/create-order', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).post('/api/payments/create-order').send({ orderId: '000000000000000000000001' });
    expect(res.status).toBe(401);
  });

  it('rejects a missing orderId before touching the database', async () => {
    const res = await request(app).post('/api/payments/create-order').set(authHeader()).send({});
    expect(res.status).toBe(400);
  });

  it('rejects a malformed orderId before touching the database', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .set(authHeader())
      .send({ orderId: 'not-an-id' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/payments/verify', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).post('/api/payments/verify').send({});
    expect(res.status).toBe(401);
  });

  it('rejects a request missing payment fields', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .set(authHeader())
      .send({ orderId: '000000000000000000000001' });
    expect(res.status).toBe(400);
  });
});
