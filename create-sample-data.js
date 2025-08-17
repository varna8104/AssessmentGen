const fs = require('fs');
const path = require('path');

// Create data directory
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Sample assessments
const assessments = [
  {
    code: 'MATH123',
    title: 'Mathematics - Basic Algebra',
    description: 'Test your understanding of basic algebraic concepts',
    questions: [
      {
        id: 'q1',
        question: 'What is 2x + 3 = 11?',
        type: 'mcq',
        options: ['x = 4', 'x = 5', 'x = 6', 'x = 3'],
        correctAnswer: 'x = 4',
        points: 10,
        timeLimit: 30,
        difficulty: 'Easy'
      },
      {
        id: 'q2',
        question: 'Solve: 3(x - 2) = 15',
        type: 'mcq',
        options: ['x = 7', 'x = 5', 'x = 9', 'x = 6'],
        correctAnswer: 'x = 7',
        points: 10,
        timeLimit: 45,
        difficulty: 'Medium'
      },
      {
        id: 'q3',
        question: 'What is the value of x in 2x² - 8 = 0?',
        type: 'mcq',
        options: ['x = ±2', 'x = ±4', 'x = 4', 'x = 2'],
        correctAnswer: 'x = ±2',
        points: 15,
        timeLimit: 60,
        difficulty: 'Hard'
      }
    ],
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    isActive: true,
    metadata: {
      totalPoints: 35,
      totalQuestions: 3,
      publishedAt: new Date(Date.now() - 1800000).toISOString()
    }
  },
  {
    code: 'PHYS456',
    title: 'Physics - Motion and Forces',
    description: 'Understanding basic physics concepts',
    questions: [
      {
        id: 'q1',
        question: 'What is Newton\'s first law of motion?',
        type: 'mcq',
        options: ['F = ma', 'An object at rest stays at rest', 'For every action there is reaction', 'Energy is conserved'],
        correctAnswer: 'An object at rest stays at rest',
        points: 10,
        timeLimit: 30,
        difficulty: 'Easy'
      },
      {
        id: 'q2',
        question: 'If a car accelerates at 5 m/s² for 10 seconds, starting from rest, what is its final velocity?',
        type: 'mcq',
        options: ['25 m/s', '50 m/s', '15 m/s', '30 m/s'],
        correctAnswer: '50 m/s',
        points: 15,
        timeLimit: 45,
        difficulty: 'Medium'
      }
    ],
    createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    isActive: true,
    metadata: {
      totalPoints: 25,
      totalQuestions: 2,
      publishedAt: new Date(Date.now() - 900000).toISOString()
    }
  },
  {
    code: 'HIST789',
    title: 'World History Quiz',
    description: 'Test your knowledge of world history',
    questions: [
      {
        id: 'q1',
        question: 'When did World War II end?',
        type: 'mcq',
        options: ['1944', '1945', '1946', '1943'],
        correctAnswer: '1945',
        points: 10,
        timeLimit: 30,
        difficulty: 'Easy'
      }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    isActive: false,
    metadata: {
      totalPoints: 10,
      totalQuestions: 1,
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      endedAt: new Date(Date.now() - 82800000).toISOString() // Ended 1 hour after
    }
  }
];

// Sample student sessions
const studentSessions = [
  // Active students for MATH123
  {
    assessmentCode: 'MATH123',
    studentName: 'Sarah Chen',
    startedAt: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    completedAt: null,
    currentQuestion: 3,
    totalQuestions: 3,
    score: 25, // 25 out of 35 points
    answers: [{ questionId: 'q1', answer: 'x = 4', correct: true }, { questionId: 'q2', answer: 'x = 7', correct: true }],
    timeRemaining: 180, // 3 minutes left
    isActive: true
  },
  {
    assessmentCode: 'MATH123',
    studentName: 'Alex Johnson',
    startedAt: new Date(Date.now() - 1200000).toISOString(), // 20 min ago
    completedAt: null,
    currentQuestion: 2,
    totalQuestions: 3,
    score: 20, // 20 out of 35 points so far
    answers: [{ questionId: 'q1', answer: 'x = 4', correct: true }, { questionId: 'q2', answer: 'x = 7', correct: true }],
    timeRemaining: 240, // 4 minutes left
    isActive: true
  },
  {
    assessmentCode: 'MATH123',
    studentName: 'Emma Davis',
    startedAt: new Date(Date.now() - 1500000).toISOString(), // 25 min ago
    completedAt: null,
    currentQuestion: 2,
    totalQuestions: 3,
    score: 10, // 10 out of 35 points so far
    answers: [{ questionId: 'q1', answer: 'x = 4', correct: true }],
    timeRemaining: 300, // 5 minutes left
    isActive: true
  },
  {
    assessmentCode: 'MATH123',
    studentName: 'James Wilson',
    startedAt: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    completedAt: null,
    currentQuestion: 1,
    totalQuestions: 3,
    score: 0, // Just started
    answers: [],
    timeRemaining: 420, // 7 minutes left
    isActive: true
  },
  // Completed students for MATH123
  {
    assessmentCode: 'MATH123',
    studentName: 'Michael Brown',
    startedAt: new Date(Date.now() - 2400000).toISOString(), // 40 min ago
    completedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    currentQuestion: 3,
    totalQuestions: 3,
    score: 35, // Perfect score
    answers: [
      { questionId: 'q1', answer: 'x = 4', correct: true },
      { questionId: 'q2', answer: 'x = 7', correct: true },
      { questionId: 'q3', answer: 'x = ±2', correct: true }
    ],
    timeRemaining: 0,
    isActive: false
  },
  {
    assessmentCode: 'MATH123',
    studentName: 'Lisa Wang',
    startedAt: new Date(Date.now() - 2100000).toISOString(), // 35 min ago
    completedAt: new Date(Date.now() - 1500000).toISOString(), // 25 min ago
    currentQuestion: 3,
    totalQuestions: 3,
    score: 25, // Good score
    answers: [
      { questionId: 'q1', answer: 'x = 5', correct: false },
      { questionId: 'q2', answer: 'x = 7', correct: true },
      { questionId: 'q3', answer: 'x = ±2', correct: true }
    ],
    timeRemaining: 0,
    isActive: false
  },
  {
    assessmentCode: 'MATH123',
    studentName: 'Robert Garcia',
    startedAt: new Date(Date.now() - 3000000).toISOString(), // 50 min ago
    completedAt: new Date(Date.now() - 2400000).toISOString(), // 40 min ago
    currentQuestion: 3,
    totalQuestions: 3,
    score: 20, // Decent score
    answers: [
      { questionId: 'q1', answer: 'x = 4', correct: true },
      { questionId: 'q2', answer: 'x = 5', correct: false },
      { questionId: 'q3', answer: 'x = ±2', correct: true }
    ],
    timeRemaining: 0,
    isActive: false
  },
  // Active students for PHYS456
  {
    assessmentCode: 'PHYS456',
    studentName: 'David Smith',
    startedAt: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    completedAt: null,
    currentQuestion: 2,
    totalQuestions: 2,
    score: 10, // 10 out of 25 points so far
    answers: [{ questionId: 'q1', answer: 'An object at rest stays at rest', correct: true }],
    timeRemaining: 300, // 5 minutes left
    isActive: true
  },
  {
    assessmentCode: 'PHYS456',
    studentName: 'Jennifer Lee',
    startedAt: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    completedAt: null,
    currentQuestion: 1,
    totalQuestions: 2,
    score: 0,
    answers: [],
    timeRemaining: 450, // 7.5 minutes left
    isActive: true
  },
  {
    assessmentCode: 'PHYS456',
    studentName: 'Kevin Park',
    startedAt: new Date(Date.now() - 800000).toISOString(), // 13 min ago
    completedAt: null,
    currentQuestion: 2,
    totalQuestions: 2,
    score: 15, // 15 out of 25 points so far
    answers: [{ questionId: 'q1', answer: 'An object at rest stays at rest', correct: true }],
    timeRemaining: 200, // 3.3 minutes left
    isActive: true
  },
  // Completed students for PHYS456
  {
    assessmentCode: 'PHYS456',
    studentName: 'Amanda Chen',
    startedAt: new Date(Date.now() - 1200000).toISOString(), // 20 min ago
    completedAt: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    currentQuestion: 2,
    totalQuestions: 2,
    score: 25, // Perfect score
    answers: [
      { questionId: 'q1', answer: 'An object at rest stays at rest', correct: true },
      { questionId: 'q2', answer: '50 m/s', correct: true }
    ],
    timeRemaining: 0,
    isActive: false
  },
  // Historical data for HIST789
  {
    assessmentCode: 'HIST789',
    studentName: 'John Anderson',
    startedAt: new Date(Date.now() - 85000000).toISOString(),
    completedAt: new Date(Date.now() - 84900000).toISOString(),
    currentQuestion: 1,
    totalQuestions: 1,
    score: 10,
    answers: [{ questionId: 'q1', answer: '1945', correct: true }],
    timeRemaining: 0,
    isActive: false
  },
  {
    assessmentCode: 'HIST789',
    studentName: 'Maria Garcia',
    startedAt: new Date(Date.now() - 84800000).toISOString(),
    completedAt: new Date(Date.now() - 84700000).toISOString(),
    currentQuestion: 1,
    totalQuestions: 1,
    score: 0,
    answers: [{ questionId: 'q1', answer: '1944', correct: false }],
    timeRemaining: 0,
    isActive: false
  }
];

// Write files
fs.writeFileSync(
  path.join(dataDir, 'assessments.json'),
  JSON.stringify(assessments, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'student-sessions.json'),
  JSON.stringify(studentSessions, null, 2)
);

console.log('✅ Sample data created successfully!');
console.log('📁 Files created:');
console.log('   - data/assessments.json');
console.log('   - data/student-sessions.json');
console.log('');
console.log('🎯 Test scenarios available:');
console.log('   - 2 active assessments with live students');
console.log('   - 1 completed assessment with historical data');
console.log('   - Real-time leaderboard data');
console.log('   - Various student progress states');
console.log('');
console.log('🚀 You can now test the View Mode with real dynamic data!');
