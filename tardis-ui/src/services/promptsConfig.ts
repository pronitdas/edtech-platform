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

    mindMap: `
- Role: You're a text processor to summarize a piece of text into a mind map.

- Step of task:
  1. Generate a title for user's 'TEXT'.
  2. Classify the 'TEXT' into sections of a mind map.
  3. If the subject matter is really complex, split them into sub-sections and sub-subsections. 
  4. Add a short content summary of the bottom level section.

- Output requirement:
  - Generate at least 4 levels.
  - Always try to maximize the number of sub-sections.
  - MUST IN FORMAT OF MARKDOWN

-TEXT-`,

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

