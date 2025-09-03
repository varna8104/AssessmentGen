import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Simple PDF text extraction function (in production, use a proper PDF parser)
async function extractTextFromPDF(file: File): Promise<string> {
  // For demo purposes, we'll simulate text extraction
  // In a real implementation, you'd use libraries like pdf-parse, pdf2pic, or Tesseract.js
  
  const fileName = file.name.toLowerCase()
  const fileSize = file.size
  
  // Return simulated text content based on file characteristics
  if (fileName.includes('math') || fileName.includes('algebra') || fileName.includes('calculus')) {
    return `
    Chapter 1: Introduction to Mathematics
    Chapter 2: Algebraic Expressions and Equations
    Chapter 3: Linear Functions and Graphs
    Chapter 4: Quadratic Functions and Equations
    Chapter 5: Polynomial Functions
    Chapter 6: Exponential and Logarithmic Functions
    Chapter 7: Trigonometric Functions
    Chapter 8: Systems of Equations
    Chapter 9: Matrices and Determinants
    Chapter 10: Probability and Statistics
    Chapter 11: Calculus Fundamentals
    Chapter 12: Derivatives and Applications
    Chapter 13: Integrals and Applications
    `
  } else if (fileName.includes('science') || fileName.includes('physics') || fileName.includes('chemistry')) {
    return `
    Chapter 1: Scientific Method and Measurement
    Chapter 2: Matter and Energy
    Chapter 3: Atomic Structure
    Chapter 4: Chemical Bonds and Reactions
    Chapter 5: States of Matter
    Chapter 6: Thermodynamics
    Chapter 7: Waves and Sound
    Chapter 8: Light and Optics
    Chapter 9: Electricity and Magnetism
    Chapter 10: Nuclear Physics
    Chapter 11: Organic Chemistry
    Chapter 12: Environmental Science
    `
  } else if (fileName.includes('history') || fileName.includes('social')) {
    return `
    Chapter 1: Ancient Civilizations
    Chapter 2: Classical Antiquity
    Chapter 3: Medieval Period
    Chapter 4: Renaissance and Reformation
    Chapter 5: Age of Exploration
    Chapter 6: Industrial Revolution
    Chapter 7: World Wars and Global Conflicts
    Chapter 8: Modern Political Systems
    Chapter 9: Economic Systems
    Chapter 10: Cultural and Social Movements
    Chapter 11: Contemporary Global Issues
    `
  } else if (fileName.includes('english') || fileName.includes('literature') || fileName.includes('language')) {
    return `
    Chapter 1: Grammar and Syntax
    Chapter 2: Vocabulary Development
    Chapter 3: Reading Comprehension
    Chapter 4: Writing Techniques
    Chapter 5: Literary Analysis
    Chapter 6: Poetry and Prose
    Chapter 7: Drama and Theater
    Chapter 8: Research and Citation
    Chapter 9: Public Speaking
    Chapter 10: Creative Writing
    Chapter 11: Media Literacy
    `
  } else if (fileName.includes('computer') || fileName.includes('programming') || fileName.includes('coding')) {
    return `
    Chapter 1: Introduction to Programming
    Chapter 2: Variables and Data Types
    Chapter 3: Control Structures and Logic
    Chapter 4: Functions and Methods
    Chapter 5: Object-Oriented Programming
    Chapter 6: Data Structures
    Chapter 7: Algorithms and Complexity
    Chapter 8: File Input/Output
    Chapter 9: Error Handling and Debugging
    Chapter 10: Software Testing
    Chapter 11: Database Fundamentals
    Chapter 12: Web Development
    Chapter 13: Version Control Systems
    Chapter 14: Software Engineering Principles
    `
  } else {
    // Generic academic content
    return `
    Chapter 1: Introduction and Fundamentals
    Chapter 2: Basic Concepts and Principles
    Chapter 3: Core Theory and Applications
    Chapter 4: Advanced Topics
    Chapter 5: Practical Applications
    Chapter 6: Case Studies and Examples
    Chapter 7: Research Methods
    Chapter 8: Analysis and Evaluation
    Chapter 9: Current Trends and Developments
    Chapter 10: Future Perspectives
    `
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const subject = formData.get('subject') as string
    const textbookName = formData.get('textbookName') as string
    const assessmentType = formData.get('assessmentType') as string
    const language = formData.get('language') as string

    if (!pdfFile) {
      return NextResponse.json({
        success: false,
        error: 'No PDF file provided'
      }, { status: 400 })
    }

    // Extract text from PDF
    const extractedText = await extractTextFromPDF(pdfFile)

    // Use OpenAI to analyze the extracted text and generate relevant topics
  const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert educational content analyzer. Your task is to analyze textbook content and extract the most relevant and specific topics that would be suitable for creating ${assessmentType} assessments in ${language}.

Rules for topic extraction:
1. Extract specific, actionable topics that can be tested
2. Focus on concrete concepts, not vague chapter titles
3. Consider the subject area: ${subject}
4. Generate 12-20 well-defined topics
5. Each topic should be specific enough to create meaningful questions
6. Avoid overly broad or overly narrow topics
7. Include both fundamental and advanced concepts
8. Format each topic as a clear, concise phrase (2-6 words)

Return ONLY a JSON array of topic strings, no other text.`
        },
        {
          role: 'user',
          content: `Analyze this textbook content and extract relevant topics for ${subject} assessment:

Subject: ${subject}
Textbook: ${textbookName}
Assessment Type: ${assessmentType}
Language: ${language}

Textbook Content:
${extractedText}

Extract specific, testable topics that are appropriate for ${assessmentType} in ${subject}. Focus on concepts that can be effectively assessed through questions.`
        }
      ],
  model: 'gpt-4o-mini',
  temperature: 0,
  top_p: 1,
  presence_penalty: 0,
  frequency_penalty: 0,
  seed: parseInt(process.env.LLM_SEED || '42'),
  max_tokens: 1000,
  // @ts-ignore - response_format supported for JSON-mode on suitable models
  response_format: { type: 'json_object' }
    })

    const response = chatCompletion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response from OpenAI API')
    }

    try {
      // Parse the JSON response
      const topics = JSON.parse(response)
      
      if (!Array.isArray(topics)) {
        throw new Error('Response is not an array')
      }

      // Validate and clean topics
      const cleanedTopics = topics
        .filter(topic => typeof topic === 'string' && topic.trim().length > 0)
        .map(topic => topic.trim())
        .slice(0, 20) // Limit to 20 topics max

      if (cleanedTopics.length === 0) {
        throw new Error('No valid topics extracted')
      }

      return NextResponse.json({
        success: true,
        topics: cleanedTopics,
        extractedText: extractedText.substring(0, 500) + '...', // Return preview of extracted text
        metadata: {
          fileName: pdfFile.name,
          fileSize: pdfFile.size,
          subject,
          textbookName,
          assessmentType,
          language,
          topicCount: cleanedTopics.length
        }
      })

    } catch (parseError) {
      console.error('Failed to parse Groq response:', parseError)
      console.log('Raw response:', response)
      
      // Fallback: extract topics from response text
      const fallbackTopics = response
        .split('\n')
        .map(line => line.trim().replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''))
        .filter(line => line.length > 3 && line.length < 50)
        .slice(0, 15)

      if (fallbackTopics.length > 0) {
        return NextResponse.json({
          success: true,
          topics: fallbackTopics,
          extractedText: extractedText.substring(0, 500) + '...',
          metadata: {
            fileName: pdfFile.name,
            fileSize: pdfFile.size,
            subject,
            textbookName,
            assessmentType,
            language,
            topicCount: fallbackTopics.length,
            note: 'Used fallback parsing'
          }
        })
      }

      throw new Error('Failed to extract topics from response')
    }

  } catch (error) {
    console.error('PDF analysis error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze PDF',
      details: 'The system could not extract topics from the uploaded PDF. Please try the fallback topic generation.'
    }, { status: 500 })
  }
}
