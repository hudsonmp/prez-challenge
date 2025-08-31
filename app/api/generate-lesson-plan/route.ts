import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(request: NextRequest) {
  try {
    console.log('📚 Starting lesson plan generation...')
    
    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const duration = formData.get('duration') as string
    const teacherPrompt = formData.get('teacherPrompt') as string

    console.log(`📄 PDF file: ${pdfFile?.name}, Duration: ${duration} days`)

    if (!pdfFile) {
      console.error('❌ No PDF file provided')
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Compute the next weekday start date (skip Sat/Sun)
    const computeNextWeekdayISO = (): string => {
      const date = new Date()
      // move to tomorrow
      date.setDate(date.getDate() + 1)
      // 0 = Sun, 6 = Sat
      while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() + 1)
      }
      return date.toISOString().split('T')[0]
    }
    const startDateISO = computeNextWeekdayISO()

    // Upload PDF to OpenAI Files and analyze with Assistants (file_search)
    console.log('🔍 Uploading PDF to OpenAI Files for analysis...')

    // Upload the user's PDF directly; the Web File from Next API is acceptable
    const uploadedFile = await openai.files.create({
      file: pdfFile as any,
      purpose: 'assistants'
    })

    console.log(`📤 Uploaded to OpenAI Files: ${uploadedFile.id}`)

    // Generate lesson plans using ChatGPT
    console.log('🤖 Sending request to OpenAI...')
    
    // Create an Assistant with file_search and strict JSON instructions
    const assistant = await openai.beta.assistants.create({
      model: 'gpt-4o',
      name: 'Lesson Plan Generator',
      tools: [{ type: 'file_search' }],
      instructions: `You are an expert curriculum designer and educator. You will analyze an attached textbook PDF and create comprehensive lesson plans.

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text.

Return ONLY this JSON structure (no markdown, no code blocks):
{
  "lessonPlans": {
    "2024-01-15": {
      "title": "Introduction to Physics Concepts",
      "date": "2024-01-15",
      "duration": "Approximately 1 hour",
      "notes": ["Key concept 1", "Key concept 2", "Important formula"],
      "reviewQuestions": ["What is the definition of...?", "How do you calculate...?"],
      "miniQuiz": [
        {
          "question": "What is the SI unit of force?",
          "options": ["Newton", "Joule", "Watt", "Pascal"],
          "correctAnswer": 0,
          "explanation": "The Newton is the SI unit of force, named after Sir Isaac Newton."
        }
      ],
      "standards": ["NGSS-HS-PS2-1", "Chapter 1 Objectives"],
      "chapter": "Chapter 1: Introduction to Physics"
    }
  }
}

Requirements:
- Create lesson plans for each day (use consecutive dates starting from tomorrow)
- Each lesson should be approximately 1 hour
- Include 5-8 student notes per lesson
- Include 3-5 review questions per lesson
- Include 3-5 quiz questions per lesson with explanations
- Base ALL content directly on the attached textbook PDF
- Use real dates in YYYY-MM-DD format
- Start on ${startDateISO} and schedule on weekdays only (skip Sat/Sun)
- Prefix each lesson title with "Day N - " where N starts at 1
- Also include a field "dayNumber": N for each lesson`
    })

    // Create a thread and attach the uploaded file
    const thread = await openai.beta.threads.create()

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Please analyze the attached textbook PDF and create a ${duration}-day lesson plan.\n\n${teacherPrompt ? `Additional instructions: ${teacherPrompt}` : ''}\n\nStart on ${startDateISO}, schedule on weekdays only (skip Sat/Sun). Prefix titles with "Day N - " and include a numeric dayNumber field.`,
      attachments: [
        {
          file_id: uploadedFile.id,
          tools: [{ type: 'file_search' }]
        }
      ]
    })

    // Run the assistant
    let run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    })

    // Poll until completed or failed
    const start = Date.now()
    const timeoutMs = 90_000
    while (run.status !== 'completed') {
      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        console.error('❌ Run failed with status:', run.status, run.last_error)
        return NextResponse.json({ error: 'Assistant run failed', details: run.last_error || run.status }, { status: 500 })
      }
      if (Date.now() - start > timeoutMs) {
        console.error('⏱️ Run timed out')
        return NextResponse.json({ error: 'Timed out while generating lesson plan' }, { status: 504 })
      }
      await new Promise(r => setTimeout(r, 1500))
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    }

    // Get the latest assistant message
    const messages = await openai.beta.threads.messages.list(thread.id, { limit: 10 })
    const assistantMessage = messages.data.find(m => m.role === 'assistant') || messages.data[0]
    if (!assistantMessage) {
      return NextResponse.json({ error: 'No assistant message found' }, { status: 500 })
    }

    // Extract text content
    let responseText = ''
    for (const part of assistantMessage.content as any[]) {
      if (part.type === 'text' && part.text?.value) {
        responseText += part.text.value
      }
    }

    console.log('✅ Received response from OpenAI')

    if (!responseText) {
      console.error('❌ No response content from OpenAI')
      throw new Error('No response from OpenAI')
    }

    console.log('📝 OpenAI response length:', responseText.length)
    console.log('🔍 First 200 chars of response:', responseText.substring(0, 200))

    // Parse the JSON response
    let lessonPlansData
    try {
      // Clean the response text
      let cleanedResponse = responseText.trim()
      
      // Remove any markdown code block formatting
      if (cleanedResponse.includes('```json')) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim()
        }
      } else if (cleanedResponse.includes('```')) {
        const jsonMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim()
        }
      }

      lessonPlansData = JSON.parse(cleanedResponse)
      console.log('✅ Successfully parsed lesson plan JSON')
      
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', parseError)
      console.error('📄 Full response text:', responseText)
      
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response. The AI may have returned invalid JSON.', 
          details: responseText.substring(0, 500) + '...'
        }, 
        { status: 500 }
      )
    }

    // Validate the response structure
    if (!lessonPlansData.lessonPlans || typeof lessonPlansData.lessonPlans !== 'object') {
      console.error('❌ Invalid lesson plan structure:', lessonPlansData)
      return NextResponse.json(
        { error: 'Invalid lesson plan structure returned from AI' },
        { status: 500 }
      )
    }

    console.log('🎉 Lesson plan generation completed successfully')
    return NextResponse.json(lessonPlansData)

  } catch (error) {
    console.error('❌ Error generating lesson plan:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid or missing. Please check your configuration.' },
          { status: 401 }
        )
      } else if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded. Please check your billing settings.' },
          { status: 429 }
        )
      } else if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate lesson plan. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Lesson Plan Generator API' })
}
