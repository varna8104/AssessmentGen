import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Fallback topics generator with subject-specific topics
const generateFallbackTopics = (assessmentName: string, assessmentType: string = 'Mixed'): string[] => {
  const lowerAssessment = assessmentName.toLowerCase()
  
  // Python-specific topics
  if (lowerAssessment.includes('python')) {
    return [
      'Variables and Data Types',
      'Control Structures',
      'Functions and Parameters', 
      'Lists and Dictionaries',
      'Object-Oriented Programming',
      'File Handling',
      'Exception Handling',
      'Modules and Packages',
      'String Manipulation',
      'List Comprehensions'
    ]
  }
  
  // JavaScript-specific topics
  if (lowerAssessment.includes('javascript') || lowerAssessment.includes('js')) {
    return [
      'Variables and Scope',
      'Functions and Closures',
      'DOM Manipulation',
      'Event Handling',
      'Promises and Async',
      'Array Methods',
      'Object-Oriented JS',
      'ES6 Features',
      'Error Handling',
      'Module Systems'
    ]
  }
  
  // Math-specific topics
  if (lowerAssessment.includes('math') || lowerAssessment.includes('calculus') || lowerAssessment.includes('algebra')) {
    return [
      'Basic Operations',
      'Linear Equations',
      'Quadratic Functions',
      'Trigonometry',
      'Derivatives',
      'Integration',
      'Limits',
      'Probability',
      'Statistics',
      'Geometry'
    ]
  }
  
  // Computer Science general topics
  if (lowerAssessment.includes('computer') || lowerAssessment.includes('programming') || lowerAssessment.includes('cs')) {
    return [
      'Data Structures',
      'Algorithms',
      'Time Complexity',
      'Recursion',
      'Sorting Algorithms',
      'Searching Algorithms',
      'Trees and Graphs',
      'Hash Tables',
      'Dynamic Programming',
      'System Design'
    ]
  }
  
  // Generic fallback topics
  const topicVariations = [
    'Fundamentals and Basics',
    'Core Concepts and Principles', 
    'Practical Applications',
    'Advanced Topics',
    'Problem Solving Techniques',
    'Key Methods and Approaches',
    'Important Features',
    'Best Practices',
    'Common Challenges',
    'Implementation Strategies'
  ]
  
  return topicVariations.map(topic => `${assessmentName} ${topic}`).slice(0, 5)
}

