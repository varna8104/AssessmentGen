import { NextRequest, NextResponse } from 'next/server'

// For now, using hardcoded teacher code. In production, this would be in a database
const VALID_TEACHER_CODE = '1937'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teacherCode } = body

    if (!teacherCode) {
      return NextResponse.json(
        { error: 'Teacher code is required' },
        { status: 400 }
      )
    }

    if (teacherCode !== VALID_TEACHER_CODE) {
      return NextResponse.json(
        { error: 'Invalid teacher code' },
        { status: 401 }
      )
    }

    // In production, you would:
    // 1. Hash and compare the code
    // 2. Generate a JWT token
    // 3. Return teacher profile information

    return NextResponse.json({
      success: true,
      message: 'Teacher authenticated successfully',
      teacher: {
        id: 'teacher_001',
        name: 'Teacher',
        code: teacherCode
      }
    })

  } catch (error) {
    console.error('Teacher auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
