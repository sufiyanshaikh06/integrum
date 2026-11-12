# Security & Privacy Specification: Integrum

This document establishes the security baseline, data classification, access control policies, and OWASP compliance checklist for Integrum.

---

## 1. Data Classification & Privacy Policy

| Data Asset | Sensitivity | Classification | Storage Location | Protection Measures |
|---|---|---|---|---|
| **Passwords** | Critical | Secret | `User.passwordHash` | Hashed with bcrypt (configurable salt rounds >= 10); plaintext never logged or persisted. |
| **Session & Refresh Tokens** | Critical | Secret | `AuthSession.refreshHash`, Cookie | Stored in HTTP-only, Secure, SameSite cookies; hashes stored in DB; rotated on use. |
| **JWT Secrets & API Keys** | Critical | System Secret | Environment variables (`.env`) | Managed in hosting vaults (Render/Vercel); validated at startup by Zod in `env.ts`. |
| **Personal Identifiable Info (PII)** | High | Private | `User.email`, `StudentProfile.rollNumber` | Encrypted in transit (HTTPS); access restricted via role-based middleware. |
| **Academic Records & Attendance** | High | Confidential | `AttendanceRecord`, `Subject`, `Assignment` | Scoped by tenant/user ID; strict role authorization prevents cross-tenant leaks. |
| **Resumes & Note Attachments** | Medium | Private Document | Supabase Storage / Local Storage | Signed URLs or authenticated proxy downloads; UUID file keys; MIME type validation. |
| **Campus Announcements & Events** | Low | Internal / Public | `Announcement`, `InstitutionalEvent` | Scoped by department/course visibility; readable by authenticated students. |

---

## 2. Role-Based Access Control (RBAC) Matrix

Integrum defines 5 distinct system roles (`Role` enum in Prisma):

```
SUPER_ADMIN > INSTITUTION_ADMIN > FACULTY > STUDENT (Institutional / Independent)
```

| Route Group | Path Prefix | SUPER_ADMIN | INSTITUTION_ADMIN | FACULTY | STUDENT | INDEPENDENT |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Authentication** | `/api/v1/auth/*` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Student Academic Hub** | `/api/v1/semesters/*`, `/subjects/*` | ❌ (View Audit) | ❌ (View Catalog) | 👁️ (Roster Only)| ✅ (Own Only) | ✅ (Personal) |
| **Attendance Operations** | `/api/v1/attendance/*` | ❌ | 👁️ (Department) | ✍️ (Mark Classes)| 👁️ (Read Own) | ❌ (Disabled) |
| **AI Study Planner** | `/api/v1/studyplans/*`, `/ai/*` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Career & Resume Hub** | `/api/v1/resumes/*`, `/jobs/*` | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Campus Governance** | `/api/v1/admin/departments/*` | ✅ | ✅ (Own Campus) | ❌ | ❌ | ❌ |
| **Registration Codes** | `/api/v1/admin/registration-codes`| ✅ | ✅ (Own Campus) | ❌ | ❌ | ❌ |
| **System Settings** | `/api/v1/admin/settings/*` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Admin Audit Logs** | `/api/v1/admin/audit-logs/*` | ✅ | ✅ (Own Campus) | ❌ | ❌ | ❌ |

---

## 3. Authentication & Session Security Architecture

### A. Dual-Token Architecture
- **Access Token:** Short-lived JWT (`15m`), passed via Authorization header (`Bearer <token>`). Contains `userId`, `role`, `authVersion`, and `sessionId`.
- **Refresh Token:** Long-lived token (`7d`), stored exclusively in an `httpOnly`, `secure`, `sameSite: lax` (or `strict`) cookie. It is inaccessible to client-side JavaScript, eliminating XSS token theft.

### B. Active Session Verification & Revocation
- Every issued refresh token is paired with an `AuthSession` record containing a cryptographically hashed token signature.
- **Session Revocation:**
  - Single device logout deletes the specific `AuthSession`.
  - Global logout / Password change increments `User.authVersion`. Because `authenticate.ts` verifies `payload.version === user.authVersion`, all existing access and refresh tokens across all devices are immediately invalidated.