export async function POST(request: NextRequest) {
  const { subject, textbookName, assessmentType, language, isAIMode, assessmentName, assessmentPrompt } = await request.json()

  if (!subject && !isAIMode) {
    return NextResponse.json({
      success: false,
      error: 'Subject is required'
    }, { status: 400 })
  }

  if (isAIMode && !assessmentPrompt) {
    return NextResponse.json({
      success: false,
      error: 'Assessment description is required for AI mode'
    }, { status: 400 })
  }

  const mainSubject = isAIMode ? assessmentName : subject
  const contextInfo = isAIMode 
    ? `Assessment Name: ${assessmentName}, Description: ${assessmentPrompt}, Type: ${assessmentType}, Language: ${language}`
    : `Subject: ${subject}, Textbook: ${textbookName || 'Not specified'}, Type: ${assessmentType}, Language: ${language}`

  // Debug logging for AI Mode
  if (isAIMode) {
    console.log('=== AI MODE DEBUG ===')
    console.log('Assessment Name:', assessmentName)
    console.log('Assessment Prompt:', assessmentPrompt)
    console.log('Context Info:', contextInfo)
    console.log('===================')
  }

  // Check API availability first
  let useAPIFallback = false
  
  try {
    // Try a quick API test first
    const testCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Test' }],
      model: 'gpt-4o-mini',
      max_tokens: 10
    })
    
    if (!testCompletion) {
      useAPIFallback = true
    }
  } catch (apiError: any) {
    console.log('Topic generation error:', apiError)
    useAPIFallback = true
  }

  if (useAPIFallback) {
    // Use fallback topic generation
    console.log('🔄 Using fallback topic generation...')
    const fallbackTopics = generateFallbackTopics(mainSubject, assessmentType)

    return NextResponse.json({
      success: true,
      topics: fallbackTopics,
      metadata: {
        subject: mainSubject,
        isAIMode,
        source: 'fallback',
        generatedAt: new Date().toISOString()
      }
    })
  }

  // If API is available, proceed with AI generation
  try {
    // Use OpenAI to generate relevant topics based on subject and context
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert curriculum designer with advanced NLP capabilities. Your task is to analyze assessment descriptions and generate highly relevant, specific subtopics.

CRITICAL: For AI Mode, you MUST analyze the assessment name and description to identify the ACTUAL subject matter (e.g., Python, Mathematics, Chemistry, etc.) and generate subtopics ONLY within that subject domain.

For AI Mode Analysis Process:
1. READ the assessment name and description carefully
2. IDENTIFY the main subject/topic (e.g., "Python", "JavaScript", "Biology", "Calculus")  
3. EXTRACT key concepts and themes from the description
4. GENERATE 15-20 specific subtopics that are directly related to the identified main topic
5. ENSURE subtopics are granular enough to create meaningful test questions
6. FOCUS on practical, testable concepts within the main topic area

Examples:
- If assessment is about "Python Programming": Generate topics like "Variables and Data Types", "Control Structures", "Functions", "Object-Oriented Programming", "File Handling", etc.
- If assessment is about "Chemistry": Generate topics like "Atomic Structure", "Chemical Bonds", "Stoichiometry", "Thermodynamics", etc.
- If assessment is about "Calculus": Generate topics like "Limits", "Derivatives", "Integration", "Chain Rule", etc.

DO NOT generate generic topics like "General Studies" or "Fundamentals" - be specific to the subject!

Topic Quality Guidelines:
- Each topic should be 2-6 words describing a specific concept within the identified subject
- Topics should be interconnected within the main subject domain  
- Include both foundational and advanced concepts for the subject
- Ensure topics can generate various question types (${assessmentType})
- Avoid generic topics - be specific to the identified subject matter
- Language: ${language}

Return a JSON object with:
{
  "mainTopic": "The specific subject identified from analysis (e.g., Python Programming, Organic Chemistry, Linear Algebra)",
  "topics": ["specific", "subtopics", "within", "that", "subject"]
}

Return ONLY the JSON object, no other text or explanation.`
        },
        {
          role: 'user',
          content: isAIMode 
            ? `IMPORTANT: Analyze this assessment request and identify the EXACT subject matter, then generate relevant subtopics ONLY for that subject:

${contextInfo}

ANALYSIS STEPS:
1. Look at the assessment name "${assessmentName}" - what subject is this about?
2. Read the description: "${assessmentPrompt}" - what specific subject/topic is mentioned?
3. Identify the main subject (e.g., Python, Mathematics, Chemistry, Biology, etc.)
4. Generate 15-20 specific subtopics that are components of that identified subject
5. Ensure ALL subtopics relate directly to the identified main subject

DO NOT generate generic "General Studies" topics. Focus on the specific subject identified from the name and description.

Return JSON with the identified main topic and its specific subtopics.`
            : `Generate comprehensive topics for this academic assessment:

${contextInfo}

Return JSON with topics array for the subject.`
        }
      ],
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 1000
    })

    const response = chatCompletion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response from OpenAI API')
    }

    // Debug logging for AI Mode
    if (isAIMode) {
      console.log('=== OPENAI RESPONSE DEBUG ===')
      console.log('Raw Response:', response)
      console.log('=========================')
    }

    try {
      // Parse the JSON response
      const result = JSON.parse(response)
      
      let topics = []
      let mainTopic = ''
      
      if (isAIMode && result.mainTopic && result.topics) {
        // New enhanced format with main topic detection
        mainTopic = result.mainTopic
        topics = result.topics
      } else if (Array.isArray(result)) {
        // Legacy format - direct array of topics
        topics = result
        mainTopic = mainSubject || 'Unknown Topic'
      } else if (result.topics && Array.isArray(result.topics)) {
        // Format with topics array but no mainTopic
        topics = result.topics
        mainTopic = mainSubject || 'Unknown Topic'
      } else {
        throw new Error('Invalid response format')
      }

      if (!Array.isArray(topics)) {
        throw new Error('Topics is not an array')
      }

      // Validate and clean topics
      const cleanedTopics = topics
        .filter(topic => typeof topic === 'string' && topic.trim().length > 0)
        .map(topic => topic.trim())
        .slice(0, 20) // Limit to 20 topics max

      if (cleanedTopics.length === 0) {
        throw new Error('No valid topics generated')
      }

      return NextResponse.json({
        success: true,
        topics: cleanedTopics,
        mainTopic: mainTopic,
        metadata: {
          subject: mainSubject,
          textbookName: textbookName || '',
          assessmentType,
          language,
          isAIMode: isAIMode || false,
          topicCount: cleanedTopics.length,
          generatedAt: new Date().toISOString(),
          method: isAIMode ? 'AI NLP Analysis' : 'AI Generated Topics',
          detectedMainTopic: mainTopic
        }
      })

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      console.log('Raw response:', response)
      
      // Fallback: extract topics from response text
      const fallbackTopics = response
        .split('\n')
        .map((line: string) => line.trim().replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''))
        .filter((line: string) => line.length > 3 && line.length < 50)
        .slice(0, 15)

      if (fallbackTopics.length > 0) {
        return NextResponse.json({
          success: true,
          topics: fallbackTopics,
          metadata: {
            subject: mainSubject,
            textbookName: textbookName || '',
            assessmentType,
            language,
            isAIMode: isAIMode || false,
            topicCount: fallbackTopics.length,
            generatedAt: new Date().toISOString(),
            method: 'Fallback Text Parsing',
            note: 'Used fallback parsing due to JSON parse error'
          }
        })
      }

      // Final fallback - generate basic topics based on subject
      const basicTopics = generateBasicTopics(subject)
      
      return NextResponse.json({
        success: true,
        topics: basicTopics,
        metadata: {
          subject: mainSubject,
          textbookName: textbookName || '',
          assessmentType,
          language,
          isAIMode: isAIMode || false,
          topicCount: basicTopics.length,
          generatedAt: new Date().toISOString(),
          method: 'Basic Topic Generation',
          note: 'Used basic fallback due to AI response parsing error'
        }
      })
    }

  } catch (error: any) {
    console.error('Topic generation error:', error)
    
    // Use enhanced fallback topics
    const fallbackTopicsArray = generateFallbackTopics(mainSubject, assessmentType)
    
    return NextResponse.json({
      success: true,
      topics: fallbackTopicsArray,
      mainTopic: mainSubject,
      message: 'Generated using fallback topics (API error occurred)',
      source: 'fallback_after_error',
      metadata: {
        subject: mainSubject,
        isAIMode,
        source: 'fallback_after_error',
        generatedAt: new Date().toISOString()
      }
    })
  }
}

// Basic topic generation based on subject
function generateBasicTopics(subject: string): string[] {
  const subjectLower = subject.toLowerCase()
  
  if (subjectLower.includes('math') || subjectLower.includes('algebra') || subjectLower.includes('calculus')) {
    return [
      'Basic Arithmetic Operations',
      'Algebraic Expressions',
      'Linear Equations',
      'Quadratic Functions',
      'Polynomial Operations',
      'Trigonometric Functions',
      'Logarithms and Exponentials',
      'Systems of Equations',
      'Geometry and Shapes',
      'Probability and Statistics',
      'Derivatives and Limits',
      'Integration Techniques',
      'Mathematical Proofs',
      'Set Theory',
      'Number Theory'
    ]
  } else if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry')) {
    return [
      'Scientific Method',
      'Atomic Structure',
      'Chemical Bonds',
      'States of Matter',
      'Energy and Work',
      'Forces and Motion',
      'Waves and Vibrations',
      'Electricity and Magnetism',
      'Thermodynamics',
      'Organic Chemistry',
      'Nuclear Physics',
      'Environmental Science',
      'Laboratory Safety',
      'Data Analysis',
      'Scientific Measurement'
    ]
  } else if (subjectLower.includes('english') || subjectLower.includes('literature') || subjectLower.includes('language')) {
    return [
      'Grammar and Syntax',
      'Vocabulary Development',
      'Reading Comprehension',
      'Essay Writing',
      'Literary Analysis',
      'Poetry Interpretation',
      'Character Development',
      'Plot Structure',
      'Rhetorical Devices',
      'Research Skills',
      'Citation Methods',
      'Public Speaking',
      'Creative Writing',
      'Media Literacy',
      'Critical Thinking'
    ]
  } else if (subjectLower.includes('history') || subjectLower.includes('social')) {
    return [
      'Ancient Civilizations',
      'Medieval Period',
      'Renaissance Era',
      'Industrial Revolution',
      'World Wars',
      'Political Systems',
      'Economic Principles',
      'Cultural Movements',
      'Geographic Regions',
      'Historical Documents',
      'Cause and Effect',
      'Timeline Analysis',
      'Primary Sources',
      'Historical Interpretation',
      'Contemporary Issues'
    ]
  } else if (subjectLower.includes('computer') || subjectLower.includes('programming') || subjectLower.includes('coding')) {
    return [
      'Programming Fundamentals',
      'Data Types and Variables',
      'Control Structures',
      'Functions and Methods',
      'Object-Oriented Programming',
      'Data Structures',
      'Algorithm Design',
      'Software Testing',
      'Database Concepts',
      'Web Development',
      'Version Control',
      'Software Engineering',
      'Network Programming',
      'Security Principles',
      'Project Management'
    ]
  } else {
    return [
      `${subject} Fundamentals`,
      `Basic ${subject} Concepts`,
      `${subject} Theory`,
      `Applied ${subject}`,
      `${subject} Methodology`,
      `${subject} Analysis`,
      `Advanced ${subject} Topics`,
      `${subject} Case Studies`,
      `${subject} Research Methods`,
      `${subject} Problem Solving`,
      `${subject} Applications`,
      `${subject} Principles`,
      `Contemporary ${subject}`,
      `${subject} Best Practices`,
      `Future of ${subject}`
    ]
  }
}
