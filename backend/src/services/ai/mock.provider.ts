import { IAIProvider, StudyPlanContext, GeneratedStudyPlan } from './ai.provider.js';

export class MockProvider implements IAIProvider {
  async generateStudyPlan(context: StudyPlanContext): Promise<GeneratedStudyPlan> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      title: `AI Study Plan: ${context.topic}`,
      recommendedTargetDate: context.targetDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      overview: `Based on your goal to study ${context.topic}, and considering your current subjects (${context.subjects.map(s => s.name).join(', ') || 'None'}), we recommend a structured approach.`,
      suggestedTasks: [
        { title: `Read foundational materials on ${context.topic}`, description: 'Focus on core concepts.' },
        { title: 'Complete practice exercises', description: 'Apply concepts in a practical setting.' },
        { title: 'Review and summarize', description: 'Create a cheat sheet or summary notes.' }
      ],
      contextUsed: {
        attendancePercentage: context.attendancePercentage,
        subjectsCount: context.subjects.length
      }
    };
  }
}
