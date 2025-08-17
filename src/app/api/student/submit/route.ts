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

function updateStudentSession(assessmentCode: string, studentName: string, completionData: any) {
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
  
  // Find and update the student session
  const sessionIndex = sessions.findIndex((s: any) => 
    s.assessmentCode === assessmentCode && s.studentName === studentName
  );
  
  if (sessionIndex !== -1) {
    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      completedAt: completionData.completedAt,
      score: completionData.score,
      answers: completionData.answers,
      isActive: false,
      currentQuestion: completionData.totalQuestions,
      timeRemaining: 0
    };
  } else {
    // Create new session record if not found
    sessions.push({
      assessmentCode,
      studentName,
      startedAt: new Date(Date.now() - (completionData.timeSpent * 1000)).toISOString(),
      completedAt: completionData.completedAt,
      currentQuestion: completionData.totalQuestions,
      totalQuestions: completionData.totalQuestions,
      score: completionData.score,
      answers: completionData.answers,
      timeRemaining: 0,
      isActive: false
    });
  }
  
  writeFileSync(STUDENTS_FILE, JSON.stringify(sessions, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assessmentCode, studentName, answers, timeSpent, sessionId } = body

    // Validate required fields
    if (!assessmentCode || !studentName || !answers) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find assessment by code
    const assessment = publishedAssessments.get(assessmentCode.toUpperCase())
    
    if (!assessment) {
      return NextResponse.json(
        { success: false, message: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Calculate score and feedback
    let totalScore = 0
    const feedback = assessment.assessment.questions.map((question: any) => {
      const userAnswer = answers[question.id] || ''
      let isCorrect = false
      let pointsEarned = 0

      // Score based on question type
      if (question.type === 'open-text') {
        // For open-text questions, give full points if there's a meaningful answer
        const hasAnswer = userAnswer && typeof userAnswer === 'string' && userAnswer.trim().length > 10
        isCorrect = hasAnswer
        pointsEarned = hasAnswer ? question.points : 0
      } else if (question.type === 'fill-in-blanks' || question.type === 'fill-blanks') {
        // For fill-in-the-blanks, check each blank
        if (Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
          let correctBlanks = 0
          userAnswer.forEach((blank, index) => {
            if (blank && question.correctAnswer[index]) {
              const userBlank = blank.toString().toLowerCase().trim()
              const correctBlank = question.correctAnswer[index].toString().toLowerCase().trim()
              if (userBlank === correctBlank || userBlank.includes(correctBlank) || correctBlank.includes(userBlank)) {
                correctBlanks++
              }
            }
          })
          // Partial credit: points based on correct blanks
          isCorrect = correctBlanks === question.correctAnswer.length
          pointsEarned = Math.round((correctBlanks / question.correctAnswer.length) * question.points)
        } else {
          pointsEarned = 0
        }
      } else {
        // For MCQ and True/False questions
        isCorrect = userAnswer === question.correctAnswer
        pointsEarned = isCorrect ? question.points : 0
      }

      totalScore += pointsEarned
      
      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        points: pointsEarned,
        maxPoints: question.points,
        type: question.type
      }
    })

    // Create student result record
    const studentResult = {
      sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentName: studentName.trim(),
      assessmentCode: assessmentCode.toUpperCase(),
      answers,
      score: totalScore,
      totalPossibleScore: assessment.assessment.totalPoints,
      accuracy: Math.round((totalScore / assessment.assessment.totalPoints) * 100),
      timeSpent,
      completedAt: new Date().toISOString(),
      feedback
    }

    // Find existing student session and update it, or add new one
    const existingStudentIndex = assessment.students.findIndex(
      (s: any) => s.sessionId === studentResult.sessionId || (s.studentName === studentName && s.status === 'in_progress')
    )

    if (existingStudentIndex !== -1) {
      assessment.students[existingStudentIndex] = {
        ...assessment.students[existingStudentIndex],
        ...studentResult,
        status: 'completed'
      }
    } else {
      assessment.students.push({
        ...studentResult,
        startedAt: new Date().toISOString(),
        status: 'completed'
      })
    }

    // Update total attempts
    assessment.metadata.totalAttempts = assessment.students.length
    
    // Update persistent student session
    updateStudentSession(assessmentCode.toUpperCase(), studentName.trim(), {
      completedAt: studentResult.completedAt,
      score: totalScore,
      answers: answers,
      timeSpent: timeSpent,
      totalQuestions: assessment.assessment.questions.length
    });

    console.log(`Student ${studentName} completed assessment ${assessmentCode} with score: ${totalScore}/${assessment.assessment.totalPoints}`)

    return NextResponse.json({
      success: true,
      message: 'Assessment submitted successfully',
      result: studentResult
    })

  } catch (error) {
    console.error('Error submitting assessment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to submit assessment' },
      { status: 500 }
    )
  }
}
