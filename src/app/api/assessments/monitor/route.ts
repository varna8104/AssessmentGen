import { NextRequest, NextResponse } from 'next/server';
import { publishedAssessments, AssessmentRecord } from '../../../../lib/storage';

export async function GET() {
  try {
    const now = new Date();
    const today = now.toDateString();
    
    // Get all published assessments from in-memory storage
    const allAssessments = Array.from(publishedAssessments.values()) as AssessmentRecord[];
    
    // Filter active assessments (published and not ended)
    const activeAssessments = allAssessments.filter(record => 
      record.metadata.status === 'active'
    );
    
    // Get all student data from all assessments
    const allStudentSessions = allAssessments.reduce((allSessions, record) => {
      return allSessions.concat(record.students || []);
    }, [] as any[]);
    
    // Calculate statistics
    const completedSessionsToday = allStudentSessions.filter(s => 
      s.completedAt && new Date(s.completedAt).toDateString() === today
    );
    
    const allCompletedSessions = allStudentSessions.filter(s => s.completedAt);
    
    // Calculate overall average score percentage
    let overallAvgScore = 0;
    if (allCompletedSessions.length > 0) {
      const totalScoreSum = allCompletedSessions.reduce((sum, session) => {
        // Find the assessment for this session to get total possible score
        const assessmentRecord = allAssessments.find(record => record.code === session.assessmentCode);
        if (assessmentRecord) {
          const totalPossible = assessmentRecord.assessment.questions.reduce((qSum, q) => qSum + (q.points || 5), 0);
          return sum + (session.score / totalPossible * 100);
        }
        return sum;
      }, 0);
      overallAvgScore = Math.round(totalScoreSum / allCompletedSessions.length);
    }
    
    const stats = {
      activeAssessments: activeAssessments.length,
      studentsOnline: allStudentSessions.filter(s => s.status === 'in_progress' && !s.completedAt).length,
      completedToday: completedSessionsToday.length,
      avgScore: overallAvgScore
    };
    
    // Build active assessment details with live data
    const activeAssessmentDetails = activeAssessments.map(record => {
      const sessions = record.students || [];
      const activeSessions = sessions.filter(s => s.status === 'in_progress' && !s.completedAt);
      const completedSessions = sessions.filter(s => s.completedAt);
      
      // Get total possible score from assessment questions
      const totalPossibleScore = record.assessment.questions.reduce((sum, q) => sum + (q.points || 5), 0);
      
      // Calculate average score for this assessment
      const avgScore = completedSessions.length > 0 
        ? Math.round((completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length) / totalPossibleScore * 100)
        : 0;
      
      // Create leaderboard from active sessions (students currently taking)
      const activeLeaderboard = activeSessions
        .sort((a, b) => {
          // Sort by score first, then by progress
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          
          // If scores are equal, sort by number of questions answered
          const answersA = (a.answers || []).length;
          const answersB = (b.answers || []).length;
          if (answersB !== answersA) return answersB - answersA;
          
          // If everything is equal, sort by start time (earlier = better position)
          return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
        })
        .map((session, index) => {
          // Calculate completion percentage based on questions answered
          const questionsAnswered = (session.answers || []).length;
          const completionPercentage = Math.round((questionsAnswered / record.assessment.questions.length) * 100);
          
          // Calculate score percentage based on total possible score
          const scorePercentage = Math.round(((session.score || 0) / totalPossibleScore) * 100);
          
          // Estimate time remaining (simplified)
          const estimatedTimeRemaining = Math.max(0, record.assessment.estimatedTime - 10); // Mock time remaining
          const minutes = Math.floor(estimatedTimeRemaining);
          const seconds = (estimatedTimeRemaining % 1) * 60;
          const timeLeft = `${minutes}:${Math.floor(seconds).toString().padStart(2, '0')} left`;
          
          return {
            rank: index + 1,
            studentName: session.studentName,
            currentQuestion: questionsAnswered + 1,
            totalQuestions: record.assessment.questions.length,
            score: session.score || 0,
            scorePercentage,
            completionPercentage,
            timeRemaining: estimatedTimeRemaining,
            timeLeft,
            isActive: session.status === 'in_progress',
            status: 'active',
            isLeading: index === 0 // First student in sorted array is leading
          };
        });
      
      // Create completed students leaderboard
      const completedLeaderboard = completedSessions
        .sort((a, b) => {
          // Sort by score first, then by completion time (faster = better)
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          
          // If scores are equal, sort by completion time (faster completion wins)
          if (a.completedAt && b.completedAt) {
            const aTime = new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime();
            const bTime = new Date(b.completedAt).getTime() - new Date(b.startedAt).getTime();
            return aTime - bTime; // Less time = better rank
          }
          
          return 0;
        })
        .map((session, index) => {
          const scorePercentage = Math.round(((session.score || 0) / totalPossibleScore) * 100);
          const completionTime = session.completedAt && session.startedAt 
            ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000 / 60)
            : 0;
          
          return {
            rank: index + 1,
            studentName: session.studentName,
            currentQuestion: record.assessment.questions.length,
            totalQuestions: record.assessment.questions.length,
            score: session.score || 0,
            scorePercentage,
            completionPercentage: 100,
            timeRemaining: 0,
            timeLeft: 'Finished',
            isActive: false,
            status: 'completed',
            completedAt: session.completedAt,
            completionTime: `${completionTime} min`,
            isLeading: index === 0 // First student in completed list is the winner
          };
        });
      
      return {
        code: record.code,
        title: record.assessment.title,
        description: record.assessment.description,
        startedAt: record.metadata.publishedAt,
        activeStudents: activeSessions.length,
        completedStudents: completedSessions.length,
        avgScore,
        activeLeaderboard,
        completedLeaderboard,
        totalQuestions: record.assessment.questions.length,
        totalPossibleScore,
        metadata: record.metadata
      };
    });
    
    // Get past assessments (completed or inactive)
    const pastAssessments = allAssessments
      .filter(record => record.metadata.status !== 'active')
      .map(record => {
        const sessions = record.students || [];
        const completedSessions = sessions.filter(s => s.completedAt);
        
        const totalPossibleScore = record.assessment.questions.reduce((sum, q) => sum + (q.points || 5), 0);
        
        return {
          code: record.code,
          title: record.assessment.title,
          participantCount: sessions.length,
          avgScore: completedSessions.length > 0 
            ? Math.round((completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length) / totalPossibleScore * 100)
            : 0,
          completedAt: (record.metadata as any).endedAt || record.metadata.publishedAt,
          metadata: record.metadata
        };
      })
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 6); // Last 6 assessments
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        activeAssessments: activeAssessmentDetails,
        pastAssessments
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching monitor data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT endpoint to end an assessment
export async function PUT(request: NextRequest) {
  try {
    const { action, assessmentCode } = await request.json();
    
    if (action === 'endAssessment' && assessmentCode) {
      const assessmentRecord = publishedAssessments.get(assessmentCode);
      
      if (assessmentRecord) {
        assessmentRecord.metadata.status = 'ended';
        (assessmentRecord.metadata as any).endedAt = new Date().toISOString();
        (assessmentRecord.metadata as any).endedBy = 'teacher';
        
        // Update the assessment in storage
        publishedAssessments.set(assessmentCode, assessmentRecord);
        
        // Mark all active students as inactive
        assessmentRecord.students = assessmentRecord.students.map((student: any) => {
          if (student.status === 'in_progress' && !student.completedAt) {
            return {
              ...student,
              status: 'ended',
              completedAt: new Date().toISOString()
            };
          }
          return student;
        });
        
        publishedAssessments.set(assessmentCode, assessmentRecord);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Assessment ended successfully'
      });
    }
    
    if (action === 'endAllAssessments') {
      // End all active assessments
      publishedAssessments.forEach((record, code) => {
        if (record.metadata.status === 'active') {
          record.metadata.status = 'ended';
          (record.metadata as any).endedAt = new Date().toISOString();
          (record.metadata as any).endedBy = 'teacher';
          
          // Mark all active students as inactive
          record.students = record.students.map((student: any) => {
            if (student.status === 'in_progress' && !student.completedAt) {
              return {
                ...student,
                status: 'ended',
                completedAt: new Date().toISOString()
              };
            }
            return student;
          });
          
          publishedAssessments.set(code, record);
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'All assessments ended successfully'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Error updating assessments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
