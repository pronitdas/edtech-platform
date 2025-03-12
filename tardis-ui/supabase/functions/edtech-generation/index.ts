// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import { Configuration, OpenAIApi } from "openai"
import { generateNotes, generateSummary, generateQuestions, generateMindMapStructure } from './lib/openAiFns.ts'
import { OpenAIClient } from './lib/openAi.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { edtechId, chapter, knowledgeId, types, language } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )

    // Initialize OpenAI client
    const openaiClient = new OpenAIClient(Deno.env.get('OPENAI_API_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk2YWUxMjU4LTJiMDUtNDMxNi05NWJmLWMzY2RkNjk1ZDU2ZiJ9.-G-w97x4wnbsHsIOGT50cbTgfRdAvPIn3YzSclGZauo')

    const typeGenerators = {
      notes: generateNotes,
      summary: generateSummary,
      quiz: generateQuestions,
      mindmap: generateMindMapStructure,
    }

    // Generate content for each requested type
    const results = {}
    await Promise.all(types.map(async (type) => {
      if (!typeGenerators[type]) {
        console.log(`${type} not supported`)
        return
      }

      const generated = await typeGenerators[type](openaiClient, chapter.chapter, language)
      results[type] = (type === "quiz" || type === "mindmap") ? generated : generated.join("|||||")
    }))

    // Update content in the database
    const { data, error } = await supabaseClient
      .from('edtech_content')
      .upsert({
        id: edtechId,
        chapter_id: chapter.id,
        knowledge_id: knowledgeId,
        language,
        ...results
      })
      .select()
    console.log(data)
    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/edtech-genration' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
