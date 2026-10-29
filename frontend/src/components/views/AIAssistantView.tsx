import { useState, useRef, useEffect } from 'react';
import type { StudentInfo, AttendanceRecord, TaskItem } from '../../types';

interface AIAssistantProps {
  studentInfo?: StudentInfo;
  subjects?: any[];
  attendance?: Record<string, AttendanceRecord>;
  tasks?: TaskItem[];
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export default function AIAssistantView({
  studentInfo,
  subjects = [],
  attendance = {},
  tasks = [],
}: AIAssistantProps) {
  const studentName = studentInfo?.name?.split(' ')[0] || 'there';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello ${studentName}! I am your Integrum AI Academic Advisor. I have live context on your enrolled courses, attendance standing, and pending assignments.\n\nAsk me for concept explanations, code implementations, revision roadmaps, or real-time attendance calculations. How can I help you excel today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickPrompts = [
    { label: '3-Day Revision Plan', text: 'Give me a structured 3-day revision timetable for my upcoming Artificial Intelligence examination.' },
    { label: 'Attendance Standing', text: 'Analyze my current course attendance and calculate my exact clearance margin and recovery requirements.' },
    { label: 'Explain A* Search', text: 'Explain the A* search algorithm with heuristic admissibility, time complexity, and pseudocode.' },
    { label: 'Pending Course Tasks', text: 'Review my active academic tasks and prioritize what I should complete next.' },
    { label: 'SQL Normalization Guide', text: 'Explain 1NF, 2NF, 3NF, and BCNF database normalization with concrete schema examples.' },
  ];

  const generateAIResponse = (query: string): string => {
    const q = query.toLowerCase().trim();

    // 1. Attendance Analysis & Standing
    if (q.includes('attendance') || q.includes('recover') || q.includes('eligibility') || q.includes('75%') || q.includes('miss')) {
      const attendList = Object.values(attendance || {});
      if (attendList.length === 0) {
        return `**Attendance Health Analysis:**\n\nNo course attendance records have been logged yet for your profile. Once you log classes under the **Attendance Tracker** tab, I will compute your real-time clearance margin and any recovery lectures needed to maintain the 75% university requirement.`;
      }

      const lowCourses = attendList.filter((c) => c && c.total > 0 && (c.present / c.total) < 0.75);
      const safeCourses = attendList.filter((c) => c && c.total > 0 && (c.present / c.total) >= 0.75);

      let report = `**Real-Time Attendance Standing & Policy Analysis (Regulation 6086):**\n\n`;

      if (lowCourses.length > 0) {
        report += `⚠️ **Courses Requiring Immediate Attendance Recovery (< 75%):**\n`;
        lowCourses.forEach((c) => {
          const pct = Math.round((c.present / c.total) * 100);
          const needed = Math.max(1, Math.ceil((0.75 * c.total - c.present) / 0.25));
          report += `• **${c.name} (${c.code}):** Currently **${pct}%** (${c.present}/${c.total} classes attended). You must attend the next **${needed} consecutive lectures** without absence to restore eligibility.\n`;
        });
        report += `\n`;
      }

      if (safeCourses.length > 0) {
        report += `✓ **Courses in Good Standing (≥ 75%):**\n`;
        safeCourses.forEach((c) => {
          const pct = Math.round((c.present / c.total) * 100);
          const clearanceBuffer = Math.max(0, Math.floor(c.present / 0.75 - c.total));
          report += `• **${c.name} (${c.code}):** Standing at **${pct}%** (${c.present}/${c.total} classes). Clearance margin: **+${clearanceBuffer} classes** above cutoff.\n`;
        });
        report += `\n`;
      }

      report += `💡 *Academic Advisor Note:* Keep your attendance logged after each lecture in the **Attendance Tracker** view to track your standing accurately.`;
      return report;
    }

    // 2. Task & Deliverables Prioritization
    if (q.includes('task') || q.includes('todo') || q.includes('priority') || q.includes('deliverable') || q.includes('assignment')) {
      const activeTasks = tasks.filter((t) => t.status !== 'DONE');
      if (activeTasks.length === 0) {
        return `**Academic Deliverables Assessment:**\n\n🎉 Great work! All items in your task ledger are currently marked complete. Head over to the **Productivity Tasks** or **Courses & Assignments** tab to add new coursework milestones or lab deliverables.`;
      }

      const highPri = activeTasks.filter((t) => t.priority === 'HIGH');
      const medPri = activeTasks.filter((t) => t.priority === 'MEDIUM');
      const lowPri = activeTasks.filter((t) => t.priority === 'LOW');

      let taskReport = `**Active Academic Priority Matrix (${activeTasks.length} pending items):**\n\n`;

      if (highPri.length > 0) {
        taskReport += `🔴 **Urgent / High Priority:**\n`;
        highPri.forEach((t) => {
          taskReport += `• **${t.title}** · Subject: *${t.subject || 'General'}*\n`;
        });
        taskReport += `\n`;
      }

      if (medPri.length > 0) {
        taskReport += `🟡 **Medium Priority:**\n`;
        medPri.forEach((t) => {
          taskReport += `• **${t.title}** · Subject: *${t.subject || 'General'}*\n`;
        });
        taskReport += `\n`;
      }

      if (lowPri.length > 0) {
        taskReport += `🟢 **Backlog / Lower Priority:**\n`;
        lowPri.forEach((t) => {
          taskReport += `• **${t.title}** · Subject: *${t.subject || 'General'}*\n`;
        });
        taskReport += `\n`;
      }

      taskReport += `🎯 *Recommended Action:* Schedule a focused 50-minute Pomodoro sprint in the **Study Planner** right now for your top High Priority task.`;
      return taskReport;
    }

    // 3. A* Search and Heuristic Search Algorithms
    if (q.includes('a*') || q.includes('heuristic') || q.includes('search algorithm') || q.includes('dijkstra')) {
      return `**A* Search Algorithm: Comprehensive Technical Analysis**\n\n` +
        `A* is an informed best-first graph traversal algorithm that finds the shortest path from a start node to a goal node. It evaluates nodes using the evaluation function:\n\n` +
        `$$f(n) = g(n) + h(n)$$\n\n` +
        `• **g(n):** Exact cost from the start node to current node $n$.\n` +
        `• **h(n):** Estimated heuristic cost from node $n$ to the goal.\n` +
        `• **f(n):** Total estimated cost of the cheapest path through $n$.\n\n` +
        `### Admissibility & Consistency:\n` +
        `1. **Admissible Heuristic:** $h(n) \\le h^*(n)$ for all $n$, where $h^*(n)$ is the true optimal cost. An admissible heuristic guarantees **optimality in tree search** (it never overestimates).\n` +
        `2. **Consistent (Monotonic) Heuristic:** For every node $n$ and successor $n'$ generated by action $a$: $h(n) \\le c(n, a, n') + h(n')$. Consistency guarantees that $f(n)$ never decreases along any path, ensuring **optimality in graph search** without reopening visited nodes.\n\n` +
        `### Python Implementation:\n` +
        `\`\`\`python\nimport heapq\n\ndef a_star(graph, start, goal, heuristic):\n    # Priority queue stores: (f_score, g_score, current_node, path)\n    frontier = [(heuristic[start], 0, start, [start])]\n    visited = {}\n\n    while frontier:\n        f, g, current, path = heapq.heappop(frontier)\n        if current == goal:\n            return path, g\n        if current in visited and visited[current] <= g:\n            continue\n        visited[current] = g\n\n        for neighbor, weight in graph.get(current, []):\n            new_g = g + weight\n            new_f = new_g + heuristic.get(neighbor, 0)\n            heapq.heappush(frontier, (new_f, new_g, neighbor, path + [neighbor]))\n    return None, float('inf')\n\`\`\`\n\n` +
        `• **Time Complexity:** $O(b^d)$ worst case, bounded tightly when $h(n)$ is close to $h^*(n)$.\n` +
        `• **Space Complexity:** $O(b^d)$ as all generated nodes remain in memory (open/closed sets).`;
    }

    // 4. Database Normalization (1NF, 2NF, 3NF, BCNF)
    if (q.includes('normalization') || q.includes('1nf') || q.includes('2nf') || q.includes('3nf') || q.includes('bcnf')) {
      return `**Relational Database Normalization: 1NF through BCNF**\n\n` +
        `Normalization minimizes data redundancy and avoids update, insertion, and deletion anomalies.\n\n` +
        `### 1. First Normal Form (1NF)\n` +
        `• Each column must contain atomic (indivisible) values.\n` +
        `• No repeating groups or arrays in columns.\n` +
        `• A unique primary key must identify each tuple.\n\n` +
        `### 2. Second Normal Form (2NF)\n` +
        `• Must satisfy 1NF.\n` +
        `• **No Partial Dependency:** Every non-prime attribute must depend on the *entire* candidate key, not just a proper subset (applies to composite primary keys).\n` +
        `• *Example:* If key is \`(StudentID, CourseID)\`, then \`StudentEmail\` depending only on \`StudentID\` violates 2NF and must be moved to a separate \`Students\` table.\n\n` +
        `### 3. Third Normal Form (3NF)\n` +
        `• Must satisfy 2NF.\n` +
        `• **No Transitive Dependency:** Non-prime attributes must not depend on other non-prime attributes ($X \\to Y$ where neither $X$ is a superkey nor $Y$ is a prime attribute).\n` +
        `• *Example:* \`StudentID \\to ZipCode \\to City\`. Here \`City\` transitively depends on \`StudentID\`. Solution: Extract \`(ZipCode, City)\` into a lookup table.\n\n` +
        `### 4. Boyce-Codd Normal Form (BCNF)\n` +
        `• A stricter variant of 3NF.\n` +
        `• For every non-trivial functional dependency $X \\to Y$, $X$ **must be a superkey**.\n` +
        `• Eliminates anomalies when multiple overlapping candidate keys exist.`;
    }

    // 5. Revision Plan / Timetable
    if (q.includes('revision') || q.includes('plan') || q.includes('timetable') || q.includes('schedule') || q.includes('exam')) {
      const subNames = subjects.length > 0 ? subjects.map((s) => s.name).slice(0, 4) : ['Artificial Intelligence', 'Cyber Security', 'Software Testing & QA', 'IKS'];
      return `**Structured 3-Day Academic Revision Sprint**\n\n` +
        `Tailored for your enrolled curriculum (${subNames.join(', ')}):\n\n` +
        `### Day 1: Core Theoretical Foundations & Proofs\n` +
        `• **08:30 AM – 11:00 AM (Block 1):** ${subNames[0] || 'Artificial Intelligence'} — Adversarial search (Alpha-Beta pruning) & Constraint Satisfaction.\n` +
        `• **11:30 AM – 01:30 PM (Block 2):** ${subNames[1] || 'Cyber Security'} — Symmetric vs Asymmetric Cryptography (RSA modular arithmetic, AES rounds).\n` +
        `• **03:00 PM – 05:00 PM (Block 3):** Practice past examination questions; solve 5 analytical problems under timed conditions.\n` +
        `• **Evening Review (1 hour):** Review formula sheets and flashcards in the **Study Notes** tab.\n\n` +
        `### Day 2: Applied Architecture & Numerical Problems\n` +
        `• **08:30 AM – 11:00 AM (Block 1):** ${subNames[2] || 'Software Testing'} — Cyclomatic complexity, control flow graphs, boundary value analysis.\n` +
        `• **11:30 AM – 01:30 PM (Block 2):** Database transactions & concurrency control (2PL, Serializability, Write-Ahead Logging).\n` +
        `• **03:00 PM – 05:00 PM (Block 3):** Practical lab revision: verify code scripts and test suites.\n` +
        `• **Evening Review (1 hour):** Consolidate handwritten cheatsheets into markdown notes.\n\n` +
        `### Day 3: Full Mock Examination & Weakness Triage\n` +
        `• **09:00 AM – 12:00 PM:** Full 3-hour closed-book mock examination from the latest sample paper.\n` +
        `• **02:00 PM – 04:00 PM:** Self-assessment & error log review; address topics missed on mock.\n` +
        `• **05:00 PM – 06:30 PM:** Rapid active recall session.\n\n` +
        `💡 *Recommendation:* Use the **Pomodoro Timer** in Study Planner to stick to strict 50-minute study / 10-minute break cadences.`;
    }

    // 6. R Programming / Practical Exam
    if (q.includes('r ') || q.includes('r programming') || q.includes('linear regression') || q.includes('statistics') || q.includes('r script')) {
      return `**R Programming Practical Guide: Linear Regression & Hypothesis Testing**\n\n` +
        `Here is a complete, runnable R script demonstrating dataset preparation, model fitting, diagnostic checks, and visualization:\n\n` +
        `\`\`\`r\n# 1. Dataset Initialization\nset.seed(42)\nn <- 50\nattendance <- round(runif(n, 65, 98), 1)\n# Linear relation with stochastic Gaussian noise\nsgpa <- round(0.085 * attendance + rnorm(n, mean = 1.2, sd = 0.35), 2)\ndf <- data.frame(Attendance = attendance, SGPA = pmin(10.0, sgpa))\n\n# 2. Fit Ordinary Least Squares (OLS) Model\nfit <- lm(SGPA ~ Attendance, data = df)\nsummary(fit)\n\n# 3. Model Diagnostics\ncat("R-Squared:", summary(fit)$r.squared, "\\n")\ncat("P-value:", coef(summary(fit))[2, 4], "\\n")\n\n# 4. Scatter Plot with Fitted Regression Line\nplot(df$Attendance, df$SGPA,\n     main = "Academic Attendance vs Semester SGPA",\n     xlab = "Course Attendance (%)",\n     ylab = "Semester SGPA",\n     pch = 19, col = "#0F4C42")\nabline(fit, col = "#1D4ED8", lwd = 2.5)\ngrid()\n\`\`\`\n\n` +
        `• **Interpretation:** If the p-value of the slope coefficient is $< 0.05$, we reject the null hypothesis $H_0: \\beta_1 = 0$, confirming a statistically significant positive correlation.`;
    }

    // 7. General CS & Academic Mentorship
    const courseList = subjects.length > 0 ? subjects.map((s) => s.name).join(', ') : 'Artificial Intelligence, Cyber Security, Software Engineering';
    return `**Academic Concept Analysis & Guidance:**\n\n` +
      `Regarding your inquiry about "${query}":\n\n` +
      `In university computer science and engineering coursework, understanding the underlying mathematical principles and algorithmic trade-offs is essential.\n\n` +
      `### Key Recommendations:\n` +
      `1. **Theoretical Grounding:** Break down the core axioms, invariant properties, and state transitions.\n` +
      `2. **Complexity Profile:** Always evaluate asymptotic runtime $O(n)$ and space consumption $O(1)$ or $O(n)$.\n` +
      `3. **Practical Validation:** Implement a clean prototype or unit test to verify edge cases (empty inputs, boundaries, concurrent access).\n\n` +
      `Your active curriculum context includes: **${courseList}**.\n\n` +
      `Feel free to ask for specific code snippets, algorithm derivations, or practice questions for any of these subjects!`;
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Realistic thinking pause
    setTimeout(() => {
      const responseText = generateAIResponse(text);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'init-cleared',
        sender: 'ai',
        text: 'Chat history cleared. How can I assist with your coursework today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="view active" id="v-ai" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Integrum AI Academic Advisor</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.88rem' }}>
            Real-time contextual academic intelligence grounded in your active courses, tasks, and attendance.
          </p>
        </div>
        <button className="btn btn-sm btn-outline" onClick={clearChat}>
          Clear History
        </button>
      </div>

      {/* Suggestion Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            className="btn btn-xs btn-outline"
            onClick={() => handleSend(p.text)}
            style={{ fontSize: '11px', background: 'var(--bg)', borderRadius: '999px', padding: '6px 14px' }}
          >
            ✦ {p.label}
          </button>
        ))}
      </div>

      {/* Fixed Chat Container (Like ChatGPT) */}
      <div
        className="card"
        style={{
          height: 'calc(100vh - var(--header-h) - 190px)',
          minHeight: '480px',
          maxHeight: '740px',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          overflow: 'hidden',
        }}
      >
        {/* Scrollable Message History */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            paddingRight: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>
                  <span>{isUser ? 'You' : 'Integrum Advisor'}</span>
                  <span>·</span>
                  <span>{m.time}</span>
                </div>
                <div
                  style={{
                    background: isUser ? 'var(--primary)' : 'var(--bg-2)',
                    color: isUser ? '#ffffff' : 'var(--text-1)',
                    border: isUser ? 'none' : '1px solid var(--border)',
                    padding: '14px 18px',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    fontSize: '13.5px',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--bg-2)', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 600 }}>Thinking</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Pinned Bottom Input Form */}
        <div
          style={{
            flexShrink: 0,
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <input
            className="form-input form-input-underline"
            placeholder="Ask anything about algorithms, attendance recovery, study plans, or code..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={isTyping}
            style={{ flex: 1, fontSize: '14px' }}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={isTyping || !input.trim()}
            style={{ padding: '10px 22px', fontSize: '13px' }}
          >
            Ask AI ↵
          </button>
        </div>
      </div>
    </div>
  );
}
