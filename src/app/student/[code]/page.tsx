'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Question {
  id: string
  type: string
  question: string
  options: string[]
  correctAnswer: string | string[];
  explanation: string
  points: number
  timeLimit: number
  difficulty: string
  topic?: string
  maxWords?: number
  media?: {
    type: 'image' | 'audio' | 'video'
    url: string
  }
}

interface Assessment {
  questions: Question[]
  title: string
  description: string
  totalPoints: number
  estimatedTime: number
}

export default function StudentAssessmentPage() {
  const params = useParams()
  const code = params.code as string

  // Get student name from URL parameters
  const [studentName, setStudentName] = useState('')
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const nameFromUrl = urlParams.get('name')
      if (nameFromUrl) {
        setStudentName(nameFromUrl)
      }
    }
  }, [])

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Array<{
    question: string
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean
    explanation: string
    timeSpent: number
    points: number
  }>>([])
  const [error, setError] = useState('')
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({})
  const [questionTimers, setQuestionTimers] = useState<Record<string, number>>({})
  const [timedOutQuestions, setTimedOutQuestions] = useState<Set<string>>(new Set())
  const [dynamicResults, setDynamicResults] = useState<any>(null)
  const [loadingResults, setLoadingResults] = useState(false)
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0)
  const [questionTimer, setQuestionTimer] = useState<number>(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [previousStudentCount, setPreviousStudentCount] = useState<number>(0)
  const [newStudentsAdded, setNewStudentsAdded] = useState<number>(0)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!code) return

    // Load assessment by code
    const loadAssessment = async () => {
      try {
        const response = await fetch(`/api/student/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            assessmentCode: code,
            studentName: studentName
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setAssessment(data.assessment)
          setTimeLeft(data.assessment.estimatedTime * 60) // Convert to seconds
          setQuestionStartTime(Date.now())
        } else {
          setError(data.message || 'Assessment not found')
        }
      } catch (error) {
        setError('Failed to load assessment')
      } finally {
        setLoading(false)
      }
    }

    // Load assessment once we have both code and studentName
    if (studentName) {
      loadAssessment()
    }
  }, [code, studentName])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit() // Auto-submit when time runs out
    }
  }, [timeLeft, isSubmitted])

  // Individual question timer
  useEffect(() => {
    if (currentQuestion >= 0 && assessment && !isSubmitted) {
      const currentQ = assessment.questions[currentQuestion]
      if (currentQ) {
        // Resume from saved timer or start fresh
        const savedTime = questionTimers[currentQ.id] || 0
        setQuestionTimer(savedTime)
        
        // Don't start timer if question already timed out
        if (timedOutQuestions.has(currentQ.id)) {
          return
        }
        
        const timer = setInterval(() => {
          setQuestionTimer(prev => {
            const newTime = prev + 1
            
            // Update saved timers
            setQuestionTimers(prevTimers => ({
              ...prevTimers,
              [currentQ.id]: newTime
            }))
            
            if (newTime >= currentQ.timeLimit) {
              // Mark question as timed out
              setTimedOutQuestions(prevSet => {
                const newSet = new Set(prevSet)
                newSet.add(currentQ.id)
                return newSet
              })
              return newTime // Don't increment further
            }
            return newTime
          })
        }, 1000)
        
        return () => clearInterval(timer)
      }
    }
  }, [currentQuestion, assessment, isSubmitted, questionTimers, timedOutQuestions])

  const handleAnswerSelect = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const navigateToQuestion = (questionIndex: number) => {
    if (questionIndex === currentQuestion) return
    
    // Record time spent on current question before switching
    const timeSpent = Date.now() - questionStartTime
    const currentQ = assessment?.questions[currentQuestion]
    if (currentQ) {
      setQuestionTimes(prev => ({ ...prev, [currentQ.id]: (prev[currentQ.id] || 0) + timeSpent }))
    }
    
    setCurrentQuestion(questionIndex)
    setQuestionStartTime(Date.now())
  }

  const handleNext = () => {
    if (currentQuestion < (assessment?.questions.length || 0) - 1) {
      // Record time spent on current question
      const timeSpent = Date.now() - questionStartTime
      const currentQ = assessment?.questions[currentQuestion]
      if (currentQ) {
        setQuestionTimes(prev => ({ ...prev, [currentQ.id]: (prev[currentQ.id] || 0) + timeSpent }))
      }
      
      setCurrentQuestion(currentQuestion + 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      // Record time spent on current question
      const timeSpent = Date.now() - questionStartTime
      const currentQ = assessment?.questions[currentQuestion]
      if (currentQ) {
        setQuestionTimes(prev => ({ ...prev, [currentQ.id]: (prev[currentQ.id] || 0) + timeSpent }))
      }
      
      setCurrentQuestion(currentQuestion - 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handleSubmit = async () => {
    if (!assessment) return

    // Record final question time
    const finalTimeSpent = Date.now() - questionStartTime
    const currentQ = assessment.questions[currentQuestion]
    if (currentQ) {
      setQuestionTimes(prev => ({ ...prev, [currentQ.id]: (prev[currentQ.id] || 0) + finalTimeSpent }))
    }

    // Calculate total time spent
    const totalTime = Math.round((assessment.estimatedTime * 60 - timeLeft))
    setTotalTimeSpent(totalTime)

    try {
      // Submit to server for dynamic results
      const response = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentCode: code,
          studentName: studentName,
          answers: answers,
          timeSpent: totalTime,
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
      })

      const data = await response.json()

      if (data.success) {
        // Use server response for scoring
        setScore(data.result.score)
        setFeedback(data.result.feedback.map((item: any, index: number) => ({
          question: item.question,
          userAnswer: item.userAnswer,
          correctAnswer: item.correctAnswer,
          isCorrect: item.isCorrect,
          explanation: item.explanation,
          timeSpent: Math.round((questionTimes[assessment.questions[index].id] || 0) / 1000),
          points: item.points
        })))
      } else {
        // Fallback to client-side scoring
        let totalScore = 0
        const feedbackData = assessment.questions.map(question => {
          const userAnswer = answers[question.id] || ''
          let isCorrect = false;
          if (Array.isArray(question.correctAnswer) && Array.isArray(userAnswer)) {
            isCorrect = question.correctAnswer.every((ans, idx) => ans === userAnswer[idx]);
          } else {
            isCorrect = userAnswer === question.correctAnswer;
          }
          const pointsEarned = isCorrect ? question.points : 0
          totalScore += pointsEarned
          return {
            question: question.question,
            userAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect,
            explanation: question.explanation,
            timeSpent: Math.round((questionTimes[question.id] || 0) / 1000),
            points: pointsEarned
          }
        })

        setScore(totalScore)
        setFeedback(feedbackData)
      }
    } catch (error) {
      console.error('Error submitting assessment:', error)
      // Fallback to client-side scoring on error
      let totalScore = 0
      const feedbackData = assessment.questions.map(question => {
        const userAnswer = answers[question.id] || ''
        let isCorrect = false;
        if (Array.isArray(question.correctAnswer) && Array.isArray(userAnswer)) {
          isCorrect = question.correctAnswer.every((ans, idx) => ans === userAnswer[idx]);
        } else {
          isCorrect = userAnswer === question.correctAnswer;
        }
        const pointsEarned = isCorrect ? question.points : 0
        totalScore += pointsEarned
        return {
          question: question.question,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
          timeSpent: Math.round((questionTimes[question.id] || 0) / 1000),
          points: pointsEarned
        }
      })

      setScore(totalScore)
      setFeedback(feedbackData)
    }

    setIsSubmitted(true)
    
    // Fetch dynamic results
    fetchDynamicResults()
    
    // Initialize the student count for tracking new submissions
    if (dynamicResults?.students) {
      setPreviousStudentCount(dynamicResults.students.length)
    }
  }

  const fetchDynamicResults = async () => {
    setLoadingResults(true)
    try {
      const response = await fetch(`/api/student/results?code=${code}&student=${encodeURIComponent(studentName)}`)
      const data = await response.json()
      
      if (data.success) {
        const currentStudentCount = data.students?.length || 0
        
        // Check if new students were added
        if (previousStudentCount > 0 && currentStudentCount > previousStudentCount) {
          const newCount = currentStudentCount - previousStudentCount
          setNewStudentsAdded(newCount)
          
          // Clear the notification after 5 seconds
          setTimeout(() => setNewStudentsAdded(0), 5000)
        }
        
        setPreviousStudentCount(currentStudentCount)
        setDynamicResults(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching dynamic results:', error)
    } finally {
      setLoadingResults(false)
    }
  }

  // Auto-refresh rankings every 10 seconds to show new students
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    
    if (isSubmitted && dynamicResults) {
      // Start polling for new results every 10 seconds
      intervalId = setInterval(() => {
        fetchDynamicResults()
      }, 10000) // 10 seconds
    }

    // Cleanup interval on unmount or when conditions change
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isSubmitted, dynamicResults, code, studentName])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // This function is no longer needed since name comes from homepage
  }

  const getProgressPercentage = () => {
    if (!assessment) return 0
    return ((currentQuestion + 1) / assessment.questions.length) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center fade-in">
        <div className="text-center slide-up">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4 spinner-glow"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center fade-in">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 scale-in">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Assessment Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 btn-transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!assessment) return null

  // Results view after submission
  if (isSubmitted) {
    const correctAnswers = feedback.filter(f => f.isCorrect).length
    const accuracy = Math.round((correctAnswers / assessment.questions.length) * 100)
    const totalPossiblePoints = assessment.totalPoints
    const averageTimePerQuestion = Math.round(totalTimeSpent / assessment.questions.length)
    
    // Generate dynamic ranking data
    const rankingStudents = dynamicResults?.students || []
    const currentStudentRank = dynamicResults?.currentStudent?.rank || rankingStudents.length + 1

    // Group feedback by topic for category analysis
    const topicStats: Record<string, { correct: number; total: number; points: number; time: number }> = {}
    
    feedback.forEach((item, index) => {
      const question = assessment.questions[index]
      const topic = question.topic || 'General'
      
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0, points: 0, time: 0 }
      }
      
      topicStats[topic].total += 1
      topicStats[topic].time += item.timeSpent
      if (item.isCorrect) {
        topicStats[topic].correct += 1
        topicStats[topic].points += question.points
      }
    })

    return (
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-3 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  🏆
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Assessment Complete!</h1>
                  <p className="text-sm sm:text-base text-gray-600">Code: {code}</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 text-gray-600 hover:text-gray-800 transition-colors mobile-tap-target rounded-lg hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm sm:text-base">Back to Home</span>
              </button>
            </div>
          </div>

          {/* Overall Performance Card - Mobile Responsive */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 sm:p-6 mb-3 sm:mb-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Overall Performance</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="text-center p-2 sm:p-0">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">{accuracy}%</div>
                <div className="text-xs sm:text-sm text-gray-600">Accuracy</div>
                <div className={`text-xs font-medium ${
                  accuracy >= 90 ? 'text-green-600' : 
                  accuracy >= 80 ? 'text-blue-600' : 
                  accuracy >= 70 ? 'text-yellow-600' : 
                  accuracy >= 60 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {accuracy >= 90 ? 'Excellent' : 
                   accuracy >= 80 ? 'Very Good' : 
                   accuracy >= 70 ? 'Good' : 
                   accuracy >= 60 ? 'Fair' : 'Needs Improvement'}
                </div>
              </div>
              
              <div className="text-center p-2 sm:p-0">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">{correctAnswers}/{assessment.questions.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Correct Answers</div>
                <div className="text-xs text-gray-500">{assessment.questions.length - correctAnswers} of {assessment.questions.length} attempted</div>
              </div>
              
              <div className="text-center p-2 sm:p-0">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">{score || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">out of {totalPossiblePoints}</div>
                <div className="text-xs text-gray-500">Points Earned</div>
              </div>
              
              <div className="text-center p-2 sm:p-0">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">{formatTime(totalTimeSpent)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Time</div>
                <div className="text-xs text-gray-500">{assessment.questions.length} of {assessment.questions.length} attempted</div>
              </div>
              
              <div className="text-center p-2 sm:p-0 col-span-2 sm:col-span-3 lg:col-span-1">
                <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">#{currentStudentRank}</div>
                <div className="text-xs sm:text-sm text-gray-600">Your Rank</div>
                <div className="text-xs text-gray-500">Class position</div>
              </div>
            </div>
          </div>

          {/* Class Ranking - Mobile Responsive */}
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-3 sm:mb-6">
            {/* New Students Notification */}
            {newStudentsAdded > 0 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-pulse">
                <div className="flex items-center gap-2 text-green-800">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-sm">
                    {newStudentsAdded === 1 
                      ? '1 new student completed the assessment!' 
                      : `${newStudentsAdded} new students completed the assessment!`
                    }
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Class Ranking ({rankingStudents.length} students)
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live updates</span>
                  </div>
                  {lastUpdated && (
                    <span className="hidden sm:inline">• Updated {lastUpdated.toLocaleTimeString()}</span>
                  )}
                </div>
                <button
                  onClick={fetchDynamicResults}
                  disabled={loadingResults}
                  className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 btn-transition mobile-tap-target px-2 py-1 rounded"
                  title="Refresh rankings"
                >
                  <svg className={`w-4 h-4 ${loadingResults ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loadingResults ? 'Updating...' : 'Refresh'}
                </button>
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {loadingResults ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : rankingStudents.length > 0 ? (
                rankingStudents.map((student: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg transition-colors ${
                      student.name === studentName
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                        student.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        student.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        student.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        #{student.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate text-sm sm:text-base">
                          {student.name || 'Anonymous Student'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {student.correctAnswers}/{student.totalQuestions} correct • {formatTime(student.timeSpent)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-lg sm:text-xl font-bold text-gray-900">{student.score}</div>
                      <div className="text-xs sm:text-sm text-gray-600">out of {totalPossiblePoints}</div>
                      <div className="text-xs text-gray-500 hidden sm:block">{student.accuracy}% accuracy</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-sm sm:text-base">You&apos;re the first to complete this assessment!</p>
                  <p className="text-xs sm:text-sm">Results will update as more students finish.</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Charts - Mobile Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-6">
            {/* Points by Category */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Points by Category</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {Object.entries(topicStats).map(([topic, stats], index) => {
                  const maxPoints = Math.max(...Object.values(topicStats).map(s => s.points))
                  const percentage = maxPoints > 0 ? (stats.points / maxPoints) * 100 : 0
                  
                  return (
                    <div key={topic} className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="font-medium text-gray-700 truncate mr-2">{topic}</span>
                        <span className="text-gray-600 flex-shrink-0">{stats.points} pts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8 flex-shrink-0">{Math.round(percentage)}%</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Max: {maxPoints} • Earned: <span className="text-green-600 font-medium">{stats.points}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Time by Category */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Time by Category</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {Object.entries(topicStats).map(([topic, stats], index) => {
                  const maxTime = Math.max(...Object.values(topicStats).map(s => s.time))
                  const percentage = maxTime > 0 ? (stats.time / maxTime) * 100 : 0
                  
                  return (
                    <div key={topic} className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="font-medium text-gray-700 truncate mr-2">{topic}</span>
                        <span className="text-gray-600 flex-shrink-0">{stats.time}s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8 flex-shrink-0">{Math.round(percentage)}%</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Average Time (seconds)
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Detailed Question Breakdown - Mobile Responsive */}
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-3 sm:mb-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Detailed Question Breakdown ({feedback.length} questions total)</h3>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {feedback.map((item, index) => {
                const question = assessment.questions[index]
                return (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isCorrect ? (
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Q{index + 1}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">{question.topic || 'General'}</span>
                          <span className="flex-shrink-0">{question.points} pts</span>
                          <span className={`px-2 py-1 rounded flex-shrink-0 ${
                            question.difficulty.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                            question.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-right">
                        <div className="flex items-center text-gray-500 justify-end sm:justify-start">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs sm:text-sm">0:{item.timeSpent.toString().padStart(2, '0')}</span>
                        </div>
                        <div className={`text-xs sm:text-sm font-medium ${item.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {item.isCorrect ? `+${item.points} pts` : '0 pts'}
                        </div>
                      </div>
                    </div>

                    {/* Show "View Correct Answer" button for wrong answers */}
                    {!item.isCorrect && (
                      <div className="px-3 pb-3">
                        <button
                          onClick={() => setShowCorrectAnswers(prev => ({
                            ...prev,
                            [index]: !prev[index]
                          }))}
                          className="w-full sm:w-auto px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-medium mobile-tap-target"
                        >
                          {showCorrectAnswers[index] ? 'Hide Correct Answer' : 'View Correct Answer'}
                        </button>
                      </div>
                    )}

                    {/* Show correct answer details when toggled */}
                    {!item.isCorrect && showCorrectAnswers[index] && (
                      <div className="border-t border-gray-100 bg-gray-50 p-3">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs sm:text-sm font-medium text-gray-800 mb-2">Question:</h4>
                            <p className="text-xs sm:text-sm text-gray-700">{item.question}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <h4 className="text-xs sm:text-sm font-medium text-red-700 mb-1">Your Answer:</h4>
                              <p className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                                {item.userAnswer || 'No answer provided'}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="text-xs sm:text-sm font-medium text-green-700 mb-1">Correct Answer:</h4>
                              <p className="text-xs sm:text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2">
                                {item.correctAnswer}
                              </p>
                            </div>
                          </div>

                          {item.explanation && (
                            <div>
                              <h4 className="text-xs sm:text-sm font-medium text-gray-800 mb-1">Explanation:</h4>
                              <p className="text-xs sm:text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded p-2">
                                {item.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Time Analysis - Mobile Responsive */}
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-3 sm:mb-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Time Analysis</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">0:{averageTimePerQuestion.toString().padStart(2, '0')}</div>
                <div className="text-xs sm:text-sm text-gray-600">Average per Question</div>
                <div className="text-xs text-gray-500">Based on {assessment.questions.length} attempted</div>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                  {Math.min(...feedback.map(f => f.timeSpent)) > 0 ? 
                    `0:${Math.min(...feedback.map(f => f.timeSpent)).toString().padStart(2, '0')}` : 
                    '0:00'}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Fastest Answer</div>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-1">
                  0:{Math.max(...feedback.map(f => f.timeSpent)).toString().padStart(2, '0')}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Slowest Answer</div>
              </div>
            </div>
          </div>

          {/* Areas for Improvement - Mobile Responsive */}
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-3 sm:mb-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Areas for Improvement</h3>
            </div>
            
            {Object.entries(topicStats).filter(([_, stats]) => stats.correct / stats.total < 1).length > 0 ? 
              Object.entries(topicStats).filter(([_, stats]) => stats.correct / stats.total < 1).map(([topic, stats]) => (
                <div key={topic} className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-medium text-red-900 mb-1">{topic}</h4>
                      <p className="text-xs sm:text-sm text-red-800 mb-3">
                        Accuracy: {Math.round((stats.correct / stats.total) * 100)}% • Avg time: 0:{Math.round(stats.time / stats.total).toString().padStart(2, '0')} • {stats.total * 5} points lost
                      </p>
                      <div>
                        <div className="text-xs sm:text-sm font-medium text-blue-900 mb-2">Recommendations:</div>
                        <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                          <li>• Review fundamental concepts in weak categories</li>
                          <li>• Practice similar questions to improve speed and accuracy</li>
                          <li>• Focus on time management for better performance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )) :
              <div className="text-center py-6 sm:py-8">
                <div className="text-3xl sm:text-4xl mb-2">🎯</div>
                <p className="text-sm sm:text-base text-gray-600 font-medium">Great job! Perfect scores across all topics!</p>
                <p className="text-xs sm:text-sm text-gray-500">You&apos;ve mastered all the areas covered in this assessment.</p>
              </div>
            }
          </div>

          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pb-6 sm:pb-8 slide-up" style={{ animationDelay: '0.5s' }}>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 btn-transition mobile-tap-target text-sm sm:text-base"
            >
              Take Another Assessment
            </button>
            <button className="px-4 sm:px-6 py-2 sm:py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 btn-transition mobile-tap-target text-sm sm:text-base">
              Download Results
            </button>
          </div>

          {/* Assessment Summary Footer - Mobile Responsive */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>Assessment Summary:</strong> You answered {assessment.questions.length} out of {assessment.questions.length} questions, with {correctAnswers} correct answers giving you an accuracy of {accuracy}% (max possible: 100%) and {score || 0} points (max possible: {totalPossiblePoints}).
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = assessment.questions[currentQuestion]
  const isCurrentQuestionTimedOut = currentQ ? timedOutQuestions.has(currentQ.id) : false
  
  if (!currentQ) return null

  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex justify-between items-center slide-up">
          <div className="flex items-center gap-4">
            <button className="flex items-center text-gray-600 hover:text-gray-800 btn-transition">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="font-semibold text-gray-900">Assessment</h1>
              <p className="text-sm text-gray-500">Code: {code} • {studentName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`font-mono transition-colors duration-300 ${timeLeft < 60 ? 'text-red-600 timer-pulse' : 'text-gray-900'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {assessment.questions.length}
            </span>
          </div>
        </div>

        {/* Progress indicators - Mobile Responsive */}
        <div className="flex justify-center mb-3 sm:mb-4 slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-1">
            {assessment.questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentQuestion
                    ? 'bg-pink-500'
                    : index < currentQuestion
                    ? 'bg-gray-400'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation arrows - Mobile Responsive */}
        <div className="flex justify-between items-center mb-3 slide-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center text-gray-400 disabled:opacity-30 btn-transition text-xs sm:text-sm mobile-tap-target px-2 py-1 rounded"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentQuestion === assessment.questions.length - 1}
            className="flex items-center text-gray-800 disabled:opacity-30 btn-transition text-xs sm:text-sm mobile-tap-target px-2 py-1 rounded"
          >
            Next
            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Question Card - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 relative card-transition slide-up max-h-[70vh] sm:max-h-[75vh] overflow-auto" style={{ animationDelay: '0.3s' }}>
          {/* Time Up Overlay */}
          {isCurrentQuestionTimedOut && (
            <div className="absolute inset-0 bg-red-50 bg-opacity-95 rounded-lg flex items-center justify-center z-10 scale-in">
              <div className="text-center p-6 sm:p-8">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⏰</div>
                <h3 className="text-lg sm:text-2xl font-bold text-red-600 mb-2">Time&apos;s Up!</h3>
                <p className="text-sm sm:text-base text-red-500 mb-4">You can no longer answer this question.</p>
                <button
                  onClick={() => {
                    if (currentQuestion < assessment.questions.length - 1) {
                      handleNext()
                    } else {
                      handleSubmit()
                    }
                  }}
                  className="px-4 sm:px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 btn-transition font-medium text-sm sm:text-base mobile-tap-target"
                >
                  {currentQuestion < assessment.questions.length - 1 ? 'Move to Next Question' : 'Submit Assessment'}
                </button>
              </div>
            </div>
          )}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Question {currentQuestion + 1}</h2>
                <div className="relative">
                  {/* Circular Progress Ring */}
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 transform -rotate-90" viewBox="0 0 48 48">
                    {/* Background circle */}
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - Math.max(0, currentQ.timeLimit - questionTimer) / currentQ.timeLimit)}`}
                      className={`transition-all duration-500 ${
                        Math.max(0, currentQ.timeLimit - questionTimer) / currentQ.timeLimit > 0.6 ? 'text-green-500' :
                        Math.max(0, currentQ.timeLimit - questionTimer) / currentQ.timeLimit > 0.3 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}
                    />
                  </svg>
                  {/* Timer text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs font-bold text-gray-800">
                      {Math.floor(Math.max(0, currentQ.timeLimit - questionTimer) / 60)}:{Math.max(0, Math.max(0, currentQ.timeLimit - questionTimer) % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {currentQ.topic || 'General'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentQ.difficulty.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                  currentQ.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQ.difficulty}
                </span>
                <span className="text-xs text-gray-600 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {currentQ.points} pts
                </span>
              </div>
            </div>
            
            {/* Auto-saving indicator moved inside question card - Mobile Responsive */}
            <div className="text-center mb-3">
              <div className="text-xs text-green-600 mb-1">Auto-saving your answers</div>
              <div className="text-xs text-gray-400">Swipe to navigate</div>
            </div>
            
            <h3 className="text-base sm:text-lg text-gray-900 leading-relaxed mb-3 sm:mb-4">{currentQ.question}</h3>

            {/* Display media if available */}
            {(() => {
              if (currentQ.media) {
                console.log('Media data:', currentQ.media)
              }
              return null
            })()}
            {currentQ.media && (
              <div className="mb-3 sm:mb-4 bg-gray-50 rounded-lg p-2 sm:p-3">
                {currentQ.media.type === 'image' && (
                  <div className="text-center">
                    <img 
                      src={currentQ.media.url} 
                      alt="Question illustration" 
                      className="max-w-full h-auto mx-auto rounded-lg border shadow-sm"
                      style={{ maxHeight: '150px' }}
                      onLoad={() => console.log('Image loaded successfully')}
                      onError={(e) => console.log('Image failed to load:', e)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Question Image</p>
                  </div>
                )}
                {currentQ.media.type === 'audio' && (
                  <div className="text-center">
                    <audio 
                      controls 
                      src={currentQ.media.url}
                      className="mx-auto w-full max-w-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Question Audio</p>
                  </div>
                )}
                {currentQ.media.type === 'video' && (
                  <div className="text-center">
                    <video 
                      controls 
                      src={currentQ.media.url}
                      className="max-w-full h-auto mx-auto rounded-lg"
                      style={{ maxHeight: '150px' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Question Video</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Answer Selection - Mobile Responsive */}
          <div className="mb-3 sm:mb-4">
            {currentQ.type === 'true-false' ? (
              <div>
                <p className="text-gray-700 mb-3 text-xs sm:text-sm font-medium">Select True or False:</p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={() => !isCurrentQuestionTimedOut && handleAnswerSelect(currentQ.id, 'True')}
                    disabled={isCurrentQuestionTimedOut}
                    className={`p-2 sm:p-3 rounded-lg border-2 btn-transition flex items-center justify-center gap-2 text-sm sm:text-base mobile-tap-target ${
                      isCurrentQuestionTimedOut 
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                        : answers[currentQ.id] === 'True'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                      answers[currentQ.id] === 'True' ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      {answers[currentQ.id] === 'True' && (
                        <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">True</span>
                  </button>
                  
                  <button
                    onClick={() => !isCurrentQuestionTimedOut && handleAnswerSelect(currentQ.id, 'False')}
                    disabled={isCurrentQuestionTimedOut}
                    className={`p-2 sm:p-3 rounded-lg border-2 btn-transition flex items-center justify-center gap-2 text-sm sm:text-base mobile-tap-target ${
                      isCurrentQuestionTimedOut 
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                        : answers[currentQ.id] === 'False'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                      answers[currentQ.id] === 'False' ? 'bg-red-500' : 'bg-gray-200'
                    }`}>
                      {answers[currentQ.id] === 'False' && (
                        <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">False</span>
                  </button>
                </div>
              </div>
            ) : currentQ.type === 'open-text' ? (
              <div>
                <p className="text-gray-700 mb-3 text-xs sm:text-sm font-medium">Write your answer:</p>
                <textarea
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => !isCurrentQuestionTimedOut && handleAnswerSelect(currentQ.id, e.target.value)}
                  disabled={isCurrentQuestionTimedOut}
                  placeholder="Type your answer here..."
                  className={`w-full p-3 rounded-lg border-2 resize-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 ${
                    isCurrentQuestionTimedOut 
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  rows={6}
                  maxLength={currentQ.maxWords ? currentQ.maxWords * 6 : 1200}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {currentQ.maxWords ? `Maximum ${currentQ.maxWords} words` : 'Maximum 200 words'}
                  {answers[currentQ.id] && (
                    <span className="ml-2">
                      {(() => {
                        const ans = answers[currentQ.id];
                        if (typeof ans === 'string') {
                          return `(${ans.trim().split(/\s+/).length} words)`;
                        } else if (Array.isArray(ans)) {
                          const joined = ans.join(' ');
                          return `(${joined.trim().split(/\s+/).length} words)`;
                        }
                        return '';
                      })()}
                    </span>
                  )}
                </div>
              </div>
            ) : currentQ.type === 'fill-in-blanks' || currentQ.type === 'fill-blanks' ? (
              <div>
                <p className="text-gray-700 mb-3 text-xs sm:text-sm font-medium">Fill in the blanks:</p>
                <div className="space-y-3">
                  {(currentQ.correctAnswer && Array.isArray(currentQ.correctAnswer) ? currentQ.correctAnswer : ['answer']).map((_, blankIndex) => (
                    <div key={blankIndex}>
                      <label className="text-xs text-gray-600 mb-1 block">
                        Blank {blankIndex + 1}:
                      </label>
                      <input
                        type="text"
                        value={(answers[currentQ.id] && Array.isArray(answers[currentQ.id]) ? answers[currentQ.id][blankIndex] : '') || ''}
                        onChange={(e) => {
                          if (isCurrentQuestionTimedOut) return
                          let currentAnswers: string[] = [];
                          if (Array.isArray(answers[currentQ.id])) {
                            currentAnswers = [...(answers[currentQ.id] as string[])];
                          } else if (typeof answers[currentQ.id] === 'string') {
                            currentAnswers = [];
                          }
                          currentAnswers[blankIndex] = e.target.value;
                          handleAnswerSelect(currentQ.id, currentAnswers);
                        }}
                        disabled={isCurrentQuestionTimedOut}
                        placeholder={`Enter answer for blank ${blankIndex + 1}`}
                        className={`w-full p-2 sm:p-3 rounded-lg border-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 ${
                          isCurrentQuestionTimedOut 
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 mb-3 text-xs sm:text-sm font-medium">Select your answer:</p>
                <div className="grid grid-cols-1 gap-2">
                  {(currentQ.options || []).map((option, index) => {
                    const selectedColors = [
                      'border-blue-500 bg-blue-50',
                      'border-green-500 bg-green-50',
                      'border-purple-500 bg-purple-50', 
                      'border-orange-500 bg-orange-50'
                    ]
                    
                    return (
                      <button
                        key={index}
                        onClick={() => !isCurrentQuestionTimedOut && handleAnswerSelect(currentQ.id, option)}
                        disabled={isCurrentQuestionTimedOut}
                        className={`w-full p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 text-left flex items-center gap-2 sm:gap-3 mobile-tap-target ${
                          isCurrentQuestionTimedOut 
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                            : answers[currentQ.id] === option
                            ? selectedColors[index % selectedColors.length]
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full border-2 border-gray-300 font-medium text-gray-600 text-xs sm:text-sm">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-gray-800 flex-1 text-xs sm:text-sm">{option}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions - Mobile Responsive */}
          <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              {(() => {
                const answer = answers[currentQ.id]
                if (!answer) return 'No answer provided'
                
                if (currentQ.type === 'open-text') {
                  if (typeof answer === 'string') {
                    return answer.trim() ? `Answer provided (${answer.trim().split(/\s+/).length} words)` : 'No answer provided';
                  } else if (Array.isArray(answer)) {
                    const joined = answer.join(' ');
                    return joined.trim() ? `Answer provided (${joined.trim().split(/\s+/).length} words)` : 'No answer provided';
                  }
                  return 'No answer provided';
                }
                
                if (currentQ.type === 'fill-in-blanks' || currentQ.type === 'fill-blanks') {
                  const filledBlanks = Array.isArray(answer) ? answer.filter(a => a && typeof a === 'string' && a.trim()).length : 0;
                  const totalBlanks = (currentQ.correctAnswer && Array.isArray(currentQ.correctAnswer) ? currentQ.correctAnswer.length : 1);
                  return `${filledBlanks}/${totalBlanks} blanks filled`;
                }
                
                return 'Answer selected'
              })()}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: '' }))}
                className="px-2 sm:px-3 py-1 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 btn-transition text-xs sm:text-sm mobile-tap-target"
              >
                Clear
              </button>
              
              {currentQuestion === assessment.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="px-3 sm:px-4 py-1 bg-pink-500 text-white rounded-lg hover:bg-pink-600 btn-transition font-medium text-xs sm:text-sm mobile-tap-target"
                >
                  Submit
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-3 sm:px-4 py-1 bg-pink-500 text-white rounded-lg hover:bg-pink-600 btn-transition font-medium text-xs sm:text-sm mobile-tap-target"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
