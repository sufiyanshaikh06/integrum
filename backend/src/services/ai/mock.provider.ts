import {
  IAIProvider,
  StudyPlanContext,
  GeneratedStudyPlan,
  ResumeContent,
  GeneratedResumeAnalysis,
  NoteContent,
  GeneratedNoteSummary,
  GeneratedKeyPoints,
  GeneratedQuestions,
  GeneratedFlashcards,
} from './ai.provider.js';

export class MockProvider implements IAIProvider {
  async generateStudyPlan(context: StudyPlanContext): Promise<GeneratedStudyPlan> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      title: `${context.topic} Mastery Plan`,
      recommendedTargetDate: context.targetDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      overview: `A structured plan to master ${context.topic} while balancing ${context.subjects.length} current subjects.`,
      suggestedTasks: [
        { title: 'Core Concepts', description: `Review fundamental principles of ${context.topic}` },
        { title: 'Practice Exercises', description: 'Complete 3 problem sets' },
        { title: 'Integration', description: 'Apply concepts to a mini-project' }
      ],
      contextUsed: {
        attendancePercentage: context.attendancePercentage,
        subjectsCount: context.subjects.length
      }
    };
  }

  async analyzeResume(content: ResumeContent): Promise<GeneratedResumeAnalysis> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Deterministic mock analysis
    return {
      atsScore: 78,
      strengths: ['Clear education history', 'Action verbs used in experience'],
      weaknesses: ['Missing quantifiable metrics in bullet points', 'Formatting inconsistencies'],
      missingSkills: ['TypeScript', 'Cloud Infrastructure'],
      improvementFeedback: 'Your resume has a strong foundation, but focus on adding specific metrics (e.g., "improved performance by 20%") to your experience section to pass ATS more effectively.'
    };
  }

  // ─── AI Notes Assistant (test-only mock — deterministic) ─────────────────

  async summarizeNote(content: NoteContent): Promise<GeneratedNoteSummary> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      summary: `Summary of "${content.title}": This note covers key concepts in ${content.subjectName} including the main topics discussed.`,
      keyPoints: [
        `Core concept from ${content.subjectName}`,
        'Important definition covered',
        'Key relationship between topics identified',
      ],
    };
  }

  async extractKeyPoints(content: NoteContent): Promise<GeneratedKeyPoints> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      keyPoints: [
        { point: `Primary concept from ${content.title}`, importance: 'HIGH' },
        { point: 'Supporting detail identified', importance: 'MEDIUM' },
        { point: 'Additional context noted', importance: 'LOW' },
      ],
    };
  }

  async generateQuestions(content: NoteContent): Promise<GeneratedQuestions> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      questions: [
        {
          question: `What are the key concepts in ${content.title}?`,
          answer: 'The key concepts include the main topics discussed in the note.',
          difficulty: 'EASY',
        },
        {
          question: `How does this relate to ${content.subjectName}?`,
          answer: 'This connects to the broader subject through shared principles.',
          difficulty: 'MEDIUM',
        },
        {
          question: `Analyze the implications of the concepts in ${content.title}.`,
          answer: 'The implications extend to practical applications in the field.',
          difficulty: 'HARD',
        },
      ],
    };
  }

  async generateFlashcards(content: NoteContent): Promise<GeneratedFlashcards> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      flashcards: [
        {
          front: `Define the main concept from ${content.title}`,
          back: 'The main concept refers to the primary topic covered in this note.',
        },
        {
          front: `What is the significance of ${content.subjectName}?`,
          back: `${content.subjectName} provides foundational knowledge for related coursework.`,
        },
        {
          front: 'List three key takeaways',
          back: 'Core concept, supporting details, and practical applications.',
        },
      ],
    };
  }
}
