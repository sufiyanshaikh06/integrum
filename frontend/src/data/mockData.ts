// Initial Mock Data and Course Constants for Integrum Platform
// Represents Semester 5 (Fall 2026) Student Sufiyan Shaikh

export const initialPlatformState = {
  activeView: 'dashboard',
  userRole: 'student', // 'student' or 'admin'
  currentMonth: 9,     // October (0-indexed: Jan=0...Oct=9)
  currentYear: 2026,
  selectedCalDay: 15,  // Thursday, Oct 15, 2026
  
  studentInfo: {
    name: 'Sufiyan Shaikh',
    roll: 'INT2024001',
    branch: 'Computer Science & Engineering',
    year: '3rd Year',
    sem: 'Semester 5 (Fall 2026)',
    email: 'sufiyan.shaikh@university.edu',
    avatar: 'SS'
  },

  adminInfo: {
    name: 'Dr. K. Sharma',
    title: 'University Administrator · Engineering Portal',
    email: 'admin.cse@university.edu',
    avatar: 'AD'
  },

  // Interactive Live Preview State on Landing Page
  simulator: {
    activeTab: 'overview',
    timerSeconds: 1500,
    timerRunning: false,
    timerId: null
  },

  // Focus & Study Timer
  study: {
    target: 25.0,
    logged: 18.5,
    pomoSeconds: 1500,
    pomoMode: 25,
    pomoRunning: false,
    pomoTimerId: null
  },
  
  // Real Semester 5 Course Attendance Records
  attendance: {
    1105111: { name: 'Artificial Intelligence', code: '1105111', present: 22, absent: 2, late: 1, total: 24 },
    1105112: { name: 'Cyber & Information Security', code: '1105112', present: 20, absent: 3, late: 1, total: 24 },
    1105115: { name: 'IKS in Computational Systems', code: '1105115', present: 21, absent: 2, late: 0, total: 23 },
    1105116: { name: 'Software Testing & Quality Assurance', code: '1105116', present: 16, absent: 5, late: 1, total: 22 },
    CS1105111: { name: 'Artificial Intelligence', code: '1105111', present: 22, absent: 2, late: 1, total: 24 },
    CS1105112: { name: 'Cyber & Information Security', code: '1105112', present: 20, absent: 3, late: 1, total: 24 },
    CS1105115: { name: 'IKS in Computational Systems', code: '1105115', present: 21, absent: 2, late: 0, total: 23 },
    CS1105116: { name: 'Software Testing & Quality Assurance', code: '1105116', present: 16, absent: 5, late: 1, total: 22 },
    RPROG:     { name: 'Regression Analysis Using R Programming', code: 'Minor', present: 22, absent: 1, late: 0, total: 23 }
  },

  // Real Assignments & Lab Submissions
  assignments: [
    { id: 'a1', title: 'A* Search & Adversarial Minimax Simulation', subject: '1105111 · AI', due: 'Oct 17', priority: 'High', status: 'PENDING', brief: 'Implement A* heuristic search algorithm and adversarial minimax game-tree with Alpha-Beta pruning in Python.' },
    { id: 'a2', title: 'Network Cryptography & Wireshark Trace Analysis', subject: '1105112 · CIS', due: 'Oct 18', priority: 'High', status: 'PENDING', brief: 'Packet capture trace analysis of TLS 1.3 handshake and RSA public-key cryptosystem key generation scripts.' },
    { id: 'a3', title: 'Paninian Computational Grammar Research Paper', subject: '1105115 · IKS', due: 'Oct 20', priority: 'Medium', status: 'PENDING', brief: 'Study of Ashtadhyayi formal generative grammatical rules compared with modern Backus-Naur context-free grammars.' },
    { id: 'a4', title: 'Selenium Automated Test Suite & Defect Report', subject: '1105116 · STQA', due: 'Oct 16', priority: 'High', status: 'SUBMITTED', brief: 'End-to-end automated UI regression test suite with boundary value test cases and cyclomatic complexity graphs.' },
    { id: 'a5', title: 'Multivariate Housing Regression Analysis in R', subject: 'Minor · R-Prog', due: 'Oct 26', priority: 'Medium', status: 'PENDING', brief: 'Ordinary Least Squares (OLS) estimation, multicollinearity VIF tests, and residual normality diagnostics in R Studio.' },
    { id: 'a6', title: 'AI Knowledge Representation & Prolog Inference', subject: '1105111 · AI', due: 'Oct 5', priority: 'High', status: 'GRADED', brief: 'First-order logic unification and resolution theorem proving. Graded: 95/100.' },
    { id: 'a7', title: 'Vulnerability Assessment & Penetration Plan', subject: '1105112 · CIS', due: 'Oct 10', priority: 'Medium', status: 'SUBMITTED', brief: 'Security posture audit of web applications using OWASP Top 10 vulnerabilities checklist.' },
    { id: 'a8', title: 'Unit Testing & Code Coverage using JUnit', subject: '1105116 · STQA', due: 'Oct 2', priority: 'Medium', status: 'GRADED', brief: 'White-box path coverage analysis achieving 94% branch coverage. Graded: 88/100.' }
  ],

  // Real Tasks for Sufiyan Shaikh
  tasks: [
    { id: 't1', title: 'Review Artificial Intelligence: Heuristic Search & A* Algorithm', subject: 'AI', due: 'Oct 17', priority: 'High', status: 'TODO' },
    { id: 't2', title: 'Practice RSA encryption & SHA-256 hash numericals for CIS paper', subject: 'CIS', due: 'Oct 18', priority: 'High', status: 'IN_PROGRESS' },
    { id: 't3', title: 'Revise Vedic binary logic & Panini grammar automata for IKS', subject: 'IKS', due: 'Oct 20', priority: 'Medium', status: 'TODO' },
    { id: 't4', title: 'STQA: Boundary Value Analysis & Cyclomatic Complexity graphs', subject: 'STQA', due: 'Oct 21', priority: 'High', status: 'TODO' },
    { id: 't5', title: 'R Programming: Multiple linear regression & ANOVA diagnostics', subject: 'RPROG', due: 'Oct 26', priority: 'Medium', status: 'TODO' },
    { id: 't6', title: 'Download & verify University Hall Ticket for Metropolitan Centre 042', subject: 'General', due: 'Oct 15', priority: 'High', status: 'DONE' },
    { id: 't7', title: 'Verify examination venue route: Metropolitan Centre of Arts & Commerce', subject: 'General', due: 'Oct 18', priority: 'High', status: 'TODO' },
    { id: 't8', title: 'Solve past year AI question paper (Dec 2025 & May 2026)', subject: 'AI', due: 'Oct 17', priority: 'Medium', status: 'IN_PROGRESS' },
    { id: 't9', title: 'Set up weekly pre-exam revision timetable on Integrum', subject: 'General', due: 'Oct 15', priority: 'Low', status: 'DONE' },
    { id: 't10', title: 'Update technical resume with AI & Cyber Security projects', subject: 'Career', due: 'Oct 25', priority: 'Medium', status: 'TODO' }
  ],

  // Reminders for Exam & Hall Ticket Reporting
  reminders: [
    { id: 'r1', title: 'Print Hall Ticket & College ID Card', desc: 'Carry laminated hall ticket for entry at Metropolitan Institute Centre.', time: 'Today · 4:00 PM', priority: 'High', status: 'active' },
    { id: 'r2', title: 'AI Theory Exam (1105111) — Reporting Time', desc: 'Mandatory reporting at 02:00 PM | Exam: 02:30 PM - 03:30 PM.', time: 'Oct 19 · 1:30 PM', priority: 'High', status: 'active' },
    { id: 'r3', title: 'Cyber Security Exam (1105112) — Reporting Time', desc: 'Reporting at 02:00 PM | Venue: Metropolitan Institute Examination Centre (Hall 4A).', time: 'Oct 21 · 1:30 PM', priority: 'High', status: 'active' },
    { id: 'r4', title: 'STQA Lab Report Submission', desc: 'Submit automated Selenium test suite before Friday cutoff.', time: 'Snoozed until Oct 16', priority: 'Low', status: 'snoozed' },
    { id: 'r5', title: 'R Programming Exam (Minor) — College Venue', desc: 'Exam at Campus Science Block (Lab 1) | 02:30 PM.', time: 'Oct 28 · 1:30 PM', priority: 'High', status: 'active' },
    { id: 'r6', title: 'Online Hall Ticket Verification', desc: 'Seat number and registration checked on university portal.', time: 'Oct 14 · Completed', priority: 'Low', status: 'dismissed' }
  ],

  // Technical Notes for the 5 Subjects
  notes: [
    { id: 'n1', title: 'Artificial Intelligence — Informed Search & A* Optimality', subject: 'AI', preview: 'A* algorithm evaluation function: f(n) = g(n) + h(n). Admissible heuristics never overestimate cost to goal, guaranteeing optimal shortest path.',
      excerpt: 'A* algorithm evaluation function: f(n) = g(n) + h(n). Admissible heuristics never overestimate cost to goal, guaranteeing optimal shortest path.', content: '### Artificial Intelligence: A* Search Algorithm\\n\\n1. **Core Formulation:**\\n   - `f(n) = g(n) + h(n)`\\n   - `g(n)` = actual cost from start node to current node `n`.\\n   - `h(n)` = heuristic estimate of cost from `n` to goal node.\\n\\n2. **Conditions for Optimality:**\\n   - **Admissibility**: `h(n) <= h*(n)` where `h*(n)` is true shortest path cost.\\n   - **Consistency (Monotonicity)**: `h(n) <= c(n, a, n\') + h(n\')`.\\n\\n3. **Comparison:**\\n   - Greedy Best-First Search uses only `h(n)` (fast, but incomplete and suboptimal).\\n   - Dijkstra uses only `g(n)` (optimal, but explores in all directions).', tags: ['AI', '1105111', 'Search', 'Exam Prep'], updated: '3 hours ago' },
    { id: 'n2', title: 'Cyber & Information Security — RSA Public Key Cryptosystem', subject: 'CIS', preview: 'RSA asymmetric key generation based on integer factorization: choose primes p and q, compute n = p*q, phi(n) = (p-1)*(q-1), choose public key e coprime to phi.',
      excerpt: 'RSA asymmetric key generation based on integer factorization: choose primes p and q, compute n = p*q, phi(n) = (p-1)*(q-1), choose public key e coprime to phi.', content: '### RSA Cryptographic Algorithm & Key Generation\\n\\n1. **Key Generation Steps:**\\n   - Select two distinct large prime numbers `p` and `q`.\\n   - Calculate modulus `n = p * q`.\\n   - Compute Euler\'s totient `phi(n) = (p - 1) * (q - 1)`.\\n   - Choose integer `e` such that `1 < e < phi(n)` and `gcd(e, phi(n)) = 1`.\\n   - Calculate private exponent `d` such that `(d * e) % phi(n) = 1` using Extended Euclidean Algorithm.\\n\\n2. **Encryption & Decryption:**\\n   - Ciphertext `C = (M^e) mod n`.\\n   - Plaintext `M = (C^d) mod n`.', tags: ['CIS', '1105112', 'Cryptography', 'Security'], updated: 'Yesterday' },
    { id: 'n3', title: 'IKS Computational Systems — Binary Logic & Pingala Laghu-Guru', subject: 'IKS', preview: 'Pingala\'s Chandas Shastra (c. 300 BCE) conceptualization of binary sequences: Laghu (0) and Guru (1). Prastara permutations and Meru Prastara combinatorics.', content: '### Indian Knowledge Systems (IKS) in Computing\\n\\n- **Pingala\'s Binary Sequences**: Early representation of binary digits using light (Laghu, 0) and heavy (Guru, 1) poetic syllables.\\n- **Meru Prastara**: Precursor to Pascal\'s triangle, providing binomial coefficients for counting n-syllable meters.\\n- **Panini\'s Grammar Formalism**: Context-free generative grammar in Ashtadhyayi using auxiliary markers analogous to Backus-Naur Form.', tags: ['IKS', '1105115', 'History', 'Algorithms'], updated: '2 days ago' },
    { id: 'n4', title: 'Software Testing & QA — Boundary Value Analysis & Cyclomatic Complexity', subject: 'STQA', preview: 'Black-box testing boundary value heuristics: min, min+, nom, max-, max. White-box McCabe Cyclomatic Complexity V(G) = E - N + 2P for independent execution paths.',
      excerpt: 'Black-box testing boundary value heuristics: min, min+, nom, max-, max. White-box McCabe Cyclomatic Complexity V(G) = E - N + 2P for independent execution paths.', content: '### Software Testing & Quality Assurance Methods\\n\\n1. **Boundary Value Analysis (BVA):**\\n   - Extreme test cases: `min - 1`, `min`, `min + 1`, `nominal`, `max - 1`, `max`, `max + 1`.\\n\\n2. **McCabe Cyclomatic Complexity:**\\n   - `V(G) = E - N + 2P`\\n   - `E` = number of edges in control flow graph.\\n   - `N` = number of nodes.\\n   - `P` = connected components (typically 1).\\n   - Equivalently: `V(G) = Predicate Nodes + 1`.', tags: ['STQA', '1105116', 'Testing', 'QA'], updated: '3 days ago' },
    { id: 'n5', title: 'Regression Analysis in R — OLS Estimation & Residual Diagnostics', subject: 'RPROG', preview: 'Multiple Linear Regression model: Y = beta_0 + beta_1*X_1 + ... + epsilon. R functions lm(), summary(), plot() for Cook\'s distance and Q-Q normality evaluation.', content: '### Regression Modeling in R Studio\\n\\n```R\\n# Fit multiple linear regression model\\nmodel <- lm(Price ~ Size + Bedrooms + Age, data = housing_data)\\nsummary(model)\\n\\n# Diagnostic plots: Residuals vs Fitted, Normal Q-Q, Scale-Location, Residuals vs Leverage\\npar(mfrow = c(2, 2))\\nplot(model)\\n```\\n\\n- **R-squared & Adjusted R-squared**: Proportion of variance explained, penalized for redundant regressors.\\n- **Variance Inflation Factor (VIF)**: `vif(model)` to detect multicollinearity (`VIF > 5` indicates high collinearity).', tags: ['RPROG', 'Statistics', 'R-Studio', 'Minor'], updated: '4 days ago' },
    { id: 'n6', title: 'Artificial Intelligence — Adversarial Minimax & Alpha-Beta Pruning', subject: 'AI', preview: 'Game tree decision making in two-player zero-sum deterministic games. Alpha cutoffs (when beta <= alpha at min node) prune redundant subtrees without loss of optimality.',
      excerpt: 'Game tree decision making in two-player zero-sum deterministic games. Alpha cutoffs (when beta <= alpha at min node) prune redundant subtrees without loss of optimality.', content: '### Minimax & Alpha-Beta Search\\n\\n- **Alpha**: Best value that MAX can guarantee at current level or above (initially -infinity).\\n- **Beta**: Best value that MIN can guarantee at current level or above (initially +infinity).\\n- **Pruning Rule**: Prune remaining children of node as soon as `alpha >= beta`.\\n- **Time Complexity**: Reduces worst-case `O(b^d)` down to `O(b^(d/2))` with perfect move ordering.', tags: ['AI', '1105111', 'Game Theory', 'Trees'], updated: '5 days ago' }
  ],

  // Career Resumes
  resumes: {
    swe: {
      title: 'Software Engineer (AI & Security Systems)',
      score: 92, ats: 92, updated: 'Oct 24, 2026', format: 94, keywords: 90, key: 90,
      impact: 92,
      brevity: 92,
      matched: ['Python', 'C++', 'React', 'SQL', 'Git', 'REST APIs', 'Artificial Intelligence', 'Cryptography', 'Linux', 'Machine Learning', 'Selenium'],
      missing: ['Docker', 'CI/CD Pipelines', 'Kubernetes', 'Microservices', 'Redis']
    },
    security: {
      title: 'Cyber & Information Security Analyst',
      score: 84, ats: 84, updated: 'Oct 22, 2026', format: 88, keywords: 82, key: 82,
      impact: 84,
      brevity: 86,
      matched: ['Network Security', 'Wireshark', 'RSA Cryptography', 'Linux', 'Python', 'TCP/IP', 'Vulnerability Assessment'],
      missing: ['SIEM / Splunk', 'Burp Suite', 'Metasploit', 'OWASP Top 10', 'Cloud Security']
    },
    data: {
      title: 'Statistical & Data Analyst (R / Python)',
      score: 78, ats: 78, updated: 'Oct 18, 2026', format: 84, keywords: 75, key: 75,
      impact: 76,
      brevity: 80,
      matched: ['R Programming', 'Regression Analysis', 'Statistics', 'SQL', 'Python', 'ggplot2', 'ANOVA'],
      missing: ['Tableau', 'PowerBI', 'Time Series Analysis', 'BigQuery', 'Machine Learning']
    }
  },

  // Skills
    skills: [
    { name: 'Python (AI & Scripting)', category: 'Languages', cat: 'Languages', level: 4.5, verified: true },
    { name: 'R Programming (Statistics)', category: 'Languages', cat: 'Languages', level: 4, verified: true },
    { name: 'C++ (Algorithms & Systems)', category: 'Languages', cat: 'Languages', level: 4, verified: true },
    { name: 'SQL & Database Design', category: 'Languages', cat: 'Languages', level: 4, verified: true },
    { name: 'React & Web Applications', category: 'Frameworks', cat: 'Frameworks', level: 3.5, verified: false },
    { name: 'Software Testing & Selenium QA', category: 'Frameworks', cat: 'Frameworks', level: 3.5, verified: true },
    { name: 'Git & Version Control', category: 'Frameworks', cat: 'Frameworks', level: 4.5, verified: true },
    { name: 'Docker & Containerization', category: 'Cloud & DevOps', cat: 'Cloud & DevOps', level: 3.5, verified: true },
    { name: 'Linux Terminal & Networking', category: 'Cloud & DevOps', cat: 'Cloud & DevOps', level: 4, verified: true },
    { name: 'Artificial Intelligence & Heuristics', category: 'Core CS', cat: 'Core CS', level: 4.5, verified: true },
    { name: 'Cyber Security & Cryptography', category: 'Core CS', cat: 'Core CS', level: 4, verified: true },
    { name: 'IKS Computational Systems', category: 'Core CS', cat: 'Core CS', level: 4, verified: true },
    { name: 'Analytical Problem Solving', category: 'Core CS', cat: 'Core CS', level: 4.5, verified: true }
  ],

  // Jobs Pipeline
  jobs: [
    { id: 'j1', company: 'Google', role: 'SWE Intern', stage: 'Applied', comp: '₹1,25,000/mo', date: 'Oct 8', nextRound: 'Resume Screening' },
    { id: 'j2', company: 'Microsoft', role: 'Backend Intern', stage: 'Applied', comp: '₹1,00,000/mo', date: 'Oct 10', nextRound: 'OA Assessment' },
    { id: 'j3', company: 'Amazon', role: 'SDE Intern', stage: 'Interview', comp: '₹1,10,000/mo', date: 'Oct 2', nextRound: 'Round 2 Technical · Post-Exams' },
    { id: 'j4', company: 'Uber', role: 'Platform Intern', stage: 'Interview', comp: '₹1,15,000/mo', date: 'Oct 5', nextRound: 'Coding Assessment' },
    { id: 'j5', company: 'Infosys', role: 'Specialist Programmer', stage: 'Offered', comp: '₹9.5 LPA', date: 'Sep 24', nextRound: 'Offer Accepted' },
    { id: 'j6', company: 'Adobe', role: 'Frontend Intern', stage: 'Rejected', comp: '₹85,000/mo', date: 'Sep 15', nextRound: 'Referral Closed' },
    { id: 'j7', company: 'Atlassian', role: 'Software Engineer Intern', stage: 'Applied', comp: '₹1,20,000/mo', date: 'Oct 12', nextRound: 'Reviewing Application' },
    { id: 'j8', company: 'Goldman Sachs', role: 'Summer Analyst', stage: 'Interview', comp: '₹1,00,000/mo', date: 'Sep 30', nextRound: 'Final Round Pending' }
  ],

  // Notifications
  notifications: [
    { id: 'n1', title: 'Artificial Intelligence Theory Exam (1105111)', desc: 'Exam on Mon, Oct 19 | Reporting: 02:00 PM at Metropolitan Institute Centre.', time: '15 min ago', unread: true, type: 'exam' },
    { id: 'n2', title: 'Software Testing Attendance Recovery Alert', desc: 'Current standing is 72.7%. Attend remaining lab sessions to restore safe 76.0%.', time: '1 hour ago', unread: true, type: 'warn' },
    { id: 'n3', title: 'Hall Ticket Verification Completed', desc: 'Seat number and Ulhasnagar exam centre confirmed on university portal.', time: 'Today', unread: false, type: 'due' },
    { id: 'n4', title: 'Minor Exam Venue Reminder (Oct 28)', desc: 'Regression Analysis in R is held at your own college: Campus Science Block (Lab 1).', time: 'Yesterday', unread: false, type: 'career' }
  ],

  // Official Campus Circulars
  announcements: [
    { id: 'an1', title: 'Semester 5 University Theory Examination Schedule (Oct 19 – Oct 28)', cat: 'Exam', target: 'All Departments', body: 'The Semester 5 theory examinations commence Oct 19. External centre for courses 1105111, 1105112, 1105115, 1105116 is Metropolitan Institute Examination Centre (Hall 4A). Minor exam on Oct 28 is held at Campus Science Block (Lab 1). Reporting time 02:00 PM.' },
    { id: 'an2', title: 'Hall Ticket Distribution & Verification Guidelines', cat: 'Exam', target: '3rd Year CSE', body: 'Students must verify subject codes and examination centres on their hall tickets. Entry into examination halls requires college ID and university hall ticket.' },
    { id: 'an3', title: 'Campus Placement Day 1 Shortlists & Prep Sessions', cat: 'Placement', target: '3rd & 4th Year', body: 'Placement interviews will proceed immediately following the theory examination window. Keep your ATS resumes updated.' }
  ],

  // Admin Directory
  students: [
    { name: 'Sufiyan Shaikh', roll: 'INT2024001', dept: 'CSE', att: '87.0%', status: 'Good' },
    { name: 'Priya Sharma', roll: 'INT2024002', dept: 'CSE', att: '92.4%', status: 'Good' },
    { name: 'Rahul Singh', roll: 'INT2024018', dept: 'IT', att: '78.2%', status: 'Good' },
    { name: 'Ananya Patel', roll: 'INT2024045', dept: 'ECE', att: '84.5%', status: 'Good' },
    { name: 'Vikram Joshi', roll: 'INT2024062', dept: 'CSE', att: '71.0%', status: 'Warning' },
    { name: 'Neha Gupta', roll: 'INT2024089', dept: 'ECE', att: '94.0%', status: 'Good' }
  ],

  // Real October 2026 Examination Calendar Events
  calendarEvents: {
    5: [{ title: 'AI Prolog Inference Due', cat: 'ev-due' }],
    10: [{ title: 'Security Cipher Due', cat: 'ev-due' }],
    15: [{ title: 'Hall Ticket Verification (Today)', cat: 'ev-hol' }],
    16: [{ title: 'STQA Selenium Lab Due', cat: 'ev-due' }],
    17: [{ title: 'AI A* Search Project Due', cat: 'ev-due' }, { title: 'AI Mock Revision', cat: 'ev-exam' }],
    18: [{ title: 'Centre Venue Route Check (Metropolitan Centre)', cat: 'ev-other' }, { title: 'Security Lab Due', cat: 'ev-due' }],
    19: [{ title: 'EXAM: Artificial Intelligence (1105111)', cat: 'ev-exam', time: '02:30 PM - 03:30 PM (Rep: 02:00 PM)', venue: 'External: Metropolitan Institute Examination Centre (Hall 4A)-421004', type: 'Major - Theory' }],
    20: [{ title: 'IKS Research Draft Due', cat: 'ev-due' }],
    21: [{ title: 'EXAM: Cyber & Information Security (1105112)', cat: 'ev-exam', time: '02:30 PM - 03:30 PM (Rep: 02:00 PM)', venue: 'External: Metropolitan Institute Examination Centre (Hall 4A)', type: 'Major - Theory' }],
    22: [{ title: 'EXAM: IKS in Computational Systems (1105115)', cat: 'ev-exam', time: '02:30 PM - 03:30 PM (Rep: 02:00 PM)', venue: 'External: Metropolitan Institute Examination Centre (Hall 4A)', type: 'Theory' }],
    23: [{ title: 'EXAM: Software Testing & QA (1105116)', cat: 'ev-exam', time: '02:30 PM - 03:30 PM (Rep: 02:00 PM)', venue: 'External: Metropolitan Institute Examination Centre (Hall 4A)', type: 'Major - Theory' }],
    25: [{ title: 'R Programming Model Due', cat: 'ev-due' }],
    26: [{ title: 'R Programming Lab Revision', cat: 'ev-lec' }],
    28: [{ title: 'EXAM: Regression Analysis in R (Minor)', cat: 'ev-exam', time: '02:30 PM - 03:30 PM (Rep: 02:00 PM)', venue: 'College: Campus Science Block (Lab 1)', type: 'Minor - Theory' }],
    31: [{ title: 'Semester 5 Evaluation Review', cat: 'ev-other' }]
  },

  currentViewingNoteId: null,
  currentViewingAsgnId: null
};
