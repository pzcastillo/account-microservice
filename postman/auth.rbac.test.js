// tests/auth.rbac.test.js
const request = require('supertest');
const app = require('../src/server'); // change server export if needed
// NOTE: For testing, refactor server.js to export app without listening.

describe('Auth & RBAC', () => {
  it('should reject requests without token', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.statusCode).toBe(401);
  });
  // More tests: create admin, login, access accounts with admin token
});
