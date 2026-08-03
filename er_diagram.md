# Database Entity-Relationship Diagram (ERD)

This ER Diagram visually represents the relationships, ownership, and multiplicities defined in our frozen Domain Model. Please review this to ensure the database architecture perfectly aligns with our business requirements before we translate this into a Prisma schema.

## Entity Relationship Diagram

```mermaid
erDiagram
    %% Identity, Access & Settings
    USER ||--o| STUDENT_PROFILE : "has"
    USER ||--o| ADMIN_PROFILE : "has"
    USER ||--|| STUDENT_SETTINGS : "configures"
    USER ||--o{ NOTIFICATION : "receives"

    %% Academic Hub (Ownership Hierarchy)
    STUDENT_PROFILE ||--o{ SEMESTER : "owns"
    SEMESTER ||--o{ SUBJECT : "contains"
    SUBJECT ||--o{ ASSIGNMENT : "requires"
    SUBJECT ||--o{ NOTE : "provides"
    
    STUDENT_PROFILE ||--o{ STUDY_PLAN : "creates"
    STUDENT_PROFILE ||--o{ TASK : "manages"
    STUDENT_PROFILE ||--o{ STUDENT_ANALYTICS : "generates (derived)"
    STUDENT_SETTINGS |o--o| SEMESTER : "defaults to"
    
    %% Optional relationship
    STUDENT_PROFILE ||--o{ AI_EXECUTION_LOG : "triggers"
    STUDENT_PROFILE ||--o{ SKILL : "develops"
    STUDENT_PROFILE ||--o{ JOB_APPLICATION : "tracks"
    STUDENT_PROFILE ||--o{ RESUME : "manages"

    %% Career Hub
    RESUME ||--o{ RESUME_VERSION : "versions"

    %% Detailed Entities (Subset of fields)
    USER {
        uuid id PK
        string email UK
        string passwordHash
        enum role "STUDENT, ADMIN"
        boolean isVerified
    }

    STUDENT_PROFILE {
        uuid id PK
        uuid userId FK
        string firstName
        string lastName
        string university
        int enrollmentYear
        int graduationYear
    }

    ADMIN_PROFILE {
        uuid id PK
        uuid userId FK
        string firstName
        string lastName
        string department
        int permissionsLevel
    }

    STUDENT_SETTINGS {
        uuid id PK
        uuid userId FK
        json notificationPreferences
        uuid defaultSemesterId FK "nullable"
    }

    SEMESTER {
        uuid id PK
        uuid studentProfileId FK
        string name
        date startDate
        date endDate
    }

    SUBJECT {
        uuid id PK
        uuid semesterId FK
        string name
        string code
        int credits
        float targetGrade
        int totalClasses
        int attendedClasses
    }

    ASSIGNMENT {
        uuid id PK
        uuid subjectId FK
        string title
        string description
        date dueDate
        enum priority
        enum status
    }
    
    RESUME {
        uuid id PK
        uuid studentProfileId FK
        string title
        boolean isActive
    }

    RESUME_VERSION {
        uuid id PK
        uuid resumeId FK
        json content
        float atsScore
        string reviewFeedback
        date createdAt
    }
    
    STUDENT_ANALYTICS {
        uuid id PK
        uuid studentProfileId FK
        float attendancePercentage
        float taskCompletionRate
        float averageAtsScore
        date generatedAt
    }
    
    AI_EXECUTION_LOG {
        uuid id PK
        uuid studentProfileId FK
        string module
        string operation
        string status
        date startedAt
        date completedAt
        string errorMessage "nullable"
    }
```

## Key Architectural Highlights:
1. **Ownership Principle Enforced**: You can visually trace the cascading ownership from `STUDENT_PROFILE` → `SEMESTER` → `SUBJECT` → `ASSIGNMENT` without redundant foreign keys.
2. **AI Extensibility**: The `AI_EXECUTION_LOG` tracks metadata independently, keeping the architecture clean and allowing future expansion for `AI_CONVERSATION` if needed.
3. **Resume Safety**: The `RESUME` entity acts as a container, while `RESUME_VERSION` holds the actual content history, preventing data loss.
