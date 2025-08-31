import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// CREATE a new question (POST)
export async function POST(request: NextRequest) {
  try {
    const { assessmentCode, question } = await request.json();
    if (!assessmentCode || !question) {
      return NextResponse.json({ error: 'Missing assessmentCode or question' }, { status: 400 });
    }
    // Insert question into the questions table (or update assessment)
    const { data, error } = await supabase
      .from('questions')
      .insert([{ assessment_code: assessmentCode, ...question }])
      .select();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// READ questions for an assessment (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentCode = searchParams.get('assessmentCode');
    if (!assessmentCode) {
      return NextResponse.json({ error: 'Missing assessmentCode' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('assessment_code', assessmentCode);
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE a question (PUT)
export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = await request.json();
    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a question (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
