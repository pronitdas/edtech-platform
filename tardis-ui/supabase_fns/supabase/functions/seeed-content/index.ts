import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

async function generateContent(prompt: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a content generator for educational material.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.5,
      }),
    })

    const data = await response.json()
    return data.choices[0]?.message?.content.trim() || 'No content generated.'
  } catch (error) {
    console.error('Error generating content:', error)
    return 'Error generating content.'
  }
}

async function generateQuiz(prompt: string): Promise<any[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a quiz generator.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      }),
    })

    const data = await response.json()
    return JSON.parse(data.choices[0]?.message?.content || '[]')
  } catch (error) {
    console.error('Error generating quiz:', error)
    return []
  }
}

serve(async req => {
  try {
    const { topic, subtopic, chaptertitle, chaptertext } = await req.json()

    // Step 1: Insert data into `chapters` table
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .insert([
        {
          topic,
          subtopic,
          chaptertitle,
          chapter: chaptertext,
          seeded: true,
        },
      ])
      .select()
      .single()

    if (chapterError)
      throw new Error(`Error inserting chapter: ${chapterError.message}`)

    const chapterId = chapter.id

    // Step 2: Generate summary, notes, and LaTeX content
    const summaryPrompt = `Summarize the chapter titled "${chaptertitle}" on the topic "${topic}" with the subtopic "${subtopic}".`
    const notesPrompt = `Write detailed notes for the chapter titled "${chaptertitle}" on the topic "${topic}" with the subtopic "${subtopic}". Format in Markdown with examples and explanations.`
    const latexPrompt = `Convert the key concepts of the chapter titled "${chaptertitle}" into LaTeX equations.`

    const [summary, notes, latexCode] = await Promise.all([
      generateContent(summaryPrompt),
      generateContent(notesPrompt),
      generateContent(latexPrompt),
    ])

    // Step 3: Insert generated content into `EdTechContent` table
    const { error: edTechError } = await supabase.from('EdTechContent').insert([
      {
        topic,
        subtopic,
        chapter: chaptertitle,
        summary,
        notes,
        latex_code: latexCode,
        chapter_id: chapterId,
      },
    ])

    if (edTechError)
      throw new Error(`Error inserting EdTech content: ${edTechError.message}`)

    // Step 4: Generate quizzes
    const quizPrompt = `Generate 5 multiple-choice questions for the chapter titled "${chaptertitle}" on the topic "${topic}" with the subtopic "${subtopic}". Return JSON format with "question", "options", and "answer".`
    const questions = await generateQuiz(quizPrompt)

    const { error: quizError } = await supabase.from('quiz').insert([
      {
        chapterid: chapterId,
        questions,
        level: 1, // Assuming level 1 for all quizzes; modify as needed
      },
    ])

    if (quizError) throw new Error(`Error inserting quiz: ${quizError.message}`)

    return new Response(
      JSON.stringify({
        message: 'Chapter, content, and quiz seeded successfully!',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
