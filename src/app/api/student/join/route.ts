import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentCode, studentName } = body;

    if (!assessmentCode) {
      return NextResponse.json(
        { success: false, message: 'Assessment code is required' },
        { status: 400 }
      );
    }

    // Fetch assessment from Supabase
    const { data: assessments, error: fetchError } = await supabase
      .from('assessments')
      .select('*')
      .eq('code', assessmentCode.toUpperCase());

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch assessment', details: fetchError.message },
        { status: 500 }
      );
    }

    const assessmentRow = assessments && assessments.length > 0 ? assessments[0] : null;
    if (!assessmentRow) {
      return NextResponse.json(
        { success: false, message: 'Assessment not found. Please check the code and try again.' },
        { status: 404 }
      );
    }

    const assessment = assessmentRow.data?.assessment;
    const metadata = assessmentRow.data?.metadata;

    if (!assessment || metadata?.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'This assessment is no longer available.' },
        { status: 403 }
      );
    }

    // Optionally, check if student already exists in student_sessions
    let alreadyCompleted = false;
    let existingStudentSession = null;
    if (studentName) {
      const { data: studentSessions } = await supabase
        .from('student_sessions')
        .select('*')
        .eq('assessment_code', assessmentCode.toUpperCase())
        .eq('student_name', studentName.trim());
      if (studentSessions && studentSessions.length > 0) {
        existingStudentSession = studentSessions[0];
        if (existingStudentSession.completed) {
          alreadyCompleted = true;
        }
      }
    }

    if (alreadyCompleted) {
      return NextResponse.json({
        success: false,
        message: 'You have already completed this assessment. You can only take it once.',
        alreadyCompleted: true,
        studentData: {
          name: existingStudentSession.student_name,
          score: existingStudentSession.score,
          completedAt: existingStudentSession.completed_at,
          status: 'completed'
        }
      }, { status: 409 });
    }

    // Create new student session
    let sessionId = null;
    if (studentName && !existingStudentSession) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { error: insertError } = await supabase
        .from('student_sessions')
        .insert([
          {
            assessment_code: assessmentCode.toUpperCase(),
            student_name: studentName.trim(),
            started_at: new Date().toISOString(),
            completed: false,
            score: null,
            responses: [],
          }
        ]);
      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return NextResponse.json(
          { success: false, message: 'Failed to create student session', details: insertError.message },
          { status: 500 }
        );
      }
    } else if (existingStudentSession) {
      sessionId = existingStudentSession.id;
    }

    // Prepare assessment data for student
    const studentAssessment = {
      title: assessment.title,
      description: assessment.description,
      totalPoints: assessment.totalPoints,
      estimatedTime: assessment.estimatedTime,
      questions: assessment.questions.map((q: any, index: number) => ({
        id: q.id || `q_${index + 1}`,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points || 1,
        timeLimit: q.timeLimit || 30,
        difficulty: q.difficulty || 'medium',
        topic: q.topic || 'General',
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'No explanation available',
        media: q.media
      }))
    };

    return NextResponse.json({
      success: true,
      message: 'Assessment loaded successfully',
      assessment: studentAssessment,
      studentName: studentName?.trim() || 'Student',
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Error joining assessment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load assessment' },
      { status: 500 }
    );
  }
}

// Debug endpoint to see all published assessments
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*');

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch assessments', details: error.message },
        { status: 500 }
      );
    }

    const assessments = (data || []).map((row: any) => ({
      code: row.code,
      title: row.data?.assessment?.title,
      id: row.id,
      status: row.data?.metadata?.status,
      publishedAt: row.data?.metadata?.publishedAt
    }));

    return NextResponse.json({
      success: true,
      totalAssessments: assessments.length,
      assessments
    });
  } catch (error) {
    console.error('Error fetching published assessments:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
