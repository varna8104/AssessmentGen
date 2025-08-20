// Shared in-memory storage for demo purposes
// In production, this would be a proper database

// Create a global variable to prevent multiple instances during development hot reload
declare global {
  var __published_assessments: Map<string, any> | undefined
}

export const publishedAssessments = globalThis.__published_assessments ?? new Map<string, any>()
globalThis.__published_assessments = publishedAssessments

export interface AssessmentRecord {
  id: string
  code: string
  assessment: {
    title: string
    description: string
    totalPoints: number
    estimatedTime: number
    questions: Array<{
      id: string
      type: string
      question: string
      options: string[]
      correctAnswer: string
      explanation: string
      points: number
      timeLimit: number
      difficulty: string
      topic?: string
    }>
  }
  metadata: {
    assessmentName: string
    assessmentType: string
    language: string
    difficulty?: string
    numberOfQuestions: number
    generatedAt: string
    source: string
    publishedAt: string
    status: string
    totalAttempts: number
  }
  students: Array<{
    sessionId: string
    studentName: string
    assessmentCode: string
    startedAt: string
    status: string
    answers: any[]
    score: number | null
    completedAt: string | null
  }>
}
