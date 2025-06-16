// promptsConfig.ts
export const promptsConfig = {
    notes: (language: string) => `
You are a content expert at {{topic}}-{{subtopic}} skilled at distilling information to its core points in ${language}.
Expanding upon the following content into detailed, informative notes with easily digestible explanations that highlight the main ideas, key takeaways, and any relevant context.
Generate content in Markdown format with proper usage of LaTeX syntax for mathematical expressions. Use $...$ for inline LaTeX and $$...$$ for block LaTeX. 
Ensure the text is well-structured, concise, and includes a mix of Markdown headings, lists, and explanatory text along with mathematical formulas.
Focus on providing clear examples and explanations, combining text and mathematical formulas seamlessly. Keep the content engaging and visually intuitive.
in ${language}
Content:`,

    summary: (language: string) => `
You are a content expert skilled at distilling information to its core points in ${language}. 
Summarize the following content into concise, easily digestible points that highlight the main ideas, key takeaways, and any relevant context.
Structure the summary in ${language} with headers for each major topic, followed by brief, insightful bullet points or short paragraphs.
Format the output in Markdown and include any contextual insights that add depth to the summary in ${language}.

Content:`,

    mindMap: `You are a mind map generator specialized in creating educational content structures.

Task: Generate a comprehensive mind map structure as a JSON object with nodes and edges arrays.

Requirements:
1. Main topic should be type "input" with id "1"
2. Leaf nodes should be type "output"
3. Intermediate nodes should be type "default"
4. Create at least 4 levels of hierarchy
5. Ensure connections are logical and flow from general to specific
6. Include key concepts, relationships, and important details
7. Make the structure easily understandable for students
8. Generate only valid JSON with no markdown formatting

The response must strictly follow this JSON structure:
{
  "nodes": [
    { "id": "string", "type": "input|default|output", "data": { "label": "string" } }
  ],
  "edges": [
    { "id": "string", "source": "string", "target": "string" }
  ]
}`,

    structuredQuestions: (count: number, language: string) => `
Generate ${count} multiple-choice questions based on the following content in ${language} in this format:
[{"question":"something", "options": [], "answer":"answer"}]:`,

    threeDPrompts: `
10 image prompts for 3d model generation
`
};












// imageGeneration.ts
// Just a placeholder for DALL-E or image generation logic.
// Adjust as needed.
export async function generateImages(
    openaiApiKey: string,
    multipleImagePoints: string[]
): Promise<string[]> {
    const imagePromises = multipleImagePoints.map(async (point) => {
        const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: `Create a description for: ${point}`,
                n: 1, size: "1024x1024",
                quality: "standard",
            }),
        });
        const imageData = await imageResponse.json();
        return imageData.data[0].url;
    });

    return Promise.all(imagePromises);
}


// Example usage:
// const openaiClient = new OpenAIClient(openaiApiKey);
// (async () => {
//     const notes = await generateNotes(openaiClient, "Your input text here...", "English");
//     console.log(notes.join("\n\n"));
// })();

