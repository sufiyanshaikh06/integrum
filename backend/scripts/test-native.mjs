import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const backend = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: path.join(backend, '.env') });
let defaultAdminUrl;
if (process.env.DATABASE_URL) {
  try {
    const u = new URL(process.env.DATABASE_URL);
    u.pathname = '/postgres';
    u.search = '';
    u.hash = '';
    defaultAdminUrl = u.toString();
  } catch (err) {
    console.warn('Could not derive default maintenance URL from DATABASE_URL:', err);
  }
}
const raw = process.env.NATIVE_TEST_ADMIN_URL || defaultAdminUrl;
if (!raw) throw new Error('Set NATIVE_TEST_ADMIN_URL to a local PostgreSQL maintenance database URL. Do not paste credentials into chat.');
let adminUrl;
try { adminUrl = new URL(raw); } catch { throw new Error('NATIVE_TEST_ADMIN_URL must be a valid PostgreSQL URL.'); }
if (!['postgres:', 'postgresql:'].includes(adminUrl.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(adminUrl.hostname) ||
    adminUrl.pathname !== '/postgres' || adminUrl.search || adminUrl.hash) {
  throw new Error('Only a loopback PostgreSQL URL for /postgres without query parameters is accepted.');
}
const database = `integrum_native_${randomBytes(8).toString('hex')}_test`;
const testUrl = new URL(adminUrl); testUrl.pathname = `/${database}`;
const logDir = path.join(backend, 'test-results', database);
await mkdir(logDir, { recursive: true });
const childEnv = {
  ...process.env, DATABASE_URL: testUrl.toString(), NODE_ENV: 'test',
  JWT_ACCESS_SECRET: randomBytes(32).toString('hex'), JWT_REFRESH_SECRET: randomBytes(32).toString('hex'),
  ACCESS_TOKEN_EXPIRES_IN: '15m', REFRESH_TOKEN_EXPIRES_IN: '7d', BCRYPT_SALT_ROUNDS: '4',
  CLIENT_URL: 'http://localhost:5173', PORT: '5000', TRUST_PROXY_HOPS: '0',
  AI_PROVIDER: 'mock', STORAGE_PROVIDER: 'local', EMAIL_PROVIDER: 'console',
  SEED_ADMIN_EMAIL: 'native-admin@integrum.test', SEED_ADMIN_PASSWORD: 'NativeTestOnly123!',
};
delete childEnv.NATIVE_TEST_ADMIN_URL;
function sanitize(text) {
  return text.replaceAll(raw, '[maintenance URL]').replaceAll(testUrl.toString(), '[test URL]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[database URL]')
    .replace(/\b[a-f0-9]{64}\b/gi, '[redacted test token]');
}
async function run(name, args) {
  console.log(`Running ${name}`);
  let output = '';
  const child = spawn(process.execPath, args, { cwd: backend, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const timer = setTimeout(() => child.kill(), 180000);
  let code;
  try {
    code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); });
  } finally { clearTimeout(timer); }
  await writeFile(path.join(logDir, `${name}.log`), sanitize(output));
  if (code !== 0) throw new Error(`${name} failed; inspect its local log.`);
  console.log(`PASS ${name}`);
}
async function verifyConnections() {
  const a = new pg.Client({ connectionString: testUrl.toString(), connectionTimeoutMillis: 5000 });
  const b = new pg.Client({ connectionString: testUrl.toString(), connectionTimeoutMillis: 5000 });
  let pending;
  try {
    await a.connect(); await b.connect();
    const version = (await a.query('SELECT version() AS version')).rows[0].version;
    await writeFile(path.join(logDir, 'server.txt'), version + '\n');
    await a.query('CREATE TABLE native_lock_probe (id integer PRIMARY KEY, value integer NOT NULL)');
    await a.query('INSERT INTO native_lock_probe VALUES (1, 0)');
    await b.query("SET statement_timeout = '10s'");
    const pid = (await b.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    await a.query('BEGIN');
    await a.query('UPDATE native_lock_probe SET value = 100 WHERE id = 1');
    pending = b.query('UPDATE native_lock_probe SET value = value + 1 WHERE id = 1').then(() => null, e => e);
    let blocked = false;
    for (let i = 0; i < 40; i++) {
      // Clear the statistics snapshot so each check observes the other connection.
      await a.query('SELECT pg_stat_clear_snapshot()');
      const row = (await a.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid = $1', [pid])).rows[0];
      if (row?.wait_event_type === 'Lock') { blocked = true; break; }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert(blocked, 'The second connection must wait for the first transaction');
    await a.query('ROLLBACK');
    const error = await pending; if (error) throw error;
    assert.equal((await a.query('SELECT value FROM native_lock_probe WHERE id = 1')).rows[0].value, 1);
    await a.query('DROP TABLE native_lock_probe');
    console.log('PASS independent connections, row lock and rollback');
  } finally {
    await a.query('ROLLBACK').catch(() => {});
    if (pending) await pending;
    await Promise.allSettled([a.end(), b.end()]);
  }
}
const admin = new pg.Client({ connectionString: raw, connectionTimeoutMillis: 5000 });
let created = false;
let passed = false;
let cleanupSucceeded = false;
try {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`); created = true;
  console.log(`Created disposable database ${database}`);
  await verifyConnections();
  const prisma = path.resolve(path.dirname(require.resolve('prisma/package.json')), require('prisma/package.json').bin.prisma);
  const tsc = path.resolve(path.dirname(require.resolve('typescript/package.json')), require('typescript/package.json').bin.tsc);
  await run('migrations', [prisma, 'migrate', 'deploy']);
  await run('migration-status', [prisma, 'migrate', 'status']);
  await run('generate', [prisma, 'generate']);
  await run('build', [tsc, '-p', 'tsconfig.json']);
  await run('test-types', [tsc, '-p', 'tsconfig.tests.json']);
  await run('seed', ['--import', 'tsx', 'prisma/seed.ts']);
  await run('closure', ['--import', 'tsx', '--test', 'scripts/test-day1.test.ts']);
  await run('production-smoke', ['--import', 'tsx', 'scripts/test-production-hardening.ts']);
  await run('browser-workflow', ['--import', 'tsx', 'scripts/test-browser-workflow.ts']);
  passed = true;
} catch (error) {
  console.error(sanitize(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
} finally {
  if (created) {
    try {
      await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()', [database]);
      await admin.query(`DROP DATABASE "${database}"`);
      cleanupSucceeded = true;
      console.log(`Removed disposable database ${database}`);
    } catch {
      console.error(`Cleanup failed: remove only ${database} manually after closing its connections.`);
      process.exitCode = 1;
    }
  }
  await admin.end().catch(() => {});
  await writeFile(path.join(logDir, 'result.json'), JSON.stringify({ database, testsPassed: passed, cleanupSucceeded, completedAt: new Date().toISOString() }, null, 2));
  console.log(`Logs: ${logDir}`);
}
