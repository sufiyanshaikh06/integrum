# Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a secure, robust JWT-based authentication system for the Integrum backend including utilities, middleware, services, controllers, and routes.

**Architecture:** We are following a strict layered architecture: Routes -> Controllers -> Services -> Prisma. All authentication state is stateless using JWTs and bcrypt for password hashing. We will implement these across multiple smaller, logical commits to ensure high code quality and testability.

**Tech Stack:** Node.js, Express, TypeScript, Prisma, Zod, bcrypt, jsonwebtoken.

## Global Constraints
- `nodenext` module resolution (all relative imports require `.js`).
- Use the unified `ApiResponse` format for all responses.
- All configuration comes from the `env` singleton in `src/config/env.ts`.

---

### Task 1: Sprint 1 - Authentication Foundation (Utilities & Middleware)

**Files:**
- Create: `backend/src/utils/jwt.ts`
- Create: `backend/src/utils/password.ts`
- Create: `backend/src/utils/cookies.ts`
- Create: `backend/src/middleware/authenticate.ts`
- Create: `backend/src/middleware/authorize.ts`

**Interfaces:**
- Produces: `generateAccessToken(user)`, `generateRefreshToken(user)`, `verifyAccessToken(token)`, `verifyRefreshToken(token)`
- Produces: `hashPassword(password: string)`, `comparePassword(password: string, hash: string)`
- Produces: `setRefreshCookie(res, refreshToken)`, `clearRefreshCookie(res)`
- Produces: `authenticate` (Express middleware)
- Produces: `authorize(...roles: Role[])` (Express middleware)

- [ ] **Step 1: Write `jwt.ts`**
  Implement separate `generateAccessToken`, `generateRefreshToken`, `verifyAccessToken`, and `verifyRefreshToken` functions using `jsonwebtoken`. Payload should be strictly minimal: `{ sub, email, role }`. Extract secrets and expirations from `env`. Then compile (`npm run build`). Then commit (`feat(auth): implement JWT utilities`).

- [ ] **Step 2: Write `password.ts`**
  Implement `hashPassword` and `comparePassword` using `bcrypt`. Do not expose bcrypt anywhere else. Compile. Commit (`feat(auth): add password utilities`).

- [ ] **Step 3: Write `cookies.ts`**
  Implement `setRefreshCookie(res, refreshToken)` and `clearRefreshCookie(res)`. Use `httpOnly: true, secure: env.NODE_ENV === 'production'`. Compile. Commit (`feat(auth): add cookie utilities`).

- [ ] **Step 4: Write `authenticate.ts` middleware**
  Enforce `Authorization: Bearer ACCESS_TOKEN` strictly. Read header, verify access token, fetch user from Prisma (`prisma.user.findUnique`), attach to `req.user`, and call `next()`. Compile. Commit (`feat(auth): implement authentication middleware`).

- [ ] **Step 5: Write `authorize.ts` middleware**
  Return a middleware that checks if `req.user.role` is included in the allowed roles array. Throw `ApiError.forbidden` if not. Compile. Commit (`feat(auth): implement authorization middleware`).

---

### Task 2: Sprint 2 - Auth Service

**Files:**
- Create: `backend/src/services/auth.service.ts`
- Create: `backend/src/services/user.service.ts`

**Interfaces:**
- Consumes: `hashPassword`, `comparePassword`, `generateAccessToken`, `generateRefreshToken`, `prisma`
- Produces: `register(data)`, `login(data)`, `refresh(token)`, `logout(userId)`, `getProfile(userId)`

- [ ] **Step 1: Write `register(data)`**
  Check if email exists. Hash password. Use `prisma.$transaction` to create the `User` along with related initial records (`StudentProfile`, `StudentSettings`, `Semester { name: 'Semester 1', isCurrent: true }`, `StudentAnalytics`) in one atomic operation. Return the created user. Compile.

- [ ] **Step 2: Write `login(data)`**
  Find user by email. Reject inactive or deleted users. Compare password. Update `lastLoginAt`. Generate access and refresh tokens. Return tokens and user. Compile.

- [ ] **Step 3: Write `refresh(token)`**
  Verify refresh token. Ensure user exists. Rotate refresh token. Return new tokens. Compile.

- [ ] **Step 4: Write `logout(userId)` and `getProfile(userId)`**
  Implement basic logout. Create `user.service.ts` for `getProfile(userId)`. Compile.

- [ ] **Step 5: Commit Sprint 2**
  Commit: `feat(auth): implement authentication service`

---

### Task 3: Sprint 3 - Auth and User Controllers

**Files:**
- Create: `backend/src/controllers/auth.controller.ts`
- Create: `backend/src/controllers/user.controller.ts`

**Interfaces:**
- Produces: `registerHandler`, `loginHandler`, `refreshHandler`, `logoutHandler`, `getProfileHandler`

- [ ] **Step 1: Write auth controller handlers**
  Implement login, register, refresh, logout handlers. Compile.

- [ ] **Step 2: Write user controller handlers**
  Implement getProfile handler in `user.controller.ts`. Compile.

- [ ] **Step 3: Commit Sprint 3**
  Commit: `feat(auth): implement authentication controllers`

---

### Task 4: Sprint 4 - Auth & User Routes

**Files:**
- Create: `backend/src/routes/auth.routes.ts`
- Create: `backend/src/routes/user.routes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Create `auth.routes.ts`**
  Define `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`. Compile.

- [ ] **Step 2: Create `user.routes.ts`**
  Define `GET /me` (Protected with `authenticate` middleware, uses `getProfileHandler`). Compile.

- [ ] **Step 3: Mount routes in `app.ts`**
  Add `app.use('/api/v1/auth', authRoutes)` and `app.use('/api/v1/users', userRoutes)`. Compile.

- [ ] **Step 4: Commit Sprint 4**
  Commit: `feat(auth): expose authentication routes`

---

### Task 5: Sprint 5 - Testing

**Files:**
- Manual tests via `curl`

- [ ] **Step 1: Start the server**
  `npm run dev`

- [ ] **Step 2: Execute full lifecycle test**
  - `GET /api/v1/health`
  - `POST /register`
  - `POST /login` 
  - `GET /api/v1/users/me`
  - `POST /refresh` 
  - `POST /logout` 
  - `GET /api/v1/users/me` -> Expect 401.

- [ ] **Step 3: Commit Sprint 5**
  Commit: `test(auth): verify authentication workflow`
