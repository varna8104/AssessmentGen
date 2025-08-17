import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Question {
  type: 'multiple_choice' | 'true_false' | 'open_text' | 'fill_blank';
  question: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
}

interface AssessmentData {
  title: string;
  description: string;
  questions: Question[];
  time_limit: number;
  difficulty: string;
}

// Enhanced topic categorization
function analyzeTopicCategory(topic: string): string {
  const topicLower = topic.toLowerCase();
  
  // Science subjects
  if (topicLower.includes('biology') || topicLower.includes('cell') || topicLower.includes('dna') || 
      topicLower.includes('genetics') || topicLower.includes('anatomy') || topicLower.includes('ecosystem')) {
    return 'biology';
  }
  if (topicLower.includes('physics') || topicLower.includes('force') || topicLower.includes('energy') || 
      topicLower.includes('motion') || topicLower.includes('electricity') || topicLower.includes('quantum')) {
    return 'physics';
  }
  if (topicLower.includes('chemistry') || topicLower.includes('molecule') || topicLower.includes('atom') || 
      topicLower.includes('chemical') || topicLower.includes('reaction') || topicLower.includes('periodic')) {
    return 'chemistry';
  }
  
  // Mathematics
  if (topicLower.includes('math') || topicLower.includes('calculus') || topicLower.includes('algebra') || 
      topicLower.includes('geometry') || topicLower.includes('statistics') || topicLower.includes('equation')) {
    return 'mathematics';
  }
  
  // Computer Science
  if (topicLower.includes('programming') || topicLower.includes('code') || topicLower.includes('software') || 
      topicLower.includes('algorithm') || topicLower.includes('javascript') || topicLower.includes('python') ||
      topicLower.includes('computer science') || topicLower.includes('data structure')) {
    return 'programming';
  }
  
  // History
  if (topicLower.includes('history') || topicLower.includes('war') || topicLower.includes('ancient') || 
      topicLower.includes('civilization') || topicLower.includes('revolution') || topicLower.includes('century')) {
    return 'history';
  }
  
  // Literature
  if (topicLower.includes('literature') || topicLower.includes('novel') || topicLower.includes('poetry') || 
      topicLower.includes('shakespeare') || topicLower.includes('author') || topicLower.includes('book')) {
    return 'literature';
  }
  
  // Languages
  if (topicLower.includes('english') || topicLower.includes('grammar') || topicLower.includes('spanish') || 
      topicLower.includes('french') || topicLower.includes('language') || topicLower.includes('vocabulary')) {
    return 'language';
  }
  
  return 'general';
}

// Generate subject-specific content
function generateSubjectSpecificQuestions(category: string, topic: string): Question[] {
  const questions: Question[] = [];
  
  switch (category) {
    case 'biology':
      questions.push(
        {
          type: 'multiple_choice',
          question: `What is the primary function of mitochondria in ${topic.includes('cell') ? 'cells' : 'biological systems'}?`,
          options: ['Energy production', 'Protein synthesis', 'DNA replication', 'Waste removal'],
          correct_answer: 'Energy production',
          explanation: 'Mitochondria are the powerhouses of the cell, responsible for producing ATP through cellular respiration.'
        },
        {
          type: 'true_false',
          question: `All living organisms contain DNA as their genetic material.`,
          correct_answer: 'true',
          explanation: 'DNA is the universal genetic material found in all living organisms.'
        }
      );
      break;
      
    case 'physics':
      questions.push(
        {
          type: 'multiple_choice',
          question: `What is Newton's first law of motion also known as?`,
          options: ['Law of inertia', 'Law of acceleration', 'Law of action-reaction', 'Law of gravitation'],
          correct_answer: 'Law of inertia',
          explanation: 'Newton\'s first law states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force.'
        },
        {
          type: 'fill_blank',
          question: 'The speed of light in vacuum is approximately _____ meters per second.',
          correct_answer: '300,000,000',
          explanation: 'The speed of light in vacuum is approximately 3 × 10⁸ m/s or 300,000,000 m/s.'
        }
      );
      break;
      
    case 'programming':
      questions.push(
        {
          type: 'multiple_choice',
          question: 'Which of the following is NOT a primitive data type in JavaScript?',
          options: ['string', 'number', 'array', 'boolean'],
          correct_answer: 'array',
          explanation: 'Array is an object type in JavaScript, not a primitive data type. The primitive types are string, number, boolean, undefined, null, symbol, and bigint.'
        },
        {
          type: 'true_false',
          question: 'In programming, a loop is used to execute a block of code repeatedly.',
          correct_answer: 'true',
          explanation: 'Loops are fundamental programming constructs that allow code to be executed multiple times.'
        }
      );
      break;
      
    case 'mathematics':
      questions.push(
        {
          type: 'multiple_choice',
          question: 'What is the derivative of x² with respect to x?',
          options: ['2x', 'x', '2', 'x²'],
          correct_answer: '2x',
          explanation: 'Using the power rule: d/dx(x^n) = nx^(n-1), so d/dx(x²) = 2x.'
        },
        {
          type: 'fill_blank',
          question: 'The value of π (pi) is approximately _____.',
          correct_answer: '3.14159',
          explanation: 'Pi is the ratio of a circle\'s circumference to its diameter, approximately 3.14159.'
        }
      );
      break;
      
    case 'history':
      questions.push(
        {
          type: 'multiple_choice',
          question: 'In which year did World War II end?',
          options: ['1944', '1945', '1946', '1947'],
          correct_answer: '1945',
          explanation: 'World War II ended in 1945 with the surrender of Japan in September.'
        },
        {
          type: 'open_text',
          question: 'Describe the main causes of the Industrial Revolution.',
          explanation: 'The Industrial Revolution was caused by factors including technological innovations, availability of capital, natural resources, and changing social structures.'
        }
      );
      break;
      
    default:
      // General academic questions
      questions.push(
        {
          type: 'multiple_choice',
          question: `Which of the following best describes the main concept in "${topic}"?`,
          options: ['A theoretical framework', 'A practical application', 'A historical event', 'A scientific principle'],
          correct_answer: 'A theoretical framework',
          explanation: 'This question helps assess understanding of the fundamental nature of the topic.'
        }
      );
  }
  
  return questions;
}

