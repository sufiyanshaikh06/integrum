async function runTests() {
  const BASE_URL = 'http://localhost:5000/api/v1';
  let accessToken = '';
  let refreshTokenCookie = '';
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  console.log('--- Starting Authentication Lifecycle Tests ---');

  // 1. Validation Error Test (missing required fields)
  console.log('\n[TEST 1] Validation error on register');
  let res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
  });
  let data = await res.json();
  if (res.status !== 400) throw new Error('Expected 400 Bad Request');
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
  if (res.status !== 409) throw new Error('Expected 409 Conflict');
  console.log('✅ Correctly caught duplicate email.');

  // 4. Failed Login
  console.log('\n[TEST 4] Failed login (wrong password)');
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' }),
  });
  if (res.status !== 401) throw new Error('Expected 401 Unauthorized');
  console.log('✅ Login rejected correctly.');

  // 5. Successful Login
  console.log('\n[TEST 5] Successful login');
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  data = await res.json();
  if (res.status !== 200) throw new Error('Expected 200 OK');
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
  if (res.status !== 200) throw new Error('Expected 200 OK');
  console.log('✅ Profile fetched successfully:', data.data.email);
  if (!data.data.settings.defaultSemesterId) {
    throw new Error('Default semester was not created/assigned');
  } else {
    console.log('✅ Default semester correctly assigned:', data.data.settings.defaultSemesterId);
  }

  // 7. Refresh Token
  console.log('\n[TEST 7] Refresh token');
  res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: refreshTokenCookie,
    },
  });
  data = await res.json();
  if (res.status !== 200) throw new Error('Expected 200 OK');
  accessToken = data.data.accessToken;
  console.log('✅ Token refreshed successfully.');

  // 8. Logout
  console.log('\n[TEST 8] Logout');
  res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status !== 200) throw new Error('Expected 200 OK');
  const logoutCookie = res.headers.get('set-cookie');
  if (!logoutCookie || !logoutCookie.includes('refreshToken=;')) {
    throw new Error('Refresh token cookie not cleared');
  }
  console.log('✅ Logged out and cookie cleared.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY 🎉');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
