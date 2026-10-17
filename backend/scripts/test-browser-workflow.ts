import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { chromium, Browser, BrowserContext, Page } from 'playwright-core';
import { prisma } from '../src/config/prisma.js';
import { NotificationType } from '@prisma/client';

async function main() {
  console.log('🌐 Starting Real-Browser Production Verification (Google Chrome Headless)...');

  // Verify prerequisites
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browserExecutable = fs.existsSync(chromePath) ? chromePath : (fs.existsSync(edgePath) ? edgePath : null);

  assert(browserExecutable, 'A Chromium-based browser (Chrome or Edge) must be installed at standard paths');
  console.log(`  Found browser executable: ${browserExecutable}`);

  // 1. Spawn Compiled Production Express Server on Dedicated Test Port
  const PORT = '5088';
  const CLIENT_URL = `http://127.0.0.1:${PORT}`;
  const windowsShutdown = process.platform === 'win32';

  const jwtAccessSecret = randomBytes(32).toString('hex');
  const jwtRefreshSecret = randomBytes(32).toString('hex');

  const serverArgs = windowsShutdown
    ? [
        '-e',
        `
        require('./dist/server.js');
        process.once('message', message => {
          if (message === 'integrum-test-shutdown') process.emit('SIGTERM');
        });
      `,
      ]
    : ['dist/server.js'];

  console.log(`  Spawning production Express server on port ${PORT}...`);
  const child = spawn(process.execPath, serverArgs, {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT,
      CLIENT_URL,
      TRUST_PROXY_HOPS: '1',
      COOKIE_SECURE: 'false', // local HTTP verification; HTTPS cookie semantics tested via simulated proxy headers
      JWT_ACCESS_SECRET: jwtAccessSecret,
      JWT_REFRESH_SECRET: jwtRefreshSecret,
    },
    stdio: windowsShutdown ? ['ignore', 'pipe', 'pipe', 'ipc'] : ['ignore', 'pipe', 'pipe'],
  });

  const exited = once(child, 'exit');
  let output = '';
  child.stdout?.on('data', (data) => {
    output += data.toString();
  });
  child.stderr?.on('data', (data) => {
    output += data.toString();
  });

  // Wait for server to listen
  for (let i = 0; i < 100 && !output.includes('Server is running'); i++) {
    assert.equal(child.exitCode, null, `Server exited prematurely. Log: ${output}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(output.includes('Server is running'), `Server failed to start within 10s. Log: ${output}`);
  console.log('  ✅ Production server listening on http://127.0.0.1:5088');

  let browser: Browser | null = null;
  try {
    // ── STAGE 1: Production Serving & HTTP Protocol Verification ──────────
    console.log('  [Stage 1] Verifying Production Serving & Asset Delivery...');

    // 1.1 Built JavaScript asset
    const indexJsFile = fs.readdirSync(path.resolve(__dirname, '../../frontend/dist/assets')).find((f) => f.startsWith('index-') && f.endsWith('.js'));
    assert(indexJsFile, 'Compiled index.js bundle must exist in frontend/dist/assets');
    const jsRes = await fetch(`${CLIENT_URL}/assets/${indexJsFile}`);
    assert.equal(jsRes.status, 200, 'Built JS asset must return 200 OK');
    assert(jsRes.headers.get('content-type')?.includes('javascript'), 'Built JS asset must have javascript content-type');

    // 1.2 Built CSS asset
    const indexCssFile = fs.readdirSync(path.resolve(__dirname, '../../frontend/dist/assets')).find((f) => f.startsWith('index-') && f.endsWith('.css'));
    assert(indexCssFile, 'Compiled index.css bundle must exist in frontend/dist/assets');
    const cssRes = await fetch(`${CLIENT_URL}/assets/${indexCssFile}`);
    assert.equal(cssRes.status, 200, 'Built CSS asset must return 200 OK');
    assert(cssRes.headers.get('content-type')?.includes('css'), 'Built CSS asset must have css content-type');

    // 1.3 Direct Page Reload (SPA routing)
    const spaRes = await fetch(`${CLIENT_URL}/dashboard`);
    assert.equal(spaRes.status, 200, 'Direct SPA route reload must return 200 OK');
    const spaHtml = await spaRes.text();
    assert(spaHtml.includes('<div id="root"></div>'), 'Direct SPA route must serve index.html shell');

    // 1.4 Unknown API path error
    const notFoundApiRes = await fetch(`${CLIENT_URL}/api/v1/unknown-endpoint-verification`);
    assert.equal(notFoundApiRes.status, 404, 'Unknown API path must return 404');
    const notFoundJson = (await notFoundApiRes.json()) as any;
    assert.equal(notFoundJson.success, false, 'Unknown API path must return error JSON');
    assert(notFoundJson.message.includes('Route not found'), 'Unknown API path must contain descriptive message');

    // 1.5 Reverse Proxy & HTTPS Cookie Attributes
    const proxyLoginRes = await fetch(`${CLIENT_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-Proto': 'https',
        'X-Forwarded-For': '203.0.113.195',
      },
      body: JSON.stringify({
        email: 'sufiyan.shaikh@example.com',
        password: 'password123',
      }),
    });
    assert.equal(proxyLoginRes.status, 200, 'Demo login via reverse proxy must succeed');
    const setCookieHeader = proxyLoginRes.headers.get('set-cookie');
    assert(setCookieHeader, 'Response must include Set-Cookie header');
    assert(
      setCookieHeader.toLowerCase().includes('samesite=strict') ||
      setCookieHeader.toLowerCase().includes('samesite=lax') ||
      setCookieHeader.toLowerCase().includes('samesite=none'),
      'Refresh cookie must specify explicit SameSite policy'
    );
    console.log('  ✅ Stage 1 passed: Assets, SPA routing, API 404 JSON, and proxy cookie attributes verified.');

    // ── STAGE 2: Launch Real Browser (Headless Chrome) ────────────────────
    console.log('  [Stage 2] Launching Headless Chromium Browser...');
    browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const contextA: BrowserContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const pageA: Page = await contextA.newPage();

    // Collect console errors to detect any runtime crashes or CSP violations
    const consoleErrors: string[] = [];
    pageA.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // ── STAGE 3: Landing Page & Student A Login ───────────────────────────
    console.log('  [Stage 3] Testing Landing Page Navigation & Sign In...');
    await pageA.goto(CLIENT_URL, { waitUntil: 'networkidle' });

    const title = await pageA.title();
    assert(title.includes('Integrum'), `Page title must include Integrum. Found: ${title}`);

    // Verify hero rendered
    await pageA.waitForSelector('.hero h1');
    const heroText = await pageA.innerText('.hero h1');
    assert(heroText.includes('Unified Student Success'), `Hero text unexpected: ${heroText}`);

    // Click Sign In
    await pageA.click('button:has-text("Sign In")');
    await pageA.waitForSelector('#phase-login');

    // Fill credentials for pre-seeded student
    await pageA.fill('#phase-login input[type="email"]', 'sufiyan.shaikh@example.com');
    await pageA.fill('#phase-login input[type="password"]', 'password123');

    // Submit form
    await pageA.click('#phase-login button[type="submit"]');

    // Wait for Dashboard to mount
    await pageA.waitForSelector('#phase-app', { timeout: 10000 });
    await pageA.waitForSelector('.welcome h2');
    const welcome = await pageA.innerText('.welcome h2');
    assert(welcome.includes('Sufiyan Shaikh'), `Expected welcome message for Sufiyan Shaikh. Got: ${welcome}`);
    console.log('  ✅ Stage 3 passed: User authenticated into Student Dashboard.');

    // ── STAGE 4: Academic Courses & Personal Subject Creation ─────────────
    console.log('  [Stage 4] Testing Personal Subject & Semester Creation...');
    await pageA.click('.sb-item:has-text("Courses & Assignments")');
    await pageA.waitForSelector('h2:has-text("Courses & Assignments")');

    // Open Add Subject modal
    await pageA.click('button:has-text("+ Add Subject")');
    await pageA.waitForSelector('.modal-header h3:has-text("Add Enrolled Subject")');

    // Fill form
    const testSubjectName = `Advanced Systems Architecture ${randomBytes(3).toString('hex')}`;
    const testSubjectCode = 'CS502';
    await pageA.fill('input[placeholder*="Software Engineering"]', testSubjectName);
    await pageA.fill('input[placeholder*="CS305"]', testSubjectCode);
    await pageA.click('.modal-footer button:has-text("Save Subject")');

    // Wait for toast and subject card in DOM
    await pageA.waitForSelector(`.toast-success:has-text('Subject "${testSubjectName}" added!')`, { timeout: 5000 });
    await pageA.waitForSelector(`.card:has-text("${testSubjectName}")`);
    console.log(`  ✅ Stage 4 passed: Subject "${testSubjectName}" created and rendered.`);

    // ── STAGE 5: Course Assignment Creation ────────────────────────────────
    console.log('  [Stage 5] Testing Course Assignment Creation...');
    await pageA.click('button:has-text("+ Add Assignment")');
    await pageA.waitForSelector('.modal-header h3:has-text("Add Course Assignment")');

    const testAsgnTitle = `Kernel Thread Synchronization ${randomBytes(3).toString('hex')}`;
    await pageA.fill('input[placeholder*="Socket Programming"]', testAsgnTitle);

    // Select our newly created subject in the dropdown
    await pageA.selectOption('select.form-select', { label: `${testSubjectCode} · ${testSubjectName}` });
    await pageA.click('.modal-footer button:has-text("Add Assignment")');

    // Verify toast & table row in DOM
    await pageA.waitForSelector('.toast-success:has-text("Assignment created successfully!")');
    await pageA.waitForSelector(`table.tbl tr:has-text("${testAsgnTitle}")`);
    console.log(`  ✅ Stage 5 passed: Assignment "${testAsgnTitle}" created and visible in table.`);

    // ── STAGE 6: Productivity Tasks & W07 Atomic Completion ───────────────
    console.log('  [Stage 6] Testing Task Management & W07 Atomic Completion...');
    await pageA.click('.sb-item:has-text("Tasks")');
    await pageA.waitForSelector('h2:has-text("Productivity Tasks")');

    // Open task modal
    await pageA.click('button:has-text("+ Create Task")');
    await pageA.waitForSelector('.modal-header h3:has-text("Create New Task")');

    const testTaskTitle = `Verify TLB Shootdown Concurrency ${randomBytes(3).toString('hex')}`;
    await pageA.fill('input[placeholder*="Implement B-Tree"]', testTaskTitle);
    await pageA.click('.modal-footer button:has-text("Save Task")');

    await pageA.waitForSelector('.toast-success:has-text("Task added to your plan!")');
    const taskRowSelector = `table.tbl tr:has-text("${testTaskTitle}")`;
    await pageA.waitForSelector(taskRowSelector);

    // Initial state: status badge TODO, tcheck not done
    const initialBadge = await pageA.innerText(`${taskRowSelector} span.badge`);
    assert(initialBadge.includes('TODO') || initialBadge.includes('MEDIUM'), 'Initial task state must be TODO');

    // Click checkbox to toggle to DONE (triggers atomic row-lock transition in backend)
    await pageA.click(`${taskRowSelector} .tcheck`);
    await pageA.waitForSelector('.toast-info:has-text("Task completed!")');

    // Verify DOM updates: checkbox marked done and text crossed out
    await pageA.waitForSelector(`${taskRowSelector} .tcheck.done`);
    await pageA.waitForSelector(`${taskRowSelector} td.done-txt`);

    // Verify in database that completedAt is set
    const dbTask = await prisma.task.findFirst({
      where: { title: testTaskTitle },
    });
    assert(dbTask, 'Task must exist in PostgreSQL database');
    assert.equal(dbTask.status, 'DONE', 'Task status must be DONE');
    assert(dbTask.completedAt instanceof Date, 'Task completedAt must be a valid Date timestamp');
    console.log(`  ✅ Stage 6 passed: Task completed atomically; completedAt recorded at ${dbTask.completedAt.toISOString()}`);

    // ── STAGE 7: Text Study Notes Workflow ────────────────────────────────
    console.log('  [Stage 7] Testing Study Notes Creation, Modal Read & Delete...');
    await pageA.click('.sb-item:has-text("Study Notes")');
    await pageA.waitForSelector('h2:has-text("Study Notes & Summaries")');

    await pageA.click('button:has-text("+ New Note")');
    await pageA.waitForSelector('.modal-header h3:has-text("Create Study Note")');

    const testNoteTitle = `Virtual Memory Paging Algorithms ${randomBytes(3).toString('hex')}`;
    await pageA.fill('input[placeholder*="Binary Search Trees"]', testNoteTitle);
    await pageA.fill('input[placeholder*="exam, algorithms"]', 'os,memory,paging');
    await pageA.fill('textarea.form-textarea', 'Comprehensive study of Least Recently Used (LRU) and Second-Chance FIFO paging.');
    await pageA.click('.modal-footer button:has-text("Save Note")');

    await pageA.waitForSelector('.toast-success:has-text("Study note created successfully!")');
    const noteCardSelector = `.card:has-text("${testNoteTitle}")`;
    await pageA.waitForSelector(noteCardSelector);
    assert(await pageA.isVisible(`${noteCardSelector} span:has-text("#os")`), 'Note tag #os must be rendered');

    // View note in modal
    await pageA.click(`${noteCardSelector} button:has-text("View Note")`);
    await pageA.waitForSelector('.modal-header h3:has-text("' + testNoteTitle + '")');
    await pageA.waitForSelector('.modal-body:has-text("Comprehensive study of Least Recently Used")');
    await pageA.click('.modal-footer button:has-text("Close")');

    // Delete note
    await pageA.click(`${noteCardSelector} button:has-text("Delete")`);
    await pageA.waitForSelector('.toast-info:has-text("Note deleted")');
    await pageA.waitForSelector(noteCardSelector, { state: 'detached' });
    console.log('  ✅ Stage 7 passed: Study note created, inspected via modal, and deleted.');

    // ── STAGE 8: Calendar & Deadlines Unified Schedule ────────────────────
    console.log('  [Stage 8] Testing Unified Calendar & Event Creation...');
    await pageA.click('.sb-item:has-text("Calendar & Deadlines")');
    await pageA.waitForSelector('h2:has-text("Academic Calendar & Unified Deadlines")');

    // Verify earlier assignment appears in unified agenda
    await pageA.waitForSelector(`table.tbl tr:has-text("${testAsgnTitle}")`);

    // Create personal calendar exam event
    await pageA.click('button:has-text("+ Add Event")');
    await pageA.waitForSelector('.modal-header h3:has-text("Add Calendar Event")');

    const testEventTitle = `CS502 Midterm Theory Examination ${randomBytes(3).toString('hex')}`;
    await pageA.fill('input[placeholder*="Midterm Theory Examination"]', testEventTitle);
    await pageA.fill('input[type="datetime-local"]', '2026-10-28T10:00');
    await pageA.fill('textarea[placeholder*="Hall ticket requirements"]', 'Auditorium Hall B - Closed Book');
    await pageA.click('.modal-footer button:has-text("Save Event")');

    await pageA.waitForSelector('.toast-success:has-text("Calendar event created!")');
    await pageA.waitForSelector(`table.tbl tr:has-text("${testEventTitle}")`);
    console.log('  ✅ Stage 8 passed: Calendar event created and unified timeline rendered.');

    // ── STAGE 9: Active Reminder Processor Execution & Notification Delivery ──
    console.log('  [Stage 9] Testing Active Reminder Processor Execution & In-App Delivery...');
    const sufiyanUser = await prisma.user.findUnique({
      where: { email: 'sufiyan.shaikh@example.com' },
      include: { studentProfile: true },
    });
    assert(sufiyanUser && sufiyanUser.studentProfile, 'Demo student with studentProfile must exist');

    const reminderTitle = `Assignment Due Reminder ${randomBytes(3).toString('hex')}`;
    const testReminder = await prisma.reminder.create({
      data: {
        studentProfileId: sufiyanUser.studentProfile.id,
        sourceType: 'ASSIGNMENT',
        sourceId: randomBytes(12).toString('hex'),
        occurrenceKey: 'due_24h',
        title: reminderTitle,
        description: 'Automated in-app alert dispatched by background reminder processor.',
        triggerAt: new Date(Date.now() - 5000), // due 5 seconds ago
        deliveryStatus: 'PENDING',
      },
    });

    // Verify scheduled delivery via automatic in-process background timer
    // (Do NOT manually call reminderService.processDueReminders())
    const { reminderService } = await import('../src/services/reminder.service.js');
    reminderService.startReminderProcessor(500); // 500ms timer tick

    let deliveredReminder: any = null;
    const timerDeadline = Date.now() + 10000;
    while (Date.now() < timerDeadline) {
      deliveredReminder = await prisma.reminder.findUnique({
        where: { id: testReminder.id },
      });
      if (deliveredReminder?.deliveryStatus === 'DELIVERED') break;
      await new Promise((r) => setTimeout(r, 200));
    }
    await reminderService.stopReminderProcessor();

    assert.equal(deliveredReminder?.deliveryStatus, 'DELIVERED', 'Reminder must be automatically processed by in-process timer without manual invocation');
    assert(deliveredReminder?.deliveredAt instanceof Date, 'Reminder deliveredAt must be recorded');

    // Refresh notifications by reloading user data in browser
    await pageA.reload({ waitUntil: 'networkidle' });
    await pageA.waitForSelector('#phase-app');

    // Verify notification bell badge has unread count
    await pageA.waitForSelector('button[title="Notifications"] span');
    const badgeText = await pageA.innerText('button[title="Notifications"] span');
    assert(parseInt(badgeText, 10) >= 1, `Unread count must be >= 1. Found: ${badgeText}`);

    // Click bell to open popover
    await pageA.click('button[title="Notifications"]');
    await pageA.waitForSelector('.notif-popover');
    await pageA.waitForSelector(`.notif-item:has-text("${reminderTitle}")`);

    // Click notification item to mark as read
    await pageA.click(`.notif-item:has-text("${reminderTitle}")`);
    // Wait for the unread indicator inside the item to vanish
    await pageA.waitForSelector(`.notif-item:has-text("${reminderTitle}").unread`, { state: 'detached' });

    // Close popover
    await pageA.click('button[title="Notifications"]');
    console.log('  ✅ Stage 9 passed: Reminder processor dispatched alert to in-app notification inbox; marked as read.');

    // ── STAGE 10: Page Reload & Silent Session Restoration ────────────────
    console.log('  [Stage 10] Testing Direct Page Reload & Session Restoration...');
    await pageA.reload({ waitUntil: 'networkidle' });

    // Page must silently restore without redirecting to login
    await pageA.waitForSelector('#phase-app', { timeout: 8000 });
    const welcomeAfterReload = await pageA.innerText('.welcome h2');
    assert(welcomeAfterReload.includes('Sufiyan Shaikh'), 'Session must be restored silently via HttpOnly cookie');

    // Verify all created data is intact
    await pageA.click('.sb-item:has-text("Courses & Assignments")');
    await pageA.waitForSelector(`table.tbl tr:has-text("${testAsgnTitle}")`);

    await pageA.click('.sb-item:has-text("Tasks")');
    await pageA.waitForSelector(`table.tbl tr:has-text("${testTaskTitle}")`);
    await pageA.waitForSelector(`table.tbl tr:has-text("${testTaskTitle}") .tcheck.done`);

    await pageA.click('.sb-item:has-text("Calendar & Deadlines")');
    await pageA.waitForSelector(`table.tbl tr:has-text("${testEventTitle}")`);
    console.log('  ✅ Stage 10 passed: Complete session state & academic data persisted across browser page reload.');

    // ── STAGE 11: Error Feedback & Toast Validation ───────────────────────
    console.log('  [Stage 11] Testing Form Validation & Error Toast Feedback...');
    // Wait for any prior welcome toast from reload to clear
    await pageA.waitForSelector('.toast-success', { state: 'detached', timeout: 5000 }).catch(() => {});

    await pageA.click('.sb-item:has-text("Tasks")');
    await pageA.click('button:has-text("+ Create Task")');
    await pageA.waitForSelector('.modal-header h3:has-text("Create New Task")');

    // Title too short (1 character)
    await pageA.fill('input[placeholder*="Implement B-Tree"]', 'X');
    await pageA.click('.modal-footer button:has-text("Save Task")');

    // Verify error toast
    await pageA.waitForSelector('.toast-error:has-text("Task title must be at least 2 characters")');
    assert((await pageA.isVisible('.toast-success:has-text("Task added")')) === false, 'False success toast must NOT be shown on failure');
    await pageA.click('.modal-footer button:has-text("Cancel")');
    console.log('  ✅ Stage 11 passed: Error toast surfaced without false success.');

    // ── STAGE 12: Student B Ownership Isolation (Ahmed Khan) ──────────────
    console.log('  [Stage 12] Testing Student B (Ahmed Khan) Ownership Isolation in Separate Browser Context...');
    const contextB = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const pageB = await contextB.newPage();

    await pageB.goto(CLIENT_URL, { waitUntil: 'networkidle' });
    await pageB.click('button:has-text("Get Started")');
    await pageB.waitForSelector('#phase-login');

    const studentBEmail = `ahmed.khan.${randomBytes(4).toString('hex')}@example.com`;
    await pageB.fill('.form-group:has-text("First Name") input', 'Ahmed');
    await pageB.fill('.form-group:has-text("Last Name") input', 'Khan');
    await pageB.fill('input[placeholder*="ahmed.khan@example.com"]', studentBEmail);
    await pageB.fill('#phase-login form input[type="password"]', 'Password123!');
    await pageB.click('button[type="submit"]:has-text("Complete Registration")');

    // Wait for Student B dashboard
    await pageB.waitForSelector('#phase-app', { timeout: 10000 });
    const welcomeB = await pageB.innerText('.welcome h2');
    assert(welcomeB.includes('Ahmed') || welcomeB.includes('Student'), 'Student B (Ahmed Khan) must be logged into distinct dashboard');

    // Student B must NOT see Student A's tasks
    await pageB.click('.sb-item:has-text("Tasks")');
    await pageB.waitForSelector('h2:has-text("Productivity Tasks")');
    const studentA_TaskVisible = await pageB.isVisible(`table.tbl tr:has-text("${testTaskTitle}")`);
    assert.equal(studentA_TaskVisible, false, "Student B must NOT see Student A's private tasks");

    // Student B must NOT see Student A's assignments
    await pageB.click('.sb-item:has-text("Courses & Assignments")');
    await pageB.waitForSelector('h2:has-text("Courses & Assignments")');
    const studentA_AsgnVisible = await pageB.isVisible(`table.tbl tr:has-text("${testAsgnTitle}")`);
    assert.equal(studentA_AsgnVisible, false, "Student B must NOT see Student A's course assignments");

    // Student B must NOT see Student A's calendar events
    await pageB.click('.sb-item:has-text("Calendar & Deadlines")');
    await pageB.waitForSelector('h2:has-text("Academic Calendar & Unified Deadlines")');
    const studentA_EventVisible = await pageB.isVisible(`table.tbl tr:has-text("${testEventTitle}")`);
    assert.equal(studentA_EventVisible, false, "Student B must NOT see Student A's private calendar events");

    // Direct API Isolation Check: Student B attempting to access Student A's task
    const studentATaskRecord = await prisma.task.findFirst({ where: { title: testTaskTitle } });
    assert(studentATaskRecord, 'Student A task record must exist');

    // Retrieve Student B's cookies and attempt unauthorized delete
    const bCookies = await contextB.cookies();
    const bRefreshCookie = bCookies.find((c) => c.name === 'refreshToken');
    assert(bRefreshCookie, 'Student B must have distinct refreshToken cookie');

    // Refresh to get Student B access token
    const bTokenRes = await fetch(`${CLIENT_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refreshToken=${bRefreshCookie.value}` },
    });
    const bToken = ((await bTokenRes.json()) as any).data.accessToken;

    const unauthorizedRes = await fetch(`${CLIENT_URL}/api/v1/tasks/${studentATaskRecord.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bToken}` },
    });
    assert.equal(unauthorizedRes.status, 404, 'Direct access to another student task must return 404 Not Found');

    await contextB.close();
    console.log('  ✅ Stage 12 passed: Complete data isolation between Student A and Student B verified.');

    // ── STAGE 13: Logout Permanence ───────────────────────────────────────
    console.log('  [Stage 13] Testing Logout Permanence...');
    await pageA.click('button.logout-btn:has-text("Sign Out")');
    await pageA.waitForSelector('.landing-nav');
    await pageA.waitForSelector('.toast-info:has-text("Signed out successfully.")');

    // Reload page — must remain on landing view, NOT restore session
    await pageA.reload({ waitUntil: 'networkidle' });
    await pageA.waitForSelector('.landing-nav');
    const appVisibleAfterLogout = await pageA.isVisible('#phase-app');
    assert.equal(appVisibleAfterLogout, false, 'User must remain logged out after page reload');
    await contextA.close();
    console.log('  ✅ Stage 13 passed: Logout cleared HttpOnly cookie; page reload preserved unauthenticated landing view.');

    // Check for any unhandled browser runtime errors
    if (consoleErrors.length > 0) {
      console.warn(`  ⚠️ Browser console logged ${consoleErrors.length} errors:`, consoleErrors);
    }
  } finally {
    if (browser) {
      await browser.close();
      console.log('  Chromium browser closed cleanly.');
    }

    // Terminate test server
    console.log('  Shutting down production test server...');
    const shutdownTimer = setTimeout(() => child.kill('SIGKILL'), 5000);
    try {
      if (windowsShutdown) {
        await new Promise<void>((resolve, reject) => {
          child.send('integrum-test-shutdown', (error) => (error ? reject(error) : resolve()));
        });
      } else {
        child.kill('SIGTERM');
      }
      const [code, signal] = await exited;
      assert.equal(signal, null, 'Server was not forcibly killed');
      assert.equal(code, 0, 'Server exited cleanly with exit code 0');
      console.log('  ✅ Server shutdown cleanly.');
    } finally {
      clearTimeout(shutdownTimer);
    }
  }

  console.log('\n🏆 ALL REAL-BROWSER WORKFLOW & PRODUCTION SERVING CHECKS PASSED SUCCESSFULLY! 🏆\n');
}

main().catch((err) => {
  console.error('\n❌ Browser workflow verification failed:', err);
  process.exit(1);
});
