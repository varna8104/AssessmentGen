import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Note: All non-LLM fallbacks removed as per requirement

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
      numberOfQuestions,
      assessmentPrompt,
      selectedTopics,
      isAIMode,
      isManualMode,
      skipTopicSelection,
      isAdditionalQuestions,
      existingQuestions
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
      // Try AI generation first with OpenAI
      console.log('🤖 Attempting AI generation with OpenAI...')
      
  const prompt = `Create exactly ${actualQuestionCount} unique, topic-specific questions about "${assessmentName}".

Return ONLY valid JSON in this format (no markdown fences):
{
  "questions": [
    {
  "type": "mcq",
      "question": "Your question here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
  "explanation": "Why this is correct",
  "difficulty": "Easy | Medium | Hard"
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
  // Enforce JSON-only output for consistency
  // @ts-ignore - response_format is supported on suitable models at runtime
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

      // Normalize AI response to ensure UI-required fields exist (difficulty, points, timeLimit, type, id)
      const requestedDifficulty = (difficulty as string | undefined) || undefined
      const normalizedDifficulty = (val: string | undefined, index: number, total: number) => {
        if (val && typeof val === 'string' && val.trim()) return val
        if (requestedDifficulty) return requestedDifficulty
        // Distribute Easy/Medium/Hard if not provided and no requested difficulty
        if (index < total / 3) return 'Easy'
        if (index < (2 * total) / 3) return 'Medium'
        return 'Hard'
      }

      const totalQuestions = Array.isArray(aiAssessment?.questions) ? aiAssessment.questions.length : 0
      const normalizedQuestions = (aiAssessment?.questions || []).map((q: any, i: number) => {
        const id = q.id || `ai_q${i + 1}_${Date.now() + i}`
        const type = q.type === 'mcq' ? 'multiple-choice' : (q.type || 'multiple-choice')
        const points = typeof q.points === 'number' && !Number.isNaN(q.points) ? q.points : 1
        const timeLimit = typeof q.timeLimit === 'number' && !Number.isNaN(q.timeLimit) ? q.timeLimit : 30
        const diff = normalizedDifficulty(q.difficulty, i, totalQuestions)
        return { ...q, id, type, points, timeLimit, difficulty: diff }
      })

      const normalizedAssessment = {
        ...aiAssessment,
        questions: normalizedQuestions,
        title: aiAssessment?.title || assessmentName,
        description: aiAssessment?.description || `Comprehensive assessment covering key concepts and principles in ${assessmentName}`,
        totalPoints: aiAssessment?.totalPoints || normalizedQuestions.reduce((sum: number, q: any) => sum + (q.points || 1), 0),
        // Estimate minutes if not provided: ~1.5 min per question
        estimatedTime: aiAssessment?.estimatedTime || Math.ceil(normalizedQuestions.length * 1.5)
      }

      console.log('✅ AI generation successful')
      return NextResponse.json({
        success: true,
        assessment: normalizedAssessment,
        metadata: {
          source: 'ai',
          generatedAt: new Date().toISOString(),
          numberOfQuestions: normalizedAssessment.questions.length,
          // Echo back key request fields so the UI can render and reuse them
          assessmentName,
          assessmentType,
          language,
          difficulty: requestedDifficulty || undefined,
          easyToHard: !!easyToHard,
          requestedNumberOfQuestions: numberOfQuestions,
          isAIMode: !!isAIMode,
          isManualMode: !!isManualMode,
          skipTopicSelection: !!skipTopicSelection,
          isAdditionalQuestions: !!isAdditionalQuestions,
          existingQuestions: existingQuestions ?? undefined,
          assessmentPrompt: assessmentPrompt ?? undefined,
          selectedTopics: selectedTopics ?? undefined
        }
      })

    } catch (aiError: any) {
      console.error('❌ AI generation failed:', aiError?.message || aiError)
      return NextResponse.json(
        { success: false, error: 'AI generation failed', details: aiError?.message || String(aiError) },
        { status: 502 }
      )
    }

  } catch (error: any) {
    console.error('❌ Critical error:', error?.message || error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
