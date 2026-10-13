import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/health', () => {
  it('reports the API is running', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('database');
  });
});

describe('unknown routes', () => {
  it('returns a 404 JSON error for an unmatched route', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/register validation', () => {
  it('rejects a request missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toEqual(expect.any(Array));
  });

  it('rejects a request where password and confirmPassword do not match', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'Password1',
      confirmPassword: 'Password2',
    });
    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => /match/i.test(d.message))).toBe(true);
  });

  it('passes validation even with a client-supplied role field, since role is never read from the body', async () => {
    // No MongoDB is available in this test environment (see tests/setup.js, which disables
    // command buffering so DB calls fail fast). This still proves the request clears validation
    // instead of being rejected for the extra "role" field, before failing later on the DB call -
    // auth.controller.js#register never reads req.body.role and unconditionally sets role: 'user'.
    const res = await request(app).post('/api/auth/register').send({
      name: 'Eve Attacker',
      email: 'eve@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
      role: 'admin',
    });
    expect(res.status).not.toBe(400);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/me', () => {
  it('rejects a request with no auth token', async () => {
    const res = await request(app).get('/api/admin/me');
    expect(res.status).toBe(401);
  });
});
