import { NextResponse } from 'next/server'
import { publishedAssessments } from '@/lib/storage'

export async function POST() {
  try {
    const testCode = 'TESTAB'
    
    const testAssessment = {
      id: 'test-assessment-1',
      code: testCode,
      assessment: {
        title: 'Test Assessment',
        description: 'A test assessment to verify the system',
        totalPoints: 10,
        estimatedTime: 5,
        questions: [
          {
            id: 'test-q1',
            type: 'mcq',
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4',
            explanation: '2 + 2 = 4',
            points: 5,
            timeLimit: 30,
            difficulty: 'Easy',
            topic: 'Math'
          },
          {
            id: 'test-q2',
            type: 'true-false',
            question: 'The sky is blue.',
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'The sky appears blue due to light scattering.',
            points: 5,
            timeLimit: 20,
            difficulty: 'Easy',
            topic: 'Science'
          }
        ]
      },
      metadata: {
        assessmentName: 'Test Assessment',
        assessmentType: 'mixed',
        language: 'english',
        difficulty: 'Easy',
        numberOfQuestions: 2,
        generatedAt: new Date().toISOString(),
        source: 'Test API',
        publishedAt: new Date().toISOString(),
        status: 'active',
        totalAttempts: 0
      },
      students: []
    }

    publishedAssessments.set(testCode, testAssessment)

    console.log(`Test assessment published with code: ${testCode}`)
    console.log(`Total assessments now: ${publishedAssessments.size}`)

    return NextResponse.json({
      success: true,
      message: 'Test assessment published',
      code: testCode,
      totalAssessments: publishedAssessments.size
    })
  } catch (error) {
    console.error('Test publish error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to publish test assessment' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const allAssessments = Array.from(publishedAssessments.entries()).map(([code, assessment]) => ({
      code,
      title: assessment.assessment.title,
      status: assessment.metadata.status
    }))

    return NextResponse.json({
      success: true,
      totalAssessments: publishedAssessments.size,
      assessments: allAssessments
    })
  } catch (error) {
    console.error('Test get error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get assessments' },
      { status: 500 }
    )
  }
}
