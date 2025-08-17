const fs = require('fs');
const path = require('path');

const STUDENTS_FILE = path.join(process.cwd(), 'data', 'student-sessions.json');

// Create some active students for testing
const activeStudents = [
  {
    "assessmentCode": "FCMDVT",
    "studentName": "Idiot",
    "startedAt": new Date(Date.now() - 300000).toISOString(), // Started 5 minutes ago
    "currentQuestion": 1,
    "totalQuestions": 20,
    "score": 0,
    "answers": {},
    "timeRemaining": 600, // 10 minutes left
    "isActive": true
  },
  {
    "assessmentCode": "FCMDVT", 
    "studentName": "relxnika",
    "startedAt": new Date(Date.now() - 600000).toISOString(), // Started 10 minutes ago
    "currentQuestion": 1,
    "totalQuestions": 20,
    "score": 0,
    "answers": {},
    "timeRemaining": 600, // 10 minutes left
    "isActive": true
  },
  {
    "assessmentCode": "MATH123",
    "studentName": "Active Student 1",
    "startedAt": new Date(Date.now() - 180000).toISOString(), // Started 3 minutes ago
    "currentQuestion": 2,
    "totalQuestions": 3,
    "score": 10,
    "answers": [
      {
        "questionId": "q1",
        "answer": "x = 4",
        "correct": true
      }
    ],
    "timeRemaining": 420, // 7 minutes left
    "isActive": true
  },
  {
    "assessmentCode": "MATH123", 
    "studentName": "Active Student 2",
    "startedAt": new Date(Date.now() - 240000).toISOString(), // Started 4 minutes ago
    "currentQuestion": 1,
    "totalQuestions": 3,
    "score": 0,
    "answers": [],
    "timeRemaining": 360, // 6 minutes left
    "isActive": true
  }
];

// Keep some completed students
const completedStudents = [
  {
    "assessmentCode": "FCMDVT",
    "studentName": "Divya",
    "startedAt": "2025-08-08T06:59:43.680Z",
    "completedAt": "2025-08-08T07:01:06.764Z",
    "currentQuestion": 20,
    "totalQuestions": 20,
    "score": 20,
    "answers": {
      "ai_q1": "A method for computers to learn without explicit programming",
      "ai_q2": "Supervised, Unsupervised, Reinforcement"
    },
    "timeRemaining": 0,
    "isActive": false
  },
  {
    "assessmentCode": "FCMDVT",
    "studentName": "relxnika",
    "startedAt": "2025-08-08T07:04:44.447Z",
    "completedAt": "2025-08-08T07:09:10.347Z",
    "currentQuestion": 20,
    "totalQuestions": 20,
    "score": 18,
    "answers": {
      "ai_q1": "A method for computers to learn without explicit programming",
      "ai_q2": "Supervised, Unsupervised, Reinforcement"
    },
    "timeRemaining": 0,
    "isActive": false
  },
  {
    "assessmentCode": "FCMDVT",
    "studentName": "Abhi",
    "startedAt": "2025-08-08T06:59:32.026Z",
    "completedAt": "2025-08-08T07:06:43.896Z",
    "currentQuestion": 20,
    "totalQuestions": 20,
    "score": 10,
    "answers": {
      "ai_q1": "A method for computers to learn without explicit programming"
    },
    "timeRemaining": 0,
    "isActive": false
  },
  {
    "assessmentCode": "MATH123",
    "studentName": "Sarah Chen",
    "startedAt": "2025-08-08T06:37:08.503Z",
    "completedAt": "2025-08-08T06:52:39.626Z",
    "currentQuestion": 3,
    "totalQuestions": 3,
    "score": 25,
    "answers": [
      {
        "questionId": "q1",
        "answer": "x = 4",
        "correct": true
      }
    ],
    "timeRemaining": 0,
    "isActive": false
  },
  {
    "assessmentCode": "MATH123",
    "studentName": "Michael Brown",
    "startedAt": "2025-08-08T06:12:08.503Z",
    "completedAt": "2025-08-08T06:22:08.503Z",
    "currentQuestion": 3,
    "totalQuestions": 3,
    "score": 35,
    "answers": [
      {
        "questionId": "q1",
        "answer": "x = 4",
        "correct": true
      }
    ],
    "timeRemaining": 0,
    "isActive": false
  }
];

// Combine active and completed students
const allStudents = [...activeStudents, ...completedStudents];

try {
  // Create data directory if it doesn't exist
  const dataDir = path.dirname(STUDENTS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Write the updated data
  fs.writeFileSync(STUDENTS_FILE, JSON.stringify(allStudents, null, 2));
  
  console.log('✅ Created active student sessions!');
  console.log('📊 Active students:', activeStudents.length);
  console.log('✅ Completed students:', completedStudents.length);
  console.log('');
  console.log('Active students:');
  activeStudents.forEach(student => {
    console.log(`   • ${student.studentName} (${student.assessmentCode}): Q${student.currentQuestion}/${student.totalQuestions}, ${student.score} pts, ${Math.floor(student.timeRemaining/60)}:${String(student.timeRemaining%60).padStart(2, '0')} left`);
  });
  
} catch (error) {
  console.error('Error creating active student data:', error);
}
