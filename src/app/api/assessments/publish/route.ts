import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessment, metadata, code } = body;

    // Validate required fields
    if (!assessment || !metadata || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: assessment, metadata, or code' },
        { status: 400 }
      );
    }

    if (!assessment.questions || !Array.isArray(assessment.questions)) {
      return NextResponse.json(
        { error: 'Invalid assessment structure: missing questions array' },
        { status: 400 }
      );
    }

    const record = {
      code: code.toUpperCase(),
      data: {
        assessment,
        metadata: {
          ...metadata,
          publishedAt: new Date().toISOString(),
          status: 'active',
          totalAttempts: 0
        }
      }
    };

    const { data: insertData, error } = await supabase
      .from('assessments')
      .insert([record])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save assessment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment published successfully',
      data: insertData?.[0] || null
    });
  } catch (error) {
    console.error('Error publishing assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


// Get all published assessments (for teacher dashboard)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*');

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessments', details: error.message },
        { status: 500 }
      );
    }

    // Optionally, map/format data for frontend
    const assessments = (data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      title: row.data?.assessment?.title,
      totalQuestions: row.data?.assessment?.questions?.length || 0,
      publishedAt: row.data?.metadata?.publishedAt,
      status: row.data?.metadata?.status
    }));

    return NextResponse.json({
      success: true,
      assessments
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
