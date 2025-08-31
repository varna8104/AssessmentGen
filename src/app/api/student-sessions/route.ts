import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// CREATE a new student session (POST)
export async function POST(request: NextRequest) {
  try {
    const { assessmentCode, studentName } = await request.json();
    if (!assessmentCode || !studentName) {
      return NextResponse.json({ error: 'Missing assessmentCode or studentName' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('student_sessions')
      .insert([{ assessment_code: assessmentCode, student_name: studentName, created_at: new Date().toISOString(), completed: false }])
      .select();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// READ student sessions for an assessment (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentCode = searchParams.get('assessmentCode');
    if (!assessmentCode) {
      return NextResponse.json({ error: 'Missing assessmentCode' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('student_sessions')
      .select('*')
      .eq('assessment_code', assessmentCode);
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE a student session (PUT)
export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = await request.json();
    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('student_sessions')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a student session (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const { error } = await supabase
      .from('student_sessions')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
