import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const now = new Date()
    const today = now.toDateString()

    // 1) Fetch active assessments from a DB view; fallback to filtering table if the view isn't available
    let activeRows: any[] = []
    let activeError: any = null

    const { data: viewData, error: viewError } = await supabase
      .from('active_assessments')
      .select('*')

    if (viewError) {
      activeError = viewError
    } else {
      activeRows = viewData || []
    }

    if (!activeRows.length) {
      // Fallback: fetch all and filter in app code
      const { data: allAssessmentsData, error: allErr } = await supabase
        .from('assessments')
        .select('*')

      if (allErr) {
        throw allErr
      }
      activeRows = (allAssessmentsData || []).filter((row: any) => row?.data?.metadata?.status === 'active')
    }

    // 2) Build a map of assessment meta and totals
    const activeAssessments = activeRows.map((row: any) => {
      const assessment = row?.data?.assessment || {}
      const metadata = row?.data?.metadata || {}
      const questions = assessment?.questions || []
      const totalPossibleScore = questions.reduce((sum: number, q: any) => sum + (q.points ?? 5), 0)

      return {
        id: row.id,
        code: row.code,
        assessment,
        metadata,
        totalPossibleScore,
        totalQuestions: questions.length
      }
    })

    const codeToTotals = new Map(
      activeAssessments.map(a => [a.code, { totalPossible: a.totalPossibleScore, totalQuestions: a.totalQuestions }])
    )

    // 3) Fetch student sessions per assessment in parallel
    const sessionsPerAssessment = await Promise.all(
      activeAssessments.map(async (a) => {
        const { data: sessions, error } = await supabase
          .from('student_sessions')
          .select('*')
          .eq('assessment_code', a.code)

        if (error) {
          // If sessions fetch fails, treat as empty but log
          console.error('Supabase student_sessions fetch error:', error)
        }
        return { code: a.code, sessions: sessions || [] }
      })
    )

    const allStudentSessions = sessionsPerAssessment.flatMap(s => s.sessions.map((row: any) => ({
      assessmentCode: row.assessment_code,
      studentName: row.student_name,
      createdAt: row.created_at,
      completed: !!row.completed,
      completedAt: row.completed_at || null,
      score: row.score ?? 0,
      responses: Array.isArray(row.responses) ? row.responses : []
    })))

    // 4) Stats
    const completedSessionsToday = allStudentSessions.filter(s =>
      s.completedAt && new Date(s.completedAt).toDateString() === today
    )

    const allCompletedSessions = allStudentSessions.filter(s => s.completed && s.completedAt)

    let overallAvgScore = 0
    if (allCompletedSessions.length > 0) {
      const totalScoreSum = allCompletedSessions.reduce((sum, session) => {
        const totals = codeToTotals.get(session.assessmentCode)
        if (totals && totals.totalPossible > 0) {
          return sum + (session.score / totals.totalPossible * 100)
        }
        return sum
      }, 0)
      overallAvgScore = Math.round(totalScoreSum / allCompletedSessions.length)
    }

    const stats = {
      activeAssessments: activeAssessments.length,
      studentsOnline: allStudentSessions.filter(s => !s.completed).length,
      completedToday: completedSessionsToday.length,
      avgScore: overallAvgScore
    }

    // 5) Active assessment details + leaderboards
    const sessionsByCode = new Map<string, any[]>(
      sessionsPerAssessment.map(spa => [spa.code, spa.sessions || []])
    )

    const activeAssessmentDetails = activeAssessments.map(record => {
      const dbSessions = sessionsByCode.get(record.code) || []

      const mapRow = (row: any) => ({
        studentName: row.student_name,
        startedAt: row.created_at,
        completedAt: row.completed_at || null,
        score: row.score ?? 0,
        responses: Array.isArray(row.responses) ? row.responses : [],
        completed: !!row.completed
      })

      const sessions = dbSessions.map(mapRow)
      const activeSessions = sessions.filter(s => !s.completed)
      const completedSessions = sessions.filter(s => s.completed && s.completedAt)

      const totalPossibleScore = record.totalPossibleScore
      const totalQuestions = record.totalQuestions

      const avgScore = completedSessions.length > 0
        ? Math.round((completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length) / totalPossibleScore * 100)
        : 0

      const activeLeaderboard = activeSessions
        .slice()
        .sort((a, b) => {
          const scoreA = a.score || 0
          const scoreB = b.score || 0
          if (scoreB !== scoreA) return scoreB - scoreA

          const answersA = (a.responses || []).length
          const answersB = (b.responses || []).length
          if (answersB !== answersA) return answersB - answersA

          return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        })
        .map((session, index) => {
          const questionsAnswered = (session.responses || []).length
          const completionPercentage = totalQuestions > 0 ? Math.round((questionsAnswered / totalQuestions) * 100) : 0
          const scorePercentage = totalPossibleScore > 0 ? Math.round(((session.score || 0) / totalPossibleScore) * 100) : 0

          // Estimate time remaining using estimatedTime - elapsed minutes
          const estimatedMinutes = record.assessment.estimatedTime || 0
          const elapsedMs = Math.max(0, now.getTime() - new Date(session.startedAt).getTime())
          const elapsedMinutes = elapsedMs / 1000 / 60
          const estimatedTimeRemaining = Math.max(0, Math.round(estimatedMinutes - elapsedMinutes))
          const minutes = Math.floor(estimatedTimeRemaining)
          const seconds = Math.floor((estimatedTimeRemaining % 1) * 60)
          const timeLeft = `${minutes}:${seconds.toString().padStart(2, '0')} left`

          return {
            rank: index + 1,
            studentName: session.studentName,
            currentQuestion: Math.min(questionsAnswered + 1, totalQuestions),
            totalQuestions,
            score: session.score || 0,
            scorePercentage,
            completionPercentage,
            timeRemaining: estimatedTimeRemaining,
            timeLeft,
            isActive: true,
            status: 'active',
            isLeading: index === 0
          }
        })

      const completedLeaderboard = completedSessions
        .slice()
        .sort((a, b) => {
          const scoreA = a.score || 0
          const scoreB = b.score || 0
          if (scoreB !== scoreA) return scoreB - scoreA

          if (a.completedAt && b.completedAt) {
            const aTime = new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime()
            const bTime = new Date(b.completedAt).getTime() - new Date(b.startedAt).getTime()
            return aTime - bTime
          }
          return 0
        })
        .map((session, index) => {
          const scorePercentage = totalPossibleScore > 0 ? Math.round(((session.score || 0) / totalPossibleScore) * 100) : 0
          const completionTimeMin = (session.completedAt && session.startedAt)
            ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000 / 60)
            : 0
          return {
            rank: index + 1,
            studentName: session.studentName,
            currentQuestion: totalQuestions,
            totalQuestions,
            score: session.score || 0,
            scorePercentage,
            completionPercentage: 100,
            timeRemaining: 0,
            timeLeft: 'Finished',
            isActive: false,
            status: 'completed',
            completedAt: session.completedAt,
            completionTime: `${completionTimeMin} min`,
            isLeading: index === 0
          }
        })

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
        totalQuestions,
        totalPossibleScore,
        metadata: record.metadata
      }
    })

    // 6) Past assessments (ended or inactive)
    const { data: allAssessmentsForPast, error: pastErr } = await supabase
      .from('assessments')
      .select('*')

    if (pastErr) {
      console.error('Supabase fetch error for past assessments:', pastErr)
    }

    const pastRows = (allAssessmentsForPast || [])
      .filter((row: any) => row?.data?.metadata?.status !== 'active')

    // Sort by endedAt/publishedAt desc and take last 6
    const sortedPast = pastRows
      .map((row: any) => {
        const assessment = row?.data?.assessment || {}
        const metadata = row?.data?.metadata || {}
        const questions = assessment?.questions || []
        const totalPossibleScore = questions.reduce((sum: number, q: any) => sum + (q.points ?? 5), 0)
        const completedAt = metadata?.endedAt || metadata?.publishedAt
        return {
          row,
          code: row.code,
          title: assessment?.title,
          completedAt,
          metadata,
          totalPossibleScore
        }
      })
      .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 6)

    let pastAssessments = sortedPast.map(p => ({
      code: p.code,
      title: p.title,
      participantCount: 0,
      avgScore: 0,
      completedAt: p.completedAt,
      metadata: p.metadata
    }))

    if (sortedPast.length) {
      const codes = sortedPast.map(p => p.code)
      const totalsByCode = new Map(sortedPast.map(p => [p.code, p.totalPossibleScore]))
      const { data: pastSessions, error: psErr } = await supabase
        .from('student_sessions')
        .select('assessment_code, score, completed, completed_at')
        .in('assessment_code', codes)

      if (psErr) {
        console.error('Supabase past student_sessions fetch error:', psErr)
      }

      const sessionsByCode = new Map<string, any[]>()
      for (const s of pastSessions || []) {
        const list = sessionsByCode.get(s.assessment_code) || []
        list.push(s)
        sessionsByCode.set(s.assessment_code, list)
      }

      pastAssessments = pastAssessments.map(pa => {
        const sess = sessionsByCode.get(pa.code) || []
        const participantCount = sess.length
        const completedOnly = sess.filter(s => s.completed && s.completed_at)
        const totalPossible = totalsByCode.get(pa.code) || 0
        const avgScore = completedOnly.length && totalPossible > 0
          ? Math.round(
              completedOnly.reduce((sum, s) => sum + ((s.score ?? 0) / totalPossible * 100), 0) / completedOnly.length
            )
          : 0
        return { ...pa, participantCount, avgScore }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        activeAssessments: activeAssessmentDetails,
        pastAssessments
      }
    })
  } catch (error: any) {
    console.error('Error fetching monitor data:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT endpoint to end an assessment
export async function PUT(request: NextRequest) {
  try {
    const { action, assessmentCode } = await request.json()

    const endOne = async (code: string) => {
      const nowIso = new Date().toISOString()

      // Fetch the existing row to merge JSON
      const { data: rows, error: fetchErr } = await supabase
        .from('assessments')
        .select('*')
        .eq('code', code)
        .limit(1)

      if (fetchErr) throw fetchErr
      const row = rows?.[0]
      if (!row) return

      const dataJson = row.data || {}
      const metadata = { ...(dataJson.metadata || {}), status: 'ended', endedAt: nowIso, endedBy: 'teacher' }
      const newData = { ...dataJson, metadata }

      const { error: updErr } = await supabase
        .from('assessments')
        .update({ data: newData })
        .eq('code', code)

      if (updErr) throw updErr

      // Mark all in-progress sessions as completed
      const { error: sessErr } = await supabase
        .from('student_sessions')
        .update({ completed: true, completed_at: nowIso })
        .eq('assessment_code', code)
        .eq('completed', false)

      if (sessErr) throw sessErr
    }

    if (action === 'endAssessment' && assessmentCode) {
      await endOne(assessmentCode.toUpperCase())
      return NextResponse.json({ success: true, message: 'Assessment ended successfully' })
    }

    if (action === 'endAllAssessments') {
      // Find all active assessments and end them
      let codes: string[] = []
      const { data: viewData } = await supabase.from('active_assessments').select('code')
      if (viewData?.length) {
        codes = viewData.map((r: any) => r.code)
      } else {
        const { data: allData } = await supabase.from('assessments').select('*')
        codes = (allData || [])
          .filter((row: any) => row?.data?.metadata?.status === 'active')
          .map((r: any) => r.code)
      }

      for (const code of codes) {
        await endOne(code)
      }

      return NextResponse.json({ success: true, message: 'All assessments ended successfully' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error updating assessments:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
