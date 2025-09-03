import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Simple fallback assessment generator - guaranteed to work
const generateFallbackAssessment = (assessmentName: string, assessmentType: string, numberOfQuestions: number = 10) => {
  console.log(`🔧 Creating ${numberOfQuestions} questions for "${assessmentName}"`)
  
  const questions: any[] = []
  
  // Universal question templates that work for ANY topic
  const questionTemplates = [
    {
      template: (topic: string) => `What are the fundamental concepts that define ${topic}?`,
      options: (topic: string) => [
        `The core principles and essential ideas that form the foundation of ${topic}`,
        `Only the most recent developments in the field`,
        `Surface-level facts without deeper understanding`,
        `Unrelated information from other disciplines`
      ],
      correct: 0,
      explanation: (topic: string) => `Understanding ${topic} requires grasping its fundamental principles and core concepts.`
    },
    {
      template: (topic: string) => `Which approach is most effective for mastering ${topic}?`,
      options: (topic: string) => [
        `Systematic study combining theoretical knowledge with practical application`,
        `Memorizing isolated facts without understanding connections`,
        `Avoiding challenging aspects of the subject`,
        `Relying solely on superficial knowledge`
      ],
      correct: 0,
      explanation: (topic: string) => `Mastering ${topic} requires systematic study that combines theoretical understanding with practical application.`
    },
    {
      template: (topic: string) => `What role does critical thinking play in understanding ${topic}?`,
      options: (topic: string) => [
        `It is essential for analyzing complex concepts and solving problems`,
        `It is unnecessary and slows down the learning process`,
        `It only applies to advanced-level study`,
        `It makes the subject more confusing than helpful`
      ],
      correct: 0,
      explanation: (topic: string) => `Critical thinking is essential in ${topic} for analyzing complex concepts and developing effective problem-solving skills.`
    },
    {
      template: (topic: string) => `How does ${topic} connect to real-world applications?`,
      options: (topic: string) => [
        `It provides practical tools and knowledge applicable to real situations`,
        `It is purely theoretical with no practical value`,
        `It only applies in academic or research settings`,
        `It has no meaningful connection to everyday life`
      ],
      correct: 0,
      explanation: (topic: string) => `${topic} offers practical knowledge and tools that can be applied to solve real-world problems and challenges.`
    },
    {
      template: (topic: string) => `What is the best strategy for building comprehensive understanding in ${topic}?`,
      options: (topic: string) => [
        `Start with fundamental concepts and gradually progress to more complex ideas`,
        `Begin with the most difficult topics to challenge yourself`,
        `Focus exclusively on memorizing facts and formulas`,
        `Skip foundational knowledge and jump directly to advanced topics`
      ],
      correct: 0,
      explanation: (topic: string) => `Building understanding in ${topic} requires starting with fundamental concepts and systematically progressing to more complex ideas.`
    },
    {
      template: (topic: string) => `Why is it important to understand the historical context of ${topic}?`,
      options: (topic: string) => [
        `It provides essential background for understanding current developments and future directions`,
        `Historical context is irrelevant to modern understanding`,
        `Only recent developments matter in today's world`,
        `Past knowledge has no bearing on current practice`
      ],
      correct: 0,
      explanation: (topic: string) => `Understanding the historical context of ${topic} provides essential background for comprehending current developments and anticipating future directions.`
    },
    {
      template: (topic: string) => `What makes ${topic} challenging for many learners?`,
      options: (topic: string) => [
        `The need to integrate multiple concepts and apply them in various contexts`,
        `It is inherently impossible to understand`,
        `There are no effective learning strategies available`,
        `The subject matter never changes or evolves`
      ],
      correct: 0,
      explanation: (topic: string) => `${topic} can be challenging because it requires integrating multiple concepts and applying them effectively in various contexts.`
    },
    {
      template: (topic: string) => `How can one demonstrate mastery of ${topic}?`,
      options: (topic: string) => [
        `By successfully applying knowledge to solve problems and explain concepts clearly`,
        `By memorizing all available information on the subject`,
        `By avoiding any practical application of the knowledge`,
        `By focusing only on theoretical aspects without application`
      ],
      correct: 0,
      explanation: (topic: string) => `Mastery of ${topic} is demonstrated through successful application of knowledge to solve problems and clear explanation of concepts.`
    },
    {
      template: (topic: string) => `What role does practice play in learning ${topic}?`,
      options: (topic: string) => [
        `Regular practice is essential for developing proficiency and retention`,
        `Practice is unnecessary if you understand the theory`,
        `Practice only helps with very basic concepts`,
        `Theoretical knowledge alone is sufficient for mastery`
      ],
      correct: 0,
      explanation: (topic: string) => `Regular practice is essential in ${topic} for developing proficiency, improving retention, and building confidence.`
    },
    {
      template: (topic: string) => `How does ${topic} relate to other fields of study?`,
      options: (topic: string) => [
        `It connects to and draws from multiple disciplines, creating interdisciplinary understanding`,
        `It exists in complete isolation from other subjects`,
        `Connections to other fields are purely superficial`,
        `Understanding other subjects interferes with learning ${topic}`
      ],
      correct: 0,
      explanation: (topic: string) => `${topic} connects to multiple disciplines, and understanding these connections enhances overall comprehension and application.`
    }
  ]
  
  // Generate the exact number of questions requested
  for (let i = 0; i < numberOfQuestions; i++) {
    const templateIndex = i % questionTemplates.length
    const template = questionTemplates[templateIndex]
    const variation = Math.floor(i / questionTemplates.length)
    
    // Add variations for higher question counts
    let questionPrefix = ''
    if (variation > 0) {
      const prefixes = [
        'From an analytical perspective: ',
        'Considering multiple factors: ',
        'In advanced study: ',
        'For comprehensive understanding: ',
        'In practical application: ',
        'From a critical thinking standpoint: ',
        'When applying knowledge: '
      ]
      questionPrefix = prefixes[variation % prefixes.length]
    }
    
    const finalQuestion = questionPrefix + template.template(assessmentName)
    
    const question = {
      id: `fallback_q${i + 1}_${Date.now() + i}`,
      type: 'multiple-choice',
      question: finalQuestion,
      options: template.options(assessmentName),
      correctAnswer: template.options(assessmentName)[template.correct],
      explanation: questionPrefix + template.explanation(assessmentName),
      points: 1,
      timeLimit: 30,
      difficulty: i < numberOfQuestions / 3 ? 'easy' : i < (2 * numberOfQuestions) / 3 ? 'medium' : 'hard',
      topic: assessmentName
    }
    
    questions.push(question)
    console.log(`✅ Created question ${i + 1}/${numberOfQuestions}`)
  }
  
  console.log(`🎯 Successfully created ${questions.length} questions for ${assessmentName}`)
  
  return {
    questions: questions,
    title: assessmentName,
    description: `Comprehensive assessment covering key concepts and principles in ${assessmentName}`,
    totalPoints: questions.length,
    estimatedTime: Math.ceil(questions.length * 1.5)
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 Assessment generation request received')
  
  try {
    const body = await request.json()
    console.log('📋 Request body:', body)
    
    const { 
      assessmentName, 
      assessmentType, 
      language, 
      easyToHard, 
      difficulty, 
      numberOfQuestions 
    } = body

    // Validate required fields
    if (!assessmentName || !assessmentType || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: assessmentName, assessmentType, or language' },
        { status: 400 }
      )
    }

    // Determine the actual number of questions to generate
    const actualQuestionCount = easyToHard ? 15 : parseInt(numberOfQuestions) || 10
    console.log(`📊 Generating ${actualQuestionCount} questions for: ${assessmentName}`)

    try {
      // Try AI generation first (this will likely fail due to invalid API key)
      console.log('🤖 Attempting AI generation with Groq...')
      
      const prompt = `Create exactly ${actualQuestionCount} unique, topic-specific questions about "${assessmentName}". 

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Your question here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct"
    }
  ],
  "title": "${assessmentName}",
  "description": "Assessment description"
}`

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are an expert assessment creator. Always return valid JSON." },
          { role: "user", content: prompt }
        ],
        model: "gpt-4o-mini",
        temperature: 0,
        top_p: 1,
        presence_penalty: 0,
        frequency_penalty: 0,
        seed: parseInt(process.env.LLM_SEED || '42'),
        max_tokens: 8000,
        // @ts-ignore - enforce JSON output when supported
        response_format: { type: 'json_object' }
      })

      const responseContent = completion.choices[0]?.message?.content
      if (!responseContent) {
        throw new Error('Empty response from OpenAI API')
      }

      // Clean and parse the response
      let cleanedResponse = responseContent.trim()
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      }

      const aiAssessment = JSON.parse(cleanedResponse)
      
      console.log('✅ AI generation successful')
      return NextResponse.json({
        success: true,
        assessment: aiAssessment,
        metadata: {
          source: 'ai',
          generatedAt: new Date().toISOString(),
          numberOfQuestions: aiAssessment.questions.length
        }
      })

    } catch (aiError: any) {
      console.log('🔧 AI generation failed, using reliable fallback system')
      
      // Use the guaranteed-to-work fallback system
      const fallbackAssessment = generateFallbackAssessment(
        assessmentName,
        assessmentType,
        actualQuestionCount
      )

      return NextResponse.json({
        success: true,
        assessment: fallbackAssessment,
        metadata: {
          source: 'fallback',
          generatedAt: new Date().toISOString(),
          numberOfQuestions: fallbackAssessment.questions.length,
          fallbackReason: 'AI generation failed - using reliable fallback system'
        }
      })
    }

  } catch (error: any) {
    console.error('❌ Critical error:', error.message)
    
    // Absolute emergency fallback
    const emergencyAssessment = generateFallbackAssessment(
      'General Knowledge',
      'mcq',
      5
    )

    return NextResponse.json({
      success: true,
      assessment: emergencyAssessment,
      metadata: {
        source: 'emergency',
        generatedAt: new Date().toISOString(),
        numberOfQuestions: 5,
        error: error.message
      }
    })
  }
}
