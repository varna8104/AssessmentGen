const fs = require('fs');
const path = require('path');

const STUDENTS_FILE = path.join(process.cwd(), 'data', 'student-sessions.json');

function updateStudentProgress() {
  try {
    if (!fs.existsSync(STUDENTS_FILE)) {
      console.log('No student sessions file found');
      return;
    }

    const data = fs.readFileSync(STUDENTS_FILE, 'utf8');
    let sessions = JSON.parse(data);
    
    let updated = false;
    
    // Update active students' progress
    sessions = sessions.map(session => {
      if (!session.isActive || session.completedAt) {
        return session; // Skip inactive or completed sessions
      }
      
      // Higher chance of updating for leading students to make it more dynamic
      const isLeading = session.studentName === 'Abhivarna';
      const shouldUpdate = Math.random() < (isLeading ? 0.5 : 0.3); // 50% for leader, 30% for others
      
      if (shouldUpdate) {
        const newSession = { ...session };
        
        // Decrease time remaining (simulate time passing)
        if (newSession.timeRemaining > 0) {
          const timePassed = Math.floor(Math.random() * 45 + 15); // 15-60 seconds
          newSession.timeRemaining = Math.max(0, newSession.timeRemaining - timePassed);
        }
        
        // Possibly advance to next question (higher chance for active students)
        const shouldAdvance = Math.random() < 0.4; // 40% chance to advance
        if (shouldAdvance && newSession.currentQuestion < newSession.totalQuestions) {
          newSession.currentQuestion += 1;
          
          // Simulate answering correctly with varying rates
          let correctRate = 0.7; // Default 70% correct
          if (session.studentName === 'Abhivarna') correctRate = 0.8; // Leader gets 80%
          if (session.studentName === 'TestUser2') correctRate = 0.5; // Struggling student 50%
          
          const correctAnswer = Math.random() < correctRate;
          if (correctAnswer) {
            // Assign points (assuming 10 points per question for this assessment)
            newSession.score += 10;
          }
          
          const completion = Math.round(((newSession.currentQuestion - 1) / newSession.totalQuestions) * 100);
          console.log(`📚 ${newSession.studentName} advanced to question ${newSession.currentQuestion}/${newSession.totalQuestions} (Score: ${newSession.score}, ${completion}% complete)`);
        }
        
        // Check if assessment should be completed (ran out of time or finished all questions)
        if (newSession.timeRemaining <= 0 || newSession.currentQuestion >= newSession.totalQuestions) {
          newSession.completedAt = new Date().toISOString();
          newSession.isActive = false;
          newSession.timeRemaining = 0;
          newSession.currentQuestion = Math.min(newSession.currentQuestion, newSession.totalQuestions);
          
          const finalPercentage = Math.round((newSession.score / 200) * 100); // Assuming 200 total points
          console.log(`✅ ${newSession.studentName} completed assessment with ${newSession.score}/200 points (${finalPercentage}%)!`);
        }
        
        updated = true;
        return newSession;
      }
      
      return session;
    });
    
    if (updated) {
      fs.writeFileSync(STUDENTS_FILE, JSON.stringify(sessions, null, 2));
      console.log(`🔄 Updated student progress at ${new Date().toLocaleTimeString()}`);
      
      // Show current leaderboard
      const activeStudents = sessions.filter(s => s.isActive && !s.completedAt);
      if (activeStudents.length > 0) {
        console.log(`📊 Current Live Leaderboard:`);
        activeStudents
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.currentQuestion !== a.currentQuestion) return b.currentQuestion - a.currentQuestion;
            return a.timeRemaining - b.timeRemaining;
          })
          .forEach((student, index) => {
            const completion = Math.round(((student.currentQuestion - 1) / student.totalQuestions) * 100);
            const timeLeft = `${Math.floor(student.timeRemaining/60)}:${String(student.timeRemaining%60).padStart(2, '0')}`;
            const crown = index === 0 ? '👑 ' : '';
            console.log(`   ${crown}${index + 1}. ${student.studentName}: Q${student.currentQuestion}/20, ${student.score} pts (${completion}% complete), ${timeLeft} left`);
          });
      } else {
        console.log('📊 All students have completed the assessment!');
      }
    }
    
  } catch (error) {
    console.error('Error updating student progress:', error);
  }
}

// Run the update function
console.log('🚀 Starting enhanced real-time simulation...');
console.log('💡 This simulates realistic student progress with varying speeds');
console.log('📱 The leading student will have higher activity to show dynamic ranking!');
console.log('');

// Update more frequently for more dynamic results
updateStudentProgress(); // Initial update
const interval = setInterval(updateStudentProgress, 8000); // Every 8 seconds

// Stop after 8 minutes to prevent infinite running
setTimeout(() => {
  clearInterval(interval);
  console.log('');
  console.log('⏹️  Simulation completed!');
  console.log('🎯 Check the View Mode dashboard to see final results');
}, 480000); // 8 minutes
