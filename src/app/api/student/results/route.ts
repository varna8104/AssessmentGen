import { NextRequest, NextResponse } from 'next/server'
import { publishedAssessments } from '@/lib/storage'

// This route uses request.url and in-memory state; ensure it's always dynamic and runs on Node.js
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assessmentCode = searchParams.get('code')
    const studentName = searchParams.get('student')

    if (!assessmentCode) {
      return NextResponse.json(
        { success: false, message: 'Assessment code is required' },
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

    // Get all completed students and sort by score
    const completedStudents = assessment.students
      .filter((student: any) => student.status === 'completed')
      .map((student: any) => ({
        name: student.studentName,
        score: student.score || 0,
        accuracy: student.accuracy || 0,
        timeSpent: student.timeSpent || 0,
        completedAt: student.completedAt,
        correctAnswers: student.feedback ? student.feedback.filter((f: any) => f.isCorrect).length : 0,
        totalQuestions: assessment.assessment.questions.length
      }))
      .sort((a: any, b: any) => {
        // Sort by score first, then by time (faster is better)
        if (b.score !== a.score) return b.score - a.score
        return a.timeSpent - b.timeSpent
      })
      .map((student: any, index: number) => ({
        ...student,
        rank: index + 1
      }))

    // Find current student's result
    const currentStudent = studentName 
      ? completedStudents.find((s: any) => s.name === studentName)
      : null

    // Generate statistics
    const stats = {
      totalStudents: completedStudents.length,
      averageScore: completedStudents.length > 0 
        ? Math.round(completedStudents.reduce((sum: number, s: any) => sum + s.score, 0) / completedStudents.length)
        : 0,
      averageAccuracy: completedStudents.length > 0
        ? Math.round(completedStudents.reduce((sum: number, s: any) => sum + s.accuracy, 0) / completedStudents.length)
        : 0,
      averageTime: completedStudents.length > 0
        ? Math.round(completedStudents.reduce((sum: number, s: any) => sum + s.timeSpent, 0) / completedStudents.length)
        : 0,
      highestScore: completedStudents.length > 0 ? Math.max(...completedStudents.map((s: any) => s.score)) : 0,
      lowestScore: completedStudents.length > 0 ? Math.min(...completedStudents.map((s: any) => s.score)) : 0
    }

    return NextResponse.json({
      success: true,
      assessmentTitle: assessment.assessment.title,
      totalPossibleScore: assessment.assessment.totalPoints,
      students: completedStudents,
      currentStudent,
      stats
    })

  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}
