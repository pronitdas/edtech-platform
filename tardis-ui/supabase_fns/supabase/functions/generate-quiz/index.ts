import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'
const supabaseUrl = 'https://onyibiwnfwxatadlkygz.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
if (!supabaseKey) {
    throw new Error('SUPABASE_KEY environment variable is required')
}
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MESHY_API_KEY = Deno.env.get("MESHY_API_KEY")!;
const MESHY_API_BASE_URL = "https://api.meshy.ai/v1/tasks";

async function fetchDataFromOpenAI(text: string, prompt: string): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: `${prompt}:\n\n${text}` },
        ],
        max_tokens: 1000,
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    return data.choices[0]?.message?.content.trim() || "No response from OpenAI.";
  } catch (error) {
    console.error("Error fetching data from OpenAI:", error);
    return "Error fetching data.";
  }
}

async function fetchStructuredDataFromOpenAI(text: string, prompt: string): Promise<any> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: `${prompt}:\n\n${text}` },
        ],
        max_tokens: 1000,
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    return JSON.parse(data.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Error fetching structured data from OpenAI:", error);
    return {};
  }
}

async function handleGenerateQuestions(text: string, questionsCount = 10): Promise<any[]> {
  const prompt = `Generate multiple-choice questions from the content below. Format as JSON with fields for "question", "options", and "answer". Content:\n\n${text}`;
  const structuredData = await fetchStructuredDataFromOpenAI(text, prompt);
  return structuredData?.questions || [];
}

async function generateImages(prompts: string[]): Promise<string[]> {
  const imagePromises = prompts.map(async (prompt) => {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    const data = await response.json();
    return data.data[0]?.url || "Image generation failed.";
  });

  return await Promise.all(imagePromises);
}

async function create3DModelTask(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(MESHY_API_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MESHY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        mode: "preview",
        art_style: "realistic",
        negative_prompt: "low quality, low resolution, low poly, ugly",
      }),
    });

    const data = await response.json();
    return data.id || null;
  } catch (error) {
    console.error("Error creating 3D model task:", error);
    return null;
  }
}

serve(async (req) => {
  const { type, payload } = await req.json();

  switch (type) {
    case "fetchData":
      return new Response(await fetchDataFromOpenAI(payload.text, payload.prompt));
    case "fetchStructuredData":
      return new Response(JSON.stringify(await fetchStructuredDataFromOpenAI(payload.text, payload.prompt)));
    case "generateQuestions":
      return new Response(JSON.stringify(await handleGenerateQuestions(payload.text)));
    case "generateImages":
      return new Response(JSON.stringify(await generateImages(payload.prompts)));
    case "create3DModelTask":
      return new Response(await create3DModelTask(payload.prompt));
    default:
      return new Response("Invalid request type.", { status: 400 });
  }
});
