import { NextRequest, NextResponse } from 'next/server'
import { publishedAssessments } from '@/lib/storage'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const STUDENTS_FILE = join(process.cwd(), 'data', 'student-sessions.json');

function ensureDataDirectory() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    require('fs').mkdirSync(dataDir, { recursive: true });
  }
}

function saveStudentSession(sessionData: any) {
  ensureDataDirectory();
  
  let sessions = [];
  if (existsSync(STUDENTS_FILE)) {
    try {
      const data = readFileSync(STUDENTS_FILE, 'utf8');
      sessions = JSON.parse(data);
    } catch {
      sessions = [];
    }
  }
  
  sessions.push(sessionData);
  writeFileSync(STUDENTS_FILE, JSON.stringify(sessions, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assessmentCode, studentName } = body

    // Debug: Log all available codes
    console.log('Available assessment codes:', Array.from(publishedAssessments.keys()))
    console.log('Requested code:', assessmentCode?.toUpperCase())

    // Validate required fields
    if (!assessmentCode) {
      return NextResponse.json(
        { success: false, message: 'Assessment code is required' },
        { status: 400 }
      )
    }

    // Find assessment by code
    const assessment = publishedAssessments.get(assessmentCode.toUpperCase())
    
    if (!assessment) {
      console.log('Assessment not found for code:', assessmentCode.toUpperCase())
      return NextResponse.json(
        { success: false, message: 'Assessment not found. Please check the code and try again.' },
        { status: 404 }
      )
    }

    // Check if assessment is active
    if (assessment.metadata.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'This assessment is no longer available.' },
        { status: 403 }
      )
    }

    // Check if student has already taken this assessment
    if (studentName) {
      const existingStudent = assessment.students.find(
        (student: any) => student.studentName.toLowerCase() === studentName.trim().toLowerCase()
      )
      
      if (existingStudent) {
        // If student has completed the assessment, show their results
        if (existingStudent.status === 'completed') {
          return NextResponse.json({
            success: false,
            message: 'You have already completed this assessment. You can only take it once.',
            alreadyCompleted: true,
            studentData: {
              name: existingStudent.studentName,
              score: existingStudent.score,
              completedAt: existingStudent.completedAt,
              status: existingStudent.status
            }
          }, { status: 409 })
        }
        
        // If student is still in progress, allow them to continue (but don't create new session)
        if (existingStudent.status === 'in_progress') {
          // Prepare assessment data for student to continue
          const studentAssessment = {
            title: assessment.assessment.title,
            description: assessment.assessment.description,
            totalPoints: assessment.assessment.totalPoints,
            estimatedTime: assessment.assessment.estimatedTime,
            questions: assessment.assessment.questions.map((q: any, index: number) => ({
              id: q.id || `q_${index + 1}`,
              question: q.question,
              type: q.type,
              options: q.options,
              points: q.points || 1,
              timeLimit: q.timeLimit || 30,
              difficulty: q.difficulty || 'medium',
              topic: q.topic || 'General',
              correctAnswer: q.correctAnswer, // Keep for client-side scoring
              explanation: q.explanation || 'No explanation available',
              media: q.media // Include media if available
            }))
          }

          console.log(`Student ${studentName} continuing assessment ${assessmentCode}`)

          return NextResponse.json({
            success: true,
            message: 'Continuing assessment...',
            assessment: studentAssessment,
            studentName: existingStudent.studentName,
            sessionId: existingStudent.sessionId,
            continuing: true
          })
        }
      }
    }

    // Generate unique student session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create student session record (if studentName provided)
    if (studentName) {
      const studentSession = {
        sessionId,
        studentName: studentName.trim(),
        assessmentCode: assessmentCode.toUpperCase(),
        startedAt: new Date().toISOString(),
        status: 'in_progress',
        answers: [],
        score: null,
        completedAt: null
      }

      // Add student to assessment record
      assessment.students.push(studentSession)
      assessment.metadata.totalAttempts = assessment.students.length
      
      // Save to persistent storage
      const persistentSessionData = {
        assessmentCode: assessmentCode.toUpperCase(),
        studentName: studentName.trim(),
        startedAt: new Date().toISOString(),
        completedAt: null,
        currentQuestion: 1,
        totalQuestions: assessment.assessment.questions.length,
        score: 0,
        answers: [],
        timeRemaining: (assessment.assessment.questions.length * 30), // Assuming 30 seconds per question
        isActive: true
      };
      
      saveStudentSession(persistentSessionData);
    }

    // Prepare assessment data for student
    const studentAssessment = {
      title: assessment.assessment.title,
      description: assessment.assessment.description,
      totalPoints: assessment.assessment.totalPoints,
      estimatedTime: assessment.assessment.estimatedTime,
      questions: assessment.assessment.questions.map((q: any, index: number) => ({
        id: q.id || `q_${index + 1}`,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points || 1,
        timeLimit: q.timeLimit || 30,
        difficulty: q.difficulty || 'medium',
        topic: q.topic || 'General',
        correctAnswer: q.correctAnswer, // Keep for client-side scoring
        explanation: q.explanation || 'No explanation available',
        media: q.media // Include media if available
      }))
    }

    console.log('First question media:', studentAssessment.questions[0]?.media)

    console.log(`Student access to assessment ${assessmentCode}`)

    return NextResponse.json({
      success: true,
      message: 'Assessment loaded successfully',
      assessment: studentAssessment,
      studentName: studentName?.trim() || 'Student',
      sessionId: sessionId
    })

  } catch (error) {
    console.error('Error joining assessment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load assessment' },
      { status: 500 }
    )
  }
}

// Debug endpoint to see all published assessments
export async function GET() {
  try {
    const allAssessments = Array.from(publishedAssessments.entries()).map(([code, assessment]) => ({
      code,
      title: assessment.assessment.title,
      id: assessment.id,
      status: assessment.metadata.status,
      publishedAt: assessment.metadata.publishedAt
    }))

    return NextResponse.json({
      success: true,
      totalAssessments: allAssessments.length,
      assessments: allAssessments
    })
  } catch (error) {
    console.error('Error fetching published assessments:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}
