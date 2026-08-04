# Phase 3: Authentication & API Design

Before implementing business logic or database migrations, we must standardize how our API secures data and communicates with the frontend. This specification governs all backend endpoints.

## Phase 3A — Authentication Architecture

Integrum uses a stateless **JSON Web Token (JWT)** approach designed for high security and scalability.

### Token Strategy
- **Access Token**: Short-lived (15 minutes). 
  - *Storage*: Client memory ONLY (React state). Never localStorage or sessionStorage.
  - *Payload*: `{"sub": "userId", "email": "student@example.com", "role": "STUDENT"}`
- **Refresh Token**: Long-lived (7 days). Used solely to request new Access Tokens.
  - *Storage*: Strict `HttpOnly`, `Secure`, `SameSite=Strict` Cookie to prevent XSS and CSRF attacks.
  - *Rotation*: Refresh token rotation is deferred to Version 2.

### Security Mechanisms
- **Password Policy**: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.
- **Password Hashing**: `bcrypt` with a salt rounds value of 10.
- **CORS**: Configured strictly to allow only the frontend Vite development URL (`http://localhost:5173`) and the future production domain.
- **Security Headers**: `helmet` middleware applied globally to prevent standard web vulnerabilities.

### Authentication Flows
1. **Login Flow**:
   - Client sends Email/Password to `/api/v1/auth/login`.
   - Server verifies credentials via bcrypt.
   - Server issues Access Token (JSON body) and Refresh Token (HttpOnly Cookie).
2. **Refresh Flow**:
   - Client accesses `/api/v1/auth/refresh`.
   - Server reads HttpOnly Cookie. If valid, issues a new Access Token.
3. **Logout Flow**:
   - Client calls `/api/v1/auth/logout`.
   - Server clears the HttpOnly Refresh Token Cookie.
4. **Registration Flow**:
   - Admin invites OR open registration (depending on business rules). V1 defaults to direct registration for Students.

---

## Phase 3B — Authorization (RBAC)

Authorization is managed via a strict **Role-Based Access Control (RBAC)** matrix. 

### Roles
Defined in Prisma as the `Role` enum: `STUDENT`, `ADMIN`.

### Middleware Sequence
Every protected route passes through a specific middleware chain:
1. `validateRequest(schema)`: Validates body/params using Zod.
2. `authenticateJWT()`: Verifies the Access Token and attaches `req.user`.
3. `requireRole(role)`: (Optional) Blocks access if `req.user.role` does not match.

### Authorization Matrix

| Endpoint Route | Description | Auth Required | Student | Admin |
| :--- | :--- | :---: | :---: | :---: |
| `POST /api/v1/auth/login` | Authenticate and get tokens | No | ✓ | ✓ |
| `POST /api/v1/auth/register`| Register new account | No | ✓ | ✗ |
| `GET /api/v1/users/me` | Fetch own profile | Yes | ✓ | ✓ |
| `GET /api/v1/assignments` | View own assignments | Yes | ✓ | ✗ |
| `POST /api/v1/ai/resume` | Trigger AI resume review | Yes | ✓ | ✗ |
| `GET /api/v1/admin/users` | View all platform users | Yes | ✗ | ✓ |
| `DELETE /api/v1/admin/users/:id` | Delete a student profile | Yes | ✗ | ✓ |

> [!NOTE] 
> Admins do not have access to a student's personal `Assignments` or `Notes`. Students cannot access the `Admin` dashboard.

---

## Phase 3C — Unified API Error & Response Standard

To ensure the frontend can easily and consistently parse API responses, **every single endpoint** must return data in the following exact JSON structure.

### 1. Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {
    "id": "123",
    "title": "Example"
  }
}
```

### 2. Client/Server Error Response
```json
{
  "success": false,
  "message": "Invalid request parameters.",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address."
    }
  ]
}
```
*Note: The `errors` array is optional and primarily populated by Zod validation failures.*

### Global Error Handler
Controllers never send 500 or 400 responses directly. **Controllers throw exceptions**. 
A global Error Middleware intercepts these exceptions, logs them appropriately, and formats the response into the unified JSON standard above. This keeps controller logic extremely clean.

---

## Phase 3D — API Standards & Validation

Integrum enforces **contract-first** API development.

### Shared Data Transfer Objects (DTOs)
- All request schemas (DTOs) will be defined using **Zod**.
- These Zod schemas will live in the `shared/` workspace.
- This allows the Backend to use them for `validateRequest()` middleware, and the Frontend to use them for form validation (e.g., `react-hook-form`).

### HTTP Status Code Conventions
- `200 OK`: Standard success.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure (Zod error) or malformed request.
- `401 Unauthorized`: Missing or invalid JWT.
- `403 Forbidden`: Authenticated, but lacks required Role.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Resource already exists (e.g. Email already taken, duplicate subject).
- `500 Internal Server Error`: Unhandled backend exception.

---

## Phase 3E — Logging & Environment Standards

### Logging Standard
We log:
- Login success & failure
- JWT validation failures
- Server exceptions (500s)

We **NEVER** log:
- Passwords
- JWTs (Access or Refresh tokens)
- Bcrypt hashes
- Personally Identifiable Information (PII) beyond user IDs in audit trails.

### Environment Specification
The authoritative `.env.example` in the backend will define:
```text
DATABASE_URL=postgresql://user:password@localhost:5432/integrum
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

---

## Review Required
Please review this Authentication & API design. If approved, we will:
1. Lock in these standards.
2. Formally set up our environment config (`.env`).
3. Run the first `prisma migrate dev` to create the local PostgreSQL database.
