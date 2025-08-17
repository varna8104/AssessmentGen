const fs = require('fs');
const path = require('path');

const STUDENTS_FILE = path.join(process.cwd(), 'data', 'student-sessions.json');

// Create realistic active students that match the UI display names
const activeStudents = [
  {
    "assessmentCode": "FCMDVT",
    "studentName": "Abhivarna",
    "startedAt": new Date(Date.now() - 120000).toISOString(), // Started 2 minutes ago
    "currentQuestion": 3,
    "totalQuestions": 20,
    "score": 20, // Leading with 20 points
    "answers": {
      "q1": "correct",
      "q2": "correct"
    },
    "timeRemaining": 480, // 8 minutes left
    "isActive": true
  },
  {
    "assessmentCode": "FCMDVT", 
    "studentName": "Romaiza",
    "startedAt": new Date(Date.now() - 180000).toISOString(), // Started 3 minutes ago
    "currentQuestion": 2,
    "totalQuestions": 20,
    "score": 10, // Second place with 10 points
    "answers": {
      "q1": "correct"
    },
    "timeRemaining": 420, // 7 minutes left
    "isActive": true
  },
  {
    "assessmentCode": "FCMDVT",
    "studentName": "TestUser1",
    "startedAt": new Date(Date.now() - 90000).toISOString(), // Started 1.5 minutes ago
    "currentQuestion": 2,
    "totalQuestions": 20,
    "score": 10, // Tied for second
    "answers": {
      "q1": "correct"
    },
    "timeRemaining": 510, // 8.5 minutes left
    "isActive": true
  },
  {
    "assessmentCode": "FCMDVT",
    "studentName": "TestUser2",
    "startedAt": new Date(Date.now() - 60000).toISOString(), // Started 1 minute ago
    "currentQuestion": 1,
    "totalQuestions": 20,
    "score": 0, // Just started
    "answers": {},
    "timeRemaining": 540, // 9 minutes left
    "isActive": true
  }
];

// Keep some completed students for the completed section
const completedStudents = [
  {
    "assessmentCode": "FCMDVT",
    "studentName": "Winner123",
    "startedAt": new Date(Date.now() - 900000).toISOString(), // Started 15 minutes ago
    "completedAt": new Date(Date.now() - 300000).toISOString(), // Completed 5 minutes ago (10 min total)
    "currentQuestion": 20,
    "totalQuestions": 20,
    "score": 190, // Top scorer - 95%
    "answers": {},
    "timeRemaining": 0,
    "isActive": false
  },
  {
    "assessmentCode": "FCMDVT",
    "studentName": "FastRunner",
    "startedAt": new Date(Date.now() - 800000).toISOString(), // Started 13 minutes ago
    "completedAt": new Date(Date.now() - 200000).toISOString(), // Completed 3 minutes ago (10 min total)
    "currentQuestion": 20,
    "totalQuestions": 20,
    "score": 180, // Second place - 90%
    "answers": {},
    "timeRemaining": 0,
    "isActive": false
  },
  {
    "assessmentCode": "FCMDVT",
    "studentName": "GoodStudent",
    "startedAt": new Date(Date.now() - 1200000).toISOString(), // Started 20 minutes ago
    "completedAt": new Date(Date.now() - 400000).toISOString(), // Completed 7 minutes ago (13 min total)
    "currentQuestion": 20,
    "totalQuestions": 20,
    "score": 160, // Third place - 80%
    "answers": {},
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
  
  console.log('✅ Created realistic test data!');
  console.log('📊 Active students:', activeStudents.length);
  console.log('✅ Completed students:', completedStudents.length);
  console.log('');
  console.log('🏆 Current Leaderboard (Active):');
  activeStudents
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.currentQuestion - a.currentQuestion;
    })
    .forEach((student, index) => {
      const completion = Math.round(((student.currentQuestion - 1) / student.totalQuestions) * 100);
      console.log(`   ${index + 1}. ${student.studentName}: Q${student.currentQuestion}/20, ${student.score} pts (${completion}% complete) ${index === 0 ? '👑' : ''}`);
    });
  
  console.log('');
  console.log('🥇 Winners (Completed):');
  completedStudents
    .sort((a, b) => b.score - a.score)
    .forEach((student, index) => {
      const percentage = Math.round((student.score / 200) * 100); // Assuming 200 total points
      console.log(`   ${index + 1}. ${student.studentName}: ${student.score}/200 pts (${percentage}%) ${index === 0 ? '👑' : ''}`);
    });
  
} catch (error) {
  console.error('Error creating test data:', error);
}
