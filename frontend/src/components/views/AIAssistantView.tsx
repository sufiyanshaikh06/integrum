import { useState } from 'react';
import type { StudentInfo, AttendanceRecord, TaskItem } from '../../types';

interface AIAssistantProps {
  studentInfo?: StudentInfo;
  subjects?: any[];
  attendance?: Record<string, AttendanceRecord>;
  tasks?: TaskItem[];
}

export default function AIAssistantView({
  studentInfo,
  subjects = [],
  attendance = {},
  tasks = [],
}: AIAssistantProps) {
  const studentName = studentInfo?.name?.split(' ')[0] || 'there';

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${studentName}! I am your Integrum AI Academic Advisor. I have real-time context of your enrolled subjects, unified exam dates, and attendance standing. How can I help you excel today?`,
    },
  ]);
  const [input, setInput] = useState('');

  const prompts = [
    { label: '📅 3-Day Revision Plan', text: 'Give me a structured 3-day revision plan for my upcoming Artificial Intelligence theory examination.' },
    { label: '🏢 Examination Timetable & Seating', text: 'Where is my exam centre for the October 2026 theory examinations, and what are the reporting guidelines?' },
    { label: '📊 Attendance Recovery Diagnosis', text: 'Analyze my current course attendance and calculate exact safe bunks or required recovery classes.' },
    { label: '⚡ Pending Tasks Breakdown', text: 'List my current high-priority academic tasks and recommend what I should tackle first today.' },
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    if (!textToSend) setInput('');

    // Dynamic Context-Aware AI Engine
    setTimeout(() => {
      const q = text.toLowerCase();
      let reply = '';

      if (q.includes('attendance') || q.includes('recover') || q.includes('bunk') || q.includes('stqa')) {
        const attendList = Object.values(attendance);
        const lowAttend = attendList.filter((c) => c && c.total > 0 && (c.present / c.total) < 0.75);

        if (lowAttend.length > 0) {
          const recSummary = lowAttend.map((c) => {
            const pct = Math.round((c.present / c.total) * 100);
            const needed = Math.max(1, Math.ceil((0.75 * c.total - c.present) / 0.25));
            return `• **${c.name} (${c.code}):** Currently **${pct}%** (${c.present}/${c.total} classes). You need **${needed} consecutive attended classes** to cross the 75% cutoff threshold.`;
          }).join('\n');

          reply = `🛡️ **Real-Time Attendance Standing & Recovery Analysis:**\n\n${recSummary}\n\n*Actionable Guidance:* Prioritize attending every upcoming lecture in these courses without absence to avoid detention notices.`;
        } else {
          reply = `🛡️ **Real-Time Attendance Standing:**\n\nAll your enrolled courses are currently **above the 75% university eligibility cutoff**! Keep logging your classes regularly via the Attendance Tracker to preserve your buffer.`;
        }
      } else if (q.includes('task') || q.includes('todo') || q.includes('priority')) {
        const pending = tasks.filter((t) => t.status !== 'DONE');
        if (pending.length > 0) {
          const taskBullets = pending.slice(0, 5).map((t) => `• [${t.priority}] **${t.title}** (${t.subject || 'General'})`).join('\n');
          reply = `⚡ **Your Active Academic Tasks & Priority Sequence:**\n\n${taskBullets}\n\n*Recommendation:* Tackle your High-Priority items first during your next 25-minute Pomodoro study block.`;
        } else {
          reply = `⚡ **Task Standing:** All tasks in your plan are currently completed! Head over to the **Productivity Tasks** tab or **Courses & Assignments** tab to log new deliverables.`;
        }
      } else if (q.includes('ai') || q.includes('revision') || q.includes('plan')) {
        reply = `📚 **3-Day Exam Revision Strategy:**\n\n1. **Day 1 (Core Foundations):** Informed & Uninformed Search (A* optimality, Admissible heuristics, Space complexity).\n2. **Day 2 (Adversarial & Logic):** Minimax search with Alpha-Beta pruning, Constraint Satisfaction Problems (CSP), and First-Order Predicate Logic.\n3. **Day 3 (Applied Systems):** Knowledge representation, resolution refutation, and basic perceptron backpropagation.\n\n*Pro Tip:* Pair this with 2 hours in the **Pomodoro Study Planner** for maximum retention.`;
      } else if (q.includes('venue') || q.includes('centre') || q.includes('seating') || q.includes('hall')) {
        reply = `📍 **Official University Examination Schedule & Centre Allocation:**\n\n- **Centre:** Metropolitan Examination Centre · Centre Code 042 (Main Campus)\n- **Artificial Intelligence (1105111):** Hall 4A · Row 3 (10:30 AM – 01:30 PM)\n- **Cyber & Information Security (1105112):** Hall 3B · Row 5\n- **IKS in Computational Systems (1105115):** Hall 4A · Row 2\n- **Software Testing & QA (1105116):** Hall 2C · Row 4\n- **R Programming Practical (1105118):** Campus Science Block · Computer Lab 1\n\n*Mandatory Rules:* Reporting time is strictly 30 minutes prior to paper. Carry your official verified Hall Ticket and College ID.`;
      } else if (q.includes('r') || q.includes('code') || q.includes('script')) {
        reply = `💻 **R Programming Linear Regression Implementation:**\n\n\`\`\`R\n# Integrum Dataset: Attendance vs Semester SGPA\ndata <- data.frame(\n  attendance = c(85, 72, 91, 65, 88, 95),\n  sgpa = c(8.9, 7.4, 9.2, 6.8, 8.8, 9.6)\n)\n\n# Fit ordinary least squares model\nmodel <- lm(sgpa ~ attendance, data = data)\nsummary(model)\n\n# Plot regression line\nplot(data$attendance, data$sgpa, main="Attendance vs SGPA", xlab="Attendance %", ylab="SGPA")\nabline(model, col="#7C3AED", lwd=2)\n\`\`\``;
      } else {
        const subList = subjects.length > 0 ? subjects.map((s) => s.name).join(', ') : 'Artificial Intelligence, Cyber Security, Software Testing';
        reply = `I have analyzed your query with respect to your enrolled courses (${subList}).\n\nTo help you best:\n1. Use the **Study Planner** to schedule deep-work revision sprints.\n2. Review your **Safe-Bunk Calculator** in Attendance Tracker.\n3. Verify your upcoming submissions in **Courses & Assignments**.\n\nFeel free to ask for specific code snippets, concept explanations, or revision schedules!`;
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 350);
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: 'Chat history cleared. How can I assist with your coursework?',
      },
    ]);
  };

  return (
    <div className="view active" id="v-ai">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Integrum AI Assistant</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Contextual AI student advisor equipped with your active syllabus, timetable, and attendance standing.
          </p>
        </div>
        <button className="btn btn-sm btn-outline" onClick={clearChat}>
          Clear Chat
        </button>
      </div>

      {/* Suggestion Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {prompts.map((p, idx) => (
          <button
            key={idx}
            className="btn btn-xs btn-outline"
            onClick={() => handleSend(p.text)}
            style={{ fontSize: '11px', background: 'var(--card-bg, #ffffff)' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="card" style={{ padding: '20px', minHeight: '440px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.sender === 'user' ? 'var(--primary)' : 'var(--bg-3)',
                color: m.sender === 'user' ? '#ffffff' : 'var(--text-1)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        {/* Input Form */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            className="form-input"
            placeholder="Ask anything about your syllabus, attendance, revision, or code..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={() => handleSend()}>
            Send ↵
          </button>
        </div>
      </div>
    </div>
  );
}
