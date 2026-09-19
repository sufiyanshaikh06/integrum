import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';

async function main() {
assert.equal(process.env.NODE_ENV, 'test');
assert(new URL(process.env.DATABASE_URL!).pathname.endsWith('_test'));
const rejected = spawnSync(process.execPath, ['-e', "require('./dist/config/env.js')"], {
  env: { ...process.env, NODE_ENV: 'production', JWT_ACCESS_SECRET: 'weak', JWT_REFRESH_SECRET: 'weak' },
  stdio: 'ignore', timeout: 5000,
});
assert.equal(rejected.status, 1, 'Production refuses weak secrets');
const child = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, NODE_ENV: 'production', PORT: '5099', TRUST_PROXY_HOPS: '0',
    JWT_ACCESS_SECRET: randomBytes(32).toString('hex'), JWT_REFRESH_SECRET: randomBytes(32).toString('hex') },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const exited = once(child, 'exit');
let output = '';
child.stdout.on('data', data => { output += data.toString(); });
child.stderr.on('data', () => {});
const base = 'http://127.0.0.1:5099/api/v1';
try {
  for (let i = 0; i < 100 && !output.includes('Server is running'); i++) {
    assert.equal(child.exitCode, null, 'Compiled server exited before listening');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(output.includes('Server is running'), 'Compiled server did not start');
  const health = await fetch(base + '/health');
  assert.equal(health.status, 200);
  assert.equal((await health.json() as any).data.database, 'connected');
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(health.headers.get('x-powered-by'), null);
  const denied = await fetch(base + '/users/me'); assert.equal(denied.status, 401);
  const malformed = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  const oversized = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: 'x'.repeat(270000) }) });
  assert.equal(oversized.status, 413);
  let status = 0;
  for (let i = 0; i < 11; i++) {
    const response = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    status = response.status;
    await response.text();
    if (status === 429) break;
  }
  assert.equal(status, 429, 'Production auth rate limit is enforced');
  console.log('PASS: compiled production server, database health, headers, authentication, body limits and rate limiting');
} finally {
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  const [code] = await exited;
  clearTimeout(timer);
  assert.equal(code, 0, 'Compiled server shuts down cleanly');
}

}
main().catch(error => { console.error(error); process.exitCode = 1; });
