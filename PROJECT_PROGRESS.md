# Integrum — Mini Project Progress Review

> **From Problem Definition → System Architecture → Database → Working Authentication**

---

## 1. What am I building?

**Integrum** is an integrated student success platform combining academic management, productivity, career development, analytics, and AI intelligence around a unified student profile.

```mermaid
graph TD
    A[INTEGRUM] --> B(Academic Hub)
    A --> C(Productivity Hub)
    A --> D(Career Hub)
    
    B --> E[Analytics]
    C --> E
    D --> E
    
    B --> F[AI Intelligence]
    C --> F
    D --> F
    
    A --> G(Administration Portal)
    
    classDef main fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold;
    classDef sub fill:#60a5fa,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef cross fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    
    class A main;
    class B,C,D,G sub;
    class E,F cross;
```

---

## 2. Why am I building it?

Currently, students experience extreme workflow fragmentation. The objective is to bring these disjointed tools into one unified student platform.

```mermaid
graph LR
    A[Academic tools] -->|fragmented student workflow| E[INTEGRUM]
    B[Task management] -->|fragmented student workflow| E
    C[Career tracking] -->|fragmented student workflow| E
    D[Analytics & AI] -->|fragmented student workflow| E
    
    classDef problem fill:#ef4444,stroke:#b91c1c,color:#fff;
    classDef solution fill:#10b981,stroke:#047857,color:#fff,font-weight:bold;
    
    class A,B,C,D problem;
    class E solution;
```

---

## 3. What have I designed?

Before writing code, I established a robust technical foundation to ensure the system scales elegantly.

### Core Domain Relationships
The domain model enforces ownership: student-specific data belongs to the appropriate student context.

```mermaid
graph LR
    User[User] -->|1:1| SP[StudentProfile]
    SP -->|1:N| Sem[Semester]
    Sem -->|1:N| Sub[Subject]
    Sub -->|1:N| Ass[Assignment]
    
    SP -->|1:1| Plan[StudyPlan]
    SP -->|1:N| Task[Task]
    SP -->|1:N| Res[Resume]
    SP -->|1:N| Job[JobApplication]
    SP -->|1:1| Anal[StudentAnalytics]
```

### System Architecture
A layered architecture where HTTP requests, business logic, and database access are strictly decoupled.

```mermaid
flowchart TD
    A(Routes) --> B(Controllers)
    B --> C(Services)
    C --> D(Prisma ORM)
    D --> E[(PostgreSQL)]
```

* **Routes** — endpoint mapping and middleware
* **Controllers** — HTTP request/response handling
* **Services** — business logic
* **Prisma** — data-access/ORM layer
* **PostgreSQL** — persistence

---

## 4. What have I actually implemented?

The design is no longer just conceptual documentation. 

### Database Infrastructure
The schema has been successfully migrated to a local PostgreSQL database, establishing the real table structure (15 models, 9 enums).

### Complete Backend Authentication Flow
The first major backend feature—the **Identity & Access: Authentication Module**—is implemented and tested with the planned security controls.

```mermaid
flowchart TD
    A[Registration] --> B[Zod Validation]
    B --> C[bcrypt Password Hashing]
    C --> D[Prisma Database Transaction]
    D --> E[User + Student Records Created]
    
    F[Login] --> G[bcrypt Verification]
    G --> H[Access Token generated]
    G --> I[Refresh Token generated]
    
    H -->|Client Memory| J[Protected API Routes]
    I -->|HttpOnly Cookie| K[Refresh-token lifecycle]
```

---

## 5. Live Demonstration (Working Software)

> [!NOTE]
> *Switching to terminal/browser to demonstrate actual API workflows:*

- [x] **Registration:** Transactional account creation with automatic default semester assignment.
- [x] **Login:** Secure credential verification generating JWT access & refresh tokens.
- [x] **Protected API (`/users/me`):** Fetching the authenticated user's profile using a Bearer token.
- [x] **Refresh Token:** Using the secure `HttpOnly` cookie to rotate access tokens.
- [x] **Logout:** Securely clearing the session cookies.
- [x] **Validation & Error Handling:** Graceful handling of duplicate emails (409 Conflict) and bad inputs (400 Bad Request).
- [x] **Academic Hub (Ownership Hierarchy):** Creating Semesters, Subjects, and Assignments with strict data isolation.
- [x] **Productivity Hub (Tasks):** Creating, updating, and fetching Tasks while verifying cross-user data isolation.

---

## 6. Development Methodology

```mermaid
flowchart LR
    A[Requirements & Scope] --> B[Domain Modeling]
    B --> C[Architecture Design]
    C --> D[Database Design]
    D --> E[Backend Infrastructure]
    E --> F[Identity & Access Implementation]
    F --> G[Academic Hub Implementation]
    G --> H[Productivity Hub Implementation]
    H --> I[End-to-End Verification]
```

Each major development step follows SDLC phases: implemented incrementally, verified locally, and committed to Git as a separate logical change.

---

## 7. What comes next?

The authentication layer is now a working vertical slice of the architecture, and the Academic Hub foundation is now implemented and verified. The next milestone is the Productivity Hub.

### Current Status
| Area | Status |
| :--- | :--- |
| **Requirements & Scope** | ✅ Complete |
| **Domain Model & Architecture** | ✅ Complete |
| **PostgreSQL Database** | ✅ Complete |
| **Backend Infrastructure** | ✅ Complete |
| **Identity & Access Module** | ✅ Complete |
| **Academic Hub** | ✅ Complete |
| **Productivity Hub (Tasks)** | ✅ Complete |

### Project Roadmap

Rather than a strict linear flow, the development focuses on the current priority hub, with remaining modules mapped as upcoming development.

```mermaid
flowchart TD
    A[Identity & Access Module] --> B[Academic Hub]
    B --> C[Productivity Hub]
    C --> I[Upcoming]

    subgraph UpcomingDevelopment["Upcoming Development"]
        direction LR
        F[AI Intelligence Hub]
        D[Career Hub]
        E[Analytics Hub]
        G[Administration Portal]
        H[Frontend Integration]
    end

    %% Force Upcoming Development below the completed flow
    I ~~~ F

    style A fill:#10b981,stroke:#047857,color:#fff
    style B fill:#10b981,stroke:#047857,color:#fff
    style C fill:#10b981,stroke:#047857,color:#fff

    style I fill:#1f1f1f,stroke:#888,color:#fff

    style F fill:#1f1f1f,stroke:#888,color:#fff
    style D fill:#1f1f1f,stroke:#888,color:#fff
    style E fill:#1f1f1f,stroke:#888,color:#fff
    style G fill:#1f1f1f,stroke:#888,color:#fff
    style H fill:#1f1f1f,stroke:#888,color:#fff

    style UpcomingDevelopment fill:#1f1f1f,stroke:#888,color:#fff
