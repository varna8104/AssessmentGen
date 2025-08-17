import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const STUDENTS_FILE = join(process.cwd(), 'data', 'student-sessions.json');

function ensureDataDirectory() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    require('fs').mkdirSync(dataDir, { recursive: true });
  }
}

function getStudentSessions() {
  ensureDataDirectory();
  if (!existsSync(STUDENTS_FILE)) {
    writeFileSync(STUDENTS_FILE, JSON.stringify([]));
    return [];
  }
  try {
    const data = readFileSync(STUDENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveStudentSessions(sessions: any[]) {
  ensureDataDirectory();
  writeFileSync(STUDENTS_FILE, JSON.stringify(sessions, null, 2));
}

export async function PUT(request: NextRequest) {
  try {
    const { 
      assessmentCode, 
      studentName, 
      currentQuestion, 
      score, 
      answers, 
      timeRemaining 
    } = await request.json();

    if (!assessmentCode || !studentName) {
      return NextResponse.json(
        { success: false, error: 'Assessment code and student name are required' },
        { status: 400 }
      );
    }

    const sessions = getStudentSessions();
    const sessionIndex = sessions.findIndex(
      (s: any) => s.assessmentCode === assessmentCode && s.studentName === studentName
    );

    if (sessionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Student session not found' },
        { status: 404 }
      );
    }

    // Update the session with current progress
    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      currentQuestion: currentQuestion || sessions[sessionIndex].currentQuestion,
      score: score !== undefined ? score : sessions[sessionIndex].score,
      answers: answers || sessions[sessionIndex].answers,
      timeRemaining: timeRemaining !== undefined ? timeRemaining : sessions[sessionIndex].timeRemaining,
      lastUpdated: new Date().toISOString()
    };

    saveStudentSessions(sessions);

    return NextResponse.json({
      success: true,
      message: 'Student progress updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating student progress:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
