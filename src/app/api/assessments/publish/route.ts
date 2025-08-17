import { NextRequest, NextResponse } from 'next/server'
import { publishedAssessments } from '@/lib/storage'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ASSESSMENTS_FILE = join(process.cwd(), 'data', 'assessments.json');

function ensureDataDirectory() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    require('fs').mkdirSync(dataDir, { recursive: true });
  }
}

function saveAssessmentToPersistence(assessmentRecord: any) {
  ensureDataDirectory();
  
  let assessments = [];
  if (existsSync(ASSESSMENTS_FILE)) {
    try {
      const data = readFileSync(ASSESSMENTS_FILE, 'utf8');
      assessments = JSON.parse(data);
    } catch {
      assessments = [];
    }
  }
  
  // Add new assessment
  assessments.push({
    code: assessmentRecord.code,
    title: assessmentRecord.assessment.title,
    description: assessmentRecord.assessment.description || '',
    questions: assessmentRecord.assessment.questions,
    createdAt: assessmentRecord.metadata.publishedAt,
    isActive: true,
    metadata: {
      ...assessmentRecord.metadata,
      totalPoints: assessmentRecord.assessment.totalPoints,
      totalQuestions: assessmentRecord.assessment.questions.length
    }
  });
  
  writeFileSync(ASSESSMENTS_FILE, JSON.stringify(assessments, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assessment, metadata, code } = body

    // Validate required fields
    if (!assessment || !metadata || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: assessment, metadata, or code' },
        { status: 400 }
      )
    }

    // Validate assessment structure
    if (!assessment.questions || !Array.isArray(assessment.questions)) {
      return NextResponse.json(
        { error: 'Invalid assessment structure: missing questions array' },
        { status: 400 }
      )
    }

    // Generate unique assessment ID
    const assessmentId = `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create assessment record
    const assessmentRecord = {
      id: assessmentId,
      code: code.toUpperCase(),
      assessment,
      metadata: {
        ...metadata,
        publishedAt: new Date().toISOString(),
        status: 'active',
        totalAttempts: 0
      },
      students: [] // Track student attempts
    }

    // Store in memory (in production, save to database)
    publishedAssessments.set(code.toUpperCase(), assessmentRecord)
    
    // Also save to persistent JSON file
    saveAssessmentToPersistence(assessmentRecord)

    console.log(`Assessment published with code: ${code.toUpperCase()}`)
    console.log(`Total published assessments: ${publishedAssessments.size}`)
    console.log(`Available codes: ${Array.from(publishedAssessments.keys()).join(', ')}`)
    console.log(`Assessment details:`, {
      title: assessment.title,
      questionsCount: assessment.questions.length,
      hasMedia: assessment.questions.some((q: any) => q.media)
    })

    return NextResponse.json({
      success: true,
      message: 'Assessment published successfully',
      data: {
        assessmentId,
        code: code.toUpperCase(),
        publishedAt: assessmentRecord.metadata.publishedAt,
        totalQuestions: assessment.questions.length,
        totalPoints: assessment.totalPoints || assessment.questions.length
      }
    })

  } catch (error) {
    console.error('Error publishing assessment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all published assessments (for teacher dashboard)
export async function GET(request: NextRequest) {
  try {
    const assessments = Array.from(publishedAssessments.values()).map(record => ({
      id: record.id,
      code: record.code,
      title: record.assessment.title,
      totalQuestions: record.assessment.questions.length,
      totalAttempts: record.students.length,
      publishedAt: record.metadata.publishedAt,
      status: record.metadata.status
    }))

    return NextResponse.json({
      success: true,
      assessments
    })

  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
