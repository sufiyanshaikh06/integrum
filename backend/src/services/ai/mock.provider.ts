import { IAIProvider, StudyPlanContext, GeneratedStudyPlan, ResumeContent, GeneratedResumeAnalysis } from './ai.provider.js';

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
}
