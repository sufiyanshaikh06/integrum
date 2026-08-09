import { prisma } from '../src/config/prisma.js';

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api/v1';
  let accessToken = '';
  let refreshTokenCookie = '';
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  console.log('--- Starting Authentication Edge-Case Tests ---');

  // 1. Validation Error Test (missing required fields)
  console.log('\n[TEST 1] Validation error on register');
  let res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
  });
  let data = await res.json();
  if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
  console.log('✅ Validation correctly caught bad inputs:', data.errors);

  // 2. Successful Registration
  console.log('\n[TEST 2] Successful registration');
  res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
    }),
  });
  data = await res.json();
  if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}`);
  console.log('✅ Registered successfully:', data.data);

  // 3. Duplicate Registration (Conflict)
  console.log('\n[TEST 3] Duplicate registration');
  res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
    }),
  });
  data = await res.json();
  if (res.status !== 409) throw new Error(`Expected 409 Conflict, got ${res.status}`);
  console.log('✅ Correctly caught duplicate email.');

  // 4. Failed Login
  console.log('\n[TEST 4] Failed login (wrong password)');
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' }),
  });
  if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  console.log('✅ Login rejected correctly.');

  // 5. Successful Login
  console.log('\n[TEST 5] Successful login');
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  data = await res.json();
  if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
  accessToken = data.data.accessToken;
  const setCookieHeader = res.headers.get('set-cookie');
  if (!setCookieHeader || !setCookieHeader.includes('refreshToken=')) {
    throw new Error('No refresh token cookie set');
  }
  refreshTokenCookie = setCookieHeader.split(';')[0]; // Extract just the refreshToken=... part
  console.log('✅ Logged in successfully, received access token and refresh cookie.');

  // 6. Access Protected Route (/me)
  console.log('\n[TEST 6] Fetch profile');
  res = await fetch(`${BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  data = await res.json();
  if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
  console.log('✅ Profile fetched successfully:', data.data.email);
  if (!data.data.settings.defaultSemesterId) {
    throw new Error('Default semester was not created/assigned');
  } else {
    console.log('✅ Default semester correctly assigned:', data.data.settings.defaultSemesterId);
  }

  // 7. Protected Route Without Auth
  console.log('\n[TEST 7] Protected route without auth');
  res = await fetch(`${BASE_URL}/users/me`);
  if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  console.log('✅ Unauthenticated access rejected correctly.');

  // 8. Invalid Access Token
  console.log('\n[TEST 8] Invalid access token');
  res = await fetch(`${BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer invalid-token.xyz`,
    },
  });
  if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  console.log('✅ Invalid access token rejected correctly.');

  // 9. Unauthorized Role Access (RBAC)
  console.log('\n[TEST 9] Unauthorized role access (Admin route as Student)');
  res = await fetch(`${BASE_URL}/users/admin-only`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  console.log('✅ Unauthorized role access rejected correctly.');

  // 10. Refresh Token
  console.log('\n[TEST 10] Refresh token successfully');
  res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: refreshTokenCookie,
    },
  });
  data = await res.json();
  if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
  accessToken = data.data.accessToken;
  const newSetCookieHeader = res.headers.get('set-cookie');
  if (newSetCookieHeader && newSetCookieHeader.includes('refreshToken=')) {
    refreshTokenCookie = newSetCookieHeader.split(';')[0];
  }
  console.log('✅ Token refreshed successfully.');

  // 11. Missing Refresh Cookie
  console.log('\n[TEST 11] Missing refresh cookie');
  res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
  });
  if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  console.log('✅ Missing refresh cookie rejected correctly.');

  // 12. Invalid Refresh Cookie
  console.log('\n[TEST 12] Invalid refresh cookie');
  res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: 'refreshToken=invalid_token_123',
    },
  });
  if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  console.log('✅ Invalid refresh cookie rejected correctly.');

  // 13. Logout
  console.log('\n[TEST 13] Logout');
  res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
  const logoutCookie = res.headers.get('set-cookie');
  if (!logoutCookie || !logoutCookie.includes('refreshToken=;')) {
    throw new Error('Refresh token cookie not cleared');
  }
  console.log('✅ Logged out and cookie cleared.');

  // 14. Logout followed by refresh
  console.log('\n[TEST 14] Logout followed by refresh attempt');
  res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: logoutCookie.split(';')[0], // pass the cleared cookie
    },
  });
  if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  console.log('✅ Refresh attempt after logout rejected correctly (missing/cleared token).');

  // 15. Inactive User Login Attempt
  console.log('\n[TEST 15] Inactive user login attempt');
  await prisma.user.update({
    where: { email: testEmail },
    data: { isActive: false },
  });
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  console.log('✅ Inactive user login rejected correctly.');

  console.log('\n🎉 ALL EDGE-CASE TESTS PASSED SUCCESSFULLY 🎉');
  
  await prisma.$disconnect();
}

runTests().catch(async (err) => {
  console.error('\n❌ TEST FAILED:', err);
  await prisma.$disconnect();
  process.exit(1);
});
