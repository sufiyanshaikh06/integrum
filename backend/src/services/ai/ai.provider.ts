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
  contextUsed: {
    attendancePercentage: number;
    subjectsCount: number;
  };
}

export interface IAIProvider {
  generateStudyPlan(context: StudyPlanContext): Promise<GeneratedStudyPlan>;
}