// Enhanced AI prompt with generic question detection
async function generateAssessmentWithAI(topic: string, difficulty: string, numQuestions: number, retryCount: number = 0): Promise<AssessmentData | null> {
  try {
    const prompt = `Create a comprehensive assessment about "${topic}" with ${numQuestions} questions at ${difficulty} difficulty level.

CRITICAL REQUIREMENTS:
1. Generate SPECIFIC, FACTUAL questions about ${topic} content
2. DO NOT create generic meta-learning questions like "What distinguishes ${topic} from other subjects?"
3. Focus on actual knowledge, concepts, facts, and applications within ${topic}
4. Include diverse question types: multiple choice, true/false, fill-in-blank, and open text

Topic Category Guidelines:
- For science topics: Ask about specific concepts, processes, formulas, or phenomena
- For programming: Ask about syntax, concepts, algorithms, or best practices  
- For history: Ask about specific events, dates, people, or causes
- For literature: Ask about authors, themes, literary devices, or specific works
- For math: Ask about formulas, calculations, theorems, or problem-solving

Format the response as valid JSON:
{
  "title": "Assessment Title",
  "description": "Brief description",
  "questions": [
    {
      "type": "multiple_choice|true_false|open_text|fill_blank",
      "question": "Specific factual question about ${topic}",
      "options": ["option1", "option2", "option3", "option4"] (for multiple_choice only),
      "correct_answer": "correct answer",
      "explanation": "Why this answer is correct"
    }
  ],
  "time_limit": 30,
  "difficulty": "${difficulty}"
}

Remember: Generate questions that test knowledge OF ${topic}, not ABOUT ${topic} as a subject of study.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 3000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return null;

    // Clean the response
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const assessment = JSON.parse(cleanedResponse);

    // Check for generic questions and retry if needed
    const hasGenericQuestions = assessment.questions.some((q: Question) => 
      q.question.toLowerCase().includes('what distinguishes') ||
      q.question.toLowerCase().includes('differs from other') ||
      q.question.toLowerCase().includes('compared to other subjects') ||
      q.question.toLowerCase().includes('field of study')
    );

    if (hasGenericQuestions && retryCount < 2) {
      console.log(`Generic questions detected, retrying... (attempt ${retryCount + 1})`);
      return await generateAssessmentWithAI(topic, difficulty, numQuestions, retryCount + 1);
    }

    return assessment;
  } catch (error) {
    console.error('Error generating assessment with AI:', error);
    return null;
  }
}

// Intelligent fallback system
function generateIntelligentFallbackAssessment(topic: string, difficulty: string, numQuestions: number): AssessmentData {
  const category = analyzeTopicCategory(topic);
  const subjectQuestions = generateSubjectSpecificQuestions(category, topic);
  
  // Use subject-specific questions as base, then fill remaining slots
  const questions: Question[] = [];
  const questionsNeeded = Math.min(numQuestions, 10);
  
  // Add subject-specific questions
  questions.push(...subjectQuestions.slice(0, questionsNeeded));
  
  // Fill remaining slots if needed
  while (questions.length < questionsNeeded) {
    questions.push({
      type: 'open_text',
      question: `Explain a key concept or principle related to ${topic}.`,
      explanation: 'This question allows for demonstration of understanding of important concepts in the subject area.'
    });
  }

  return {
    title: `${topic} Assessment`,
    description: `A comprehensive assessment covering key concepts in ${topic}`,
    questions: questions.slice(0, questionsNeeded),
    time_limit: Math.max(15, questionsNeeded * 3),
    difficulty: difficulty
  };
}

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty = 'medium', numQuestions = 5 } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    console.log(`Generating assessment for: ${topic} (${difficulty}, ${numQuestions} questions)`);

    // Try AI generation first with retry mechanism
    const aiAssessment = await generateAssessmentWithAI(topic, difficulty, numQuestions);
    
    if (aiAssessment && aiAssessment.questions && aiAssessment.questions.length > 0) {
      console.log('Successfully generated assessment with AI');
      return NextResponse.json(aiAssessment);
    }

    // Fallback to intelligent subject-specific generation
    console.log('Using intelligent fallback system');
    const fallbackAssessment = generateIntelligentFallbackAssessment(topic, difficulty, numQuestions);
    
    return NextResponse.json(fallbackAssessment);

  } catch (error) {
    console.error('Error in assessment generation:', error);
    
    // Emergency fallback
    return NextResponse.json({
      title: 'Assessment Generation Error',
      description: 'There was an error generating the assessment. Please try again.',
      questions: [{
        type: 'open_text' as const,
        question: 'Please describe what you know about the requested topic.',
        explanation: 'This is a fallback question due to a system error.'
      }],
      time_limit: 15,
      difficulty: 'medium'
    });
  }
}
