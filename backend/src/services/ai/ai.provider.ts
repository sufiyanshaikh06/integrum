export interface StudyPlanContext {
  topic: string;
  targetDate?: string;
  goals?: string;
  attendancePercentage: number;
  subjects: { name: string; targetGrade: number | null }[];
}

export interface GeneratedStudyPlan {
  title: string;
  recommendedTargetDate: string;
  overview: string;
  suggestedTasks: { title: string; description: string }[];
  contextUsed?: {
    attendancePercentage: number;
    subjectsCount: number;
  };
}

export interface ResumeContent {
  personalInfo?: Record<string, unknown>;
  education?: Record<string, unknown>[];
  experience?: Record<string, unknown>[];
  skills?: string[];
  projects?: Record<string, unknown>[];
}

export interface GeneratedResumeAnalysis {
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  improvementFeedback: string;
}

// ─── AI Notes Assistant types ─────────────────────────────────────────────────

export interface NoteContent {
  title: string;
  content: string;
  subjectName: string;
  tags: string[];
}

export interface GeneratedNoteSummary {
  summary: string;
  keyPoints: string[];
}

export interface GeneratedKeyPoints {
  keyPoints: { point: string; importance: 'HIGH' | 'MEDIUM' | 'LOW' }[];
}

export interface GeneratedQuestions {
  questions: { question: string; answer: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD' }[];
}

export interface GeneratedFlashcards {
  flashcards: { front: string; back: string }[];
}

// ─── Provider contract ────────────────────────────────────────────────────────

export interface IAIProvider {
  generateStudyPlan(context: StudyPlanContext): Promise<GeneratedStudyPlan>;
  analyzeResume(content: ResumeContent): Promise<GeneratedResumeAnalysis>;
  summarizeNote(content: NoteContent): Promise<GeneratedNoteSummary>;
  extractKeyPoints(content: NoteContent): Promise<GeneratedKeyPoints>;
  generateQuestions(content: NoteContent): Promise<GeneratedQuestions>;
  generateFlashcards(content: NoteContent): Promise<GeneratedFlashcards>;
}