### C. Password Reset & Verification Tokens
- Password reset and email verification tokens use single-use cryptographically secure random bytes.
- Only the SHA-256 hash (`passwordResetTokenHash`, `verificationTokenHash`) is stored in the database.
- Tokens have strict expiration bounds (Password reset: 1 hour, Verification: 24 hours).

---

## 4. Secrets Handling & Environment Hardening

Environment variables are validated on server startup using Zod in `backend/src/config/env.ts`:
- **Length & Complexity Checks:** In production, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must each be at least 32 characters long, and they must not match each other.
- **Fail-Fast Boot:** If any secret is missing or fails validation, the server logs a sanitized schema error and exits with code 1 immediately.
- **Client Bundle Isolation:** Secrets never carry the `VITE_` prefix on the frontend. The frontend SPA only receives `VITE_API_URL`.

---

## 5. Input Validation, Sanitization & Parameterization

1. **Schema Validation (`validateRequest.ts`):** Every API endpoint validates incoming `req.body`, `req.query`, and `req.params` against strict Zod schemas before hitting business services. Invalid payloads are rejected with HTTP 400 and structured field-level errors.
2. **SQL Injection Elimination:** 100% of database interactions occur through Prisma's typed query builder with parameterized SQL. No string interpolation or raw concatenated SQL is permitted in the codebase.
3. **File Upload Security:**
   - Handled via Multer using memory/stream buffers; files are never written to unvetted temporary disk locations.
   - Content-type is inspected using magic byte inspection via `file-type` to prevent extension spoofing.
   - File uploads are capped at 5MB, and stored using generated UUID keys to prevent directory traversal attacks.

---

## 6. Abuse Mitigation & Rate Limiting

Rate limiting is enforced at the network boundary using `express-rate-limit`:
- **Global Rate Limiter:** Maximum 200 requests per 15 minutes per IP across all general routes.
- **Authentication Limiter:** Maximum 10 requests per 15 minutes per IP on `/api/v1/auth/login`, `/register`, and `/forgot-password` to prevent brute-force attacks.
- **Upload Limiter:** Maximum 20 file uploads per 15 minutes per IP.
- **Third-Party AI Protection:** All Google Gemini requests are wrapped with `withTimeout.ts` (10s threshold), guaranteeing that slow external services cannot exhaust Node.js event-loop workers or PostgreSQL connection pools.

---

## 7. Pre-Merge Security Checklist (OWASP Top 10)

Before merging any code change, verify compliance against the following controls:

- [ ] **A01: Broken Access Control:** Does every newly added route include `authenticate` and `authorize([...])`? Are queries scoped to `req.user.studentProfile.id` or `departmentId`?
- [ ] **A02: Cryptographic Failures:** Are passwords hashed with bcrypt? Are refresh tokens stored in HTTP-only cookies? Are secrets kept out of Git?
- [ ] **A03: Injection:** Are all incoming parameters validated via Zod? Are all database queries parameterized through Prisma?
- [ ] **A04: Insecure Design:** Do student routes prevent unauthorized mutation of institutional master curricula or attendance counters?
- [ ] **A05: Security Misconfiguration:** Are Helmet CSP headers, multi-origin CORS (`CLIENT_URL`, `ALLOWED_ORIGINS` via `backend/src/config/cors.ts`), and cookie flags (`secure`, `sameSite`, partitioned) configured appropriately for production?
- [ ] **A06: Vulnerable Dependencies:** Has `npm audit` been run to ensure zero high or critical vulnerabilities in third-party packages?
- [ ] **A07: Identification & Auth Failures:** Are rate limiters active on auth endpoints? Is session revocation verified upon password change?
- [ ] **A08: Software & Data Integrity:** Does file upload validate file magic bytes? Are deletes queued in `StorageCleanupQueue`?
- [ ] **A09: Logging & Monitoring:** Are administrative mutations recorded in `AdminAuditLog`? Are sensitive tokens excluded from logs?
- [ ] **A10: Server-Side Request Forgery (SSRF):** Are external API calls (Gemini, Resend, Supabase) restricted to hardcoded, validated endpoint domains?
