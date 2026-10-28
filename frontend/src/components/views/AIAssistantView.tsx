import { useState } from 'react';

export default function AIAssistantView() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello Sufiyan! I am your Integrum AI Student Advisor. I have full context of your Semester 5 Computer Science coursework, October exam dates, and attendance standing. How can I help you excel today?',
    },
  ]);
  const [input, setInput] = useState('');

  const prompts = [
    { label: '📅 Revision plan for AI exam', text: 'Give me a 3-day revision plan for my Artificial Intelligence theory exam scheduled for Oct 15 in Hall 4A.' },
    { label: '🏢 Exam venue & seating details', text: 'Where is my exam centre for the October 2026 theory examinations, and what are the reporting guidelines?' },
    { label: '📊 How to recover STQA attendance to 80%?', text: 'Calculate the recovery steps for my Software Testing & QA course currently at 72.7% attendance.' },
    { label: '💻 R programming sample code', text: 'Provide a concise R script for linear regression and summary analysis on semester attendance datasets.' },
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    if (!textToSend) setInput('');

    // Generate response
    setTimeout(() => {
      let reply = 'Here is what you need based on your Semester 5 coursework:';
      const q = text.toLowerCase();

      if (q.includes('ai') || q.includes('artificial')) {
        reply = '📚 **3-Day AI Exam Revision Plan (Oct 15 Examination · Hall 4A):**\n\n1. **Day 1:** Uninformed & Informed Search Algorithms (A*, IDA*, Heuristic admissibility).\n2. **Day 2:** Game Playing (Minimax with Alpha-Beta pruning) and CSP (Constraint Satisfaction Problems).\n3. **Day 3:** Knowledge Representation, First-Order Logic resolution, and Neural Network basics.\n\n*Venue note:* Hall 4A, Row 3. Bring verified hall ticket.';
      } else if (q.includes('venue') || q.includes('seating') || q.includes('hall')) {
        reply = '📍 **Exam Centre Allocation for Sufiyan Shaikh (INT2024001):**\n\n- **Examination Centre:** Hall B · Centre Code 042 (University Engineering Main Campus).\n- **AI Exam (Oct 15):** Hall 4A · Row 3\n- **Cyber Security (Oct 17):** Hall 3B · Row 5\n- **IKS (Oct 20):** Hall 4A · Row 2\n- **STQA (Oct 22):** Hall 2C · Row 4\n- **R Practical (Oct 26):** Computer Lab 1\n\n*Reporting Time:* 10:00 AM (30 minutes prior to paper).';
      } else if (q.includes('stqa') || q.includes('attendance') || q.includes('recover')) {
        reply = '🛡️ **STQA Attendance Recovery Analysis:**\n\n- **Current Standing:** 16 Attended / 22 Total = 72.7% (Below 75% cutoff).\n- **Recovery Requirement:** You need **2 consecutive attended classes** to reach 75.0% (18/24).\n- To reach a safe 80.0%, you must attend the next **8 consecutive classes** without absence.';
      } else if (q.includes('r') || q.includes('code') || q.includes('regression')) {
        reply = '💻 **R Programming Linear Regression Model:**\n\n```R\n# Integrum Student Attendance vs Marks Regression\ndata <- data.frame(\n  attendance = c(85, 72, 91, 65, 88, 95),\n  sgpa = c(8.9, 7.4, 9.2, 6.8, 8.8, 9.6)\n)\nmodel <- lm(sgpa ~ attendance, data = data)\nsummary(model)\nplot(data$attendance, data$sgpa, main="Attendance vs SGPA")\nabline(model, col="purple")\n```';
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 400);
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: 'Chat history cleared. How can I assist with your Semester 5 coursework?',
      },
    ]);
  };

  return (
    <div className="view active" id="v-ai">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Integrum AI Assistant</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Contextual AI student advisor equipped with Semester 5 syllabus, timetables, and code generation.
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
            style={{ fontSize: '11px', background: '#ffffff' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="card" style={{ padding: '20px', minHeight: '420px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: m.sender === 'user' ? 'var(--primary)' : 'var(--bg-3)',
                color: m.sender === 'user' ? '#ffffff' : 'var(--text-1)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            className="form-input"
            id="aiInput"
            placeholder="Ask anything about your syllabus, timetable, or exam venues..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={() => handleSend()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
