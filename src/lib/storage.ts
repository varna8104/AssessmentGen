// Shared in-memory storage for demo purposes
// In production, this would be a proper database

// Create a global variable to prevent multiple instances during development hot reload
declare global {
  var __published_assessments: Map<string, any> | undefined
}

export const publishedAssessments = globalThis.__published_assessments ?? new Map<string, any>()
globalThis.__published_assessments = publishedAssessments

export interface AssessmentRecord {
  id: string
  code: string
  assessment: {
    title: string
    description: string
    totalPoints: number
    estimatedTime: number
    questions: Array<{
      id: string
      type: string
      question: string
      options: string[]
      correctAnswer: string
      explanation: string
      points: number
      timeLimit: number
      difficulty: string
      topic?: string
    }>
  }
  metadata: {
    assessmentName: string
    assessmentType: string
    language: string
    difficulty?: string
    numberOfQuestions: number
    generatedAt: string
    source: string
    publishedAt: string
    status: string
    totalAttempts: number
  }
  students: Array<{
    sessionId: string
    studentName: string
    assessmentCode: string
    startedAt: string
    status: string
    answers: any[]
    score: number | null
    completedAt: string | null
  }>
}

// Initialize with sample assessment for testing - always ensure we have test data
if (publishedAssessments.size === 0) {
  console.log('🔄 Initializing storage with sample assessments...')
  
  const sampleAssessment = {
    id: 'sample-1',
    code: 'DFE7FU',
    assessment: {
      title: 'Python Programming Fundamentals',
      description: 'Test your knowledge of Python basics including variables, functions, and data structures.',
      totalPoints: 50,
      estimatedTime: 30,
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          question: 'What is the correct way to declare a variable in Python?',
          options: ['var x = 5', 'int x = 5', 'x = 5', 'declare x = 5'],
          correctAnswer: 'x = 5',
          explanation: 'In Python, variables are created when you assign a value to them. No explicit declaration is needed.',
          points: 5,
          timeLimit: 30,
          difficulty: 'Easy',
          topic: 'Variables'
        },
        {
          id: 'q2',
          type: 'mcq',
          question: 'Which of the following is a mutable data type in Python?',
          options: ['String', 'Tuple', 'List', 'Integer'],
          correctAnswer: 'List',
          explanation: 'Lists are mutable, meaning their contents can be changed after creation. Strings, tuples, and integers are immutable.',
          points: 5,
          timeLimit: 45,
          difficulty: 'Medium',
          topic: 'Data Types'
        }
      ]
    },
    metadata: {
      assessmentName: 'Python Programming Fundamentals',
      assessmentType: 'mcq',
      language: 'english',
      difficulty: 'Medium',
      numberOfQuestions: 2,
      generatedAt: new Date().toISOString(),
      source: 'AI Generation',
      publishedAt: new Date().toISOString(),
      status: 'active',
      totalAttempts: 0
    },
    students: []
  }

  const sampleAssessment2 = {
    id: 'sample-2',
    code: 'Q782AV',
    assessment: {
      title: 'JavaScript Fundamentals Quiz',
      description: 'Test your knowledge of JavaScript basics including variables, functions, arrays, and objects.',
      totalPoints: 30,
      estimatedTime: 20,
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          question: 'What is the correct way to declare a variable in JavaScript?',
          options: ['var myVar;', 'variable myVar;', 'v myVar;', 'declare myVar;'],
          correctAnswer: 'var myVar;',
          explanation: 'In JavaScript, variables are declared using the "var", "let", or "const" keywords.',
          points: 5,
          timeLimit: 30,
          difficulty: 'Easy',
          topic: 'Variables'
        },
        {
          id: 'q2',
          type: 'mcq',
          question: 'Which method is used to add an element to the end of an array?',
          options: ['push()', 'add()', 'insert()', 'append()'],
          correctAnswer: 'push()',
          explanation: 'The push() method adds one or more elements to the end of an array.',
          points: 5,
          timeLimit: 30,
          difficulty: 'Easy',
          topic: 'Arrays'
        },
        {
          id: 'q3',
          type: 'true-false',
          question: 'JavaScript is case-sensitive.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'JavaScript is case-sensitive, meaning "myVar" and "myvar" are different variables.',
          points: 5,
          timeLimit: 20,
          difficulty: 'Easy',
          topic: 'Language Features'
        }
      ]
    },
    metadata: {
      assessmentName: 'JavaScript Fundamentals Quiz',
      assessmentType: 'mixed',
      language: 'english',
      difficulty: 'Easy',
      numberOfQuestions: 3,
      generatedAt: new Date().toISOString(),
      source: 'AI Generation',
      publishedAt: new Date().toISOString(),
      status: 'active',
      totalAttempts: 0
    },
    students: []
  }

  const sampleAssessment3 = {
    id: 'sample-3',
    code: 'TEST01',
    assessment: {
      title: 'Quick Math Quiz',
      description: 'A simple math quiz to test basic arithmetic skills.',
      totalPoints: 20,
      estimatedTime: 10,
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          question: 'What is 5 + 3?',
          options: ['6', '7', '8', '9'],
          correctAnswer: '8',
          explanation: '5 + 3 = 8',
          points: 5,
          timeLimit: 30,
          difficulty: 'Easy',
          topic: 'Addition',
          media: {
            type: 'image',
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzRDQUY1MCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0cHgiPk1hdGggUHJvYmxlbTwvdGV4dD4KICA8dGV4dCB4PSI1MCUiIHk9IjY1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNnB4Ij41ICsgMyA9ID88L3RleHQ+Cjwvc3ZnPg=='
          }
        },
        {
          id: 'q2',
          type: 'true-false',
          question: '7 × 3 = 21',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: '7 × 3 equals 21',
          points: 5,
          timeLimit: 25,
          difficulty: 'Easy',
          topic: 'Multiplication'
        }
      ]
    },
    metadata: {
      assessmentName: 'Quick Math Quiz',
      assessmentType: 'mcq',
      language: 'english',
      difficulty: 'Easy',
      numberOfQuestions: 2,
      generatedAt: new Date().toISOString(),
      source: 'Manual Creation',
      publishedAt: new Date().toISOString(),
      status: 'active',
      totalAttempts: 0
    },
    students: []
  }

  // Add the sample assessments to storage
  publishedAssessments.set('DFE7FU', sampleAssessment)
  publishedAssessments.set('Q782AV', sampleAssessment2)
  
  // Force update TEST01 with media data
  publishedAssessments.set('TEST01', sampleAssessment3)

  // Add some mock student data to TEST01 for testing dynamic results
  const testAssessment = publishedAssessments.get('TEST01')
  if (testAssessment) {
    // Update the first question with media data for testing
    testAssessment.assessment.questions[0].media = {
      type: 'image',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzRDQUY1MCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0cHgiPk1hdGggUHJvYmxlbTwvdGV4dD4KICA8dGV4dCB4PSI1MCUiIHk9IjY1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNnB4Ij41ICsgMyA9ID88L3RleHQ+Cjwvc3ZnPg=='
    }
    
    testAssessment.students = [
      {
        sessionId: 'session_1',
        studentName: 'Alice Johnson',
        assessmentCode: 'TEST01',
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed',
        answers: ['8', 'True'],
        score: 10,
        accuracy: 100,
        timeSpent: 45,
        completedAt: new Date(Date.now() - 3500000).toISOString(),
        feedback: [
          { isCorrect: true, points: 5 },
          { isCorrect: true, points: 5 }
        ]
      },
      {
        sessionId: 'session_2',
        studentName: 'Bob Smith',
        assessmentCode: 'TEST01',
        startedAt: new Date(Date.now() - 3000000).toISOString(),
        status: 'completed',
        answers: ['8', 'False'],
        score: 5,
        accuracy: 50,
        timeSpent: 78,
        completedAt: new Date(Date.now() - 2900000).toISOString(),
        feedback: [
          { isCorrect: true, points: 5 },
          { isCorrect: false, points: 0 }
        ]
      },
      {
        sessionId: 'session_3',
        studentName: 'Charlie Brown',
        assessmentCode: 'TEST01',
        startedAt: new Date(Date.now() - 2400000).toISOString(),
        status: 'completed',
        answers: ['7', 'True'],
        score: 5,
        accuracy: 50,
        timeSpent: 62,
        completedAt: new Date(Date.now() - 2300000).toISOString(),
        feedback: [
          { isCorrect: false, points: 0 },
          { isCorrect: true, points: 5 }
        ]
      }
    ]
    publishedAssessments.set('TEST01', testAssessment)
  }

  console.log(`✅ Storage initialized with ${publishedAssessments.size} sample assessments`)
  console.log(`📋 Available codes: ${Array.from(publishedAssessments.keys()).join(', ')}`)
}