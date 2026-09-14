import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { env } from '../config/env.js';

// No live MongoDB is available in this test environment (see tests/setup.js).
// A signed token lets requests pass requireAuth - it doesn't touch the
// database - so these tests can still exercise auth gating and the
// pre-database validation in the pricing service.
function fakeAuthToken(role = 'user') {
  return jwt.sign({ sub: '000000000000000000000000', role }, env.jwtSecret, { expiresIn: '1h' });
}

describe('GET /api/pizzas', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).get('/api/pizzas');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/ingredients', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).get('/api/ingredients');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid category before touching the database', async () => {
    const res = await request(app)
      .get('/api/ingredients?category=meat')
      .set('Authorization', `Bearer ${fakeAuthToken()}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/builder/validate', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).post('/api/builder/validate').send({});
    expect(res.status).toBe(401);
  });

  it('rejects a malformed base ID without touching the database', async () => {
    const res = await request(app)
      .post('/api/builder/validate')
      .set('Authorization', `Bearer ${fakeAuthToken()}`)
      .send({ baseId: 'not-a-valid-id', sauceId: 'not-a-valid-id', cheeseId: 'not-a-valid-id', vegetableIds: [] });
    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(expect.any(Array));
    expect(res.body.details.some((d) => d.field === 'baseId')).toBe(true);
  });

  it('rejects a non-array vegetableIds payload without touching the database', async () => {
    const validId = '000000000000000000000001';
    const res = await request(app)
      .post('/api/builder/validate')
      .set('Authorization', `Bearer ${fakeAuthToken()}`)
      .send({ baseId: validId, sauceId: validId, cheeseId: validId, vegetableIds: 'not-an-array' });
    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'vegetableIds')).toBe(true);
  });
});
