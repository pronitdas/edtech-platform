// openaiFunctions.ts
import { promptsConfig } from './promptsConfig';
import { extractSubheadings, windowedChunk } from './utils';
import { OpenAIClient } from './openAi';

interface GenerateQuestionsOutput {
    question: string;
    options: string[];
    answer: string;
}
// ... existing code ...

interface MindMapNode {
    id: string;
    type?: 'input' | 'default' | 'output';
    data: { label: string };
}

interface MindMapEdge {
    id: string;
    source: string;
    target: string;
}

interface MindMapStructure {
    nodes: MindMapNode[];
    edges: MindMapEdge[];
}

export async function generateMindMapStructure(
    openaiClient: OpenAIClient,
    text: string
): Promise<MindMapStructure> {
    if (!text || text.length < 10) {
        return { nodes: [], edges: [] };
    }

    const jsonSchema = {
        "name": "mindmap_schema",
        "strict": true,
        "schema": {
            "type": "object",
            "properties": {
                "nodes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": { "type": "string" },
                            "type": { "type": "string", "enum": ["input", "default", "output"] },
                            "data": {
                                "type": "object",
                                "properties": {
                                    "label": { "type": "string" }
                                },
                                "additionalProperties": false,
                                "required": ["label"]
                            }
                        },
                        "required": ["id", "type", "data"],
                        "additionalProperties": false
                    }
                },
                "edges": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": { "type": "string" },
                            "source": { "type": "string" },
                            "target": { "type": "string" }
                        },
                        "additionalProperties": false,
                        "required": ["id", "source", "target"]
                    }
                }
            },
            "required": ["nodes", "edges"],
            "additionalProperties": false
        }
    };

    try {
        const result = await openaiClient.chatCompletion([
            {
                role: "system",
                content: promptsConfig.mindMap
            },
            {
                role: "user",
                content: text
            }
        ], "gpt-4o-2024-08-06", 800, undefined, jsonSchema);

        return JSON.parse(result);
    } catch (error) {
        console.error("Error generating mind map structure:", error);
        return {
            nodes: [{
                id: '1',
                type: 'input',
                data: { label: 'Error generating mind map' }
            }],
            edges: []
        };
    }
}

export async function generateChunkedContent(
    openaiClient: OpenAIClient,
    text: string,
    prompt: string,
    tokenSize: number = 20
): Promise<string[]> {
    if (!text || text.length < 10) return [];

    // Heuristic to decide chunking strategy
    const subheadings = extractSubheadings(text, 2).filter(h => h !== "Introduction");
    const forcedChunks = windowedChunk(text.split(". "), 10, 2);
    const chunks = subheadings.length < 3 ? forcedChunks : subheadings.map(h => [h]);

    const results: string[] = [];
    for (const chunk of chunks) {
        const chunkText = Array.isArray(chunk) ? chunk.join(" ") : chunk;
        try {
            const result = await openaiClient.chatCompletion([
                { role: "system", content: prompt },
                { role: "user", content: chunkText }
            ], "gpt-4o-mini", tokenSize);
            results.push(result);
        } catch (error) {
            console.error("Error generating notes for chunk:", error);
        }
    }

    return results;
}

export async function generateNotes(
    openaiClient: OpenAIClient,
    text: string,
    language: string
): Promise<string[]> {
    console.log("stepping donw")
    const prompt = promptsConfig.notes(language);
    return await generateChunkedContent(openaiClient, text, prompt, 500);
}

export async function generateSummary(
    openaiClient: OpenAIClient,
    text: string,
    language: string
): Promise<string[]> {
    const prompt = promptsConfig.summary(language);
    return generateChunkedContent(openaiClient, text, prompt, 500);
}

export async function generateMindMap(
    openaiClient: OpenAIClient,
    text: string
): Promise<string[]> {
    const prompt = promptsConfig.mindMap;
    return generateChunkedContent(openaiClient, text, prompt, 200);
}

export async function generate3DPrompts(
    openaiClient: OpenAIClient,
    text: string
): Promise<string> {
    if (!text || text.length < 10) return "";
    const prompt = promptsConfig.threeDPrompts;
    const result = await openaiClient.chatCompletion([
        { role: "system", content: prompt },
        { role: "user", content: text }
    ], "gpt-4o-mini", 20);
    return result;
}


export async function generateQuestions(
    openaiClient: OpenAIClient,
    text: string,
    language: string,
    questionsCount: number = 10
): Promise<GenerateQuestionsOutput[]> {
    if (!text || text.length < 10) return [];

    const maxQuestionsPerChunk = 10;
    const maxRetries = 3;

    const subheadings = extractSubheadings(text, 2).filter(a => a != "Introduction");
    const forced = windowedChunk(text.split("."), 20, 2);
    const chunks = subheadings.length > 0 ? subheadings.map(h => [h]) : forced;

    const accumulatedQuestions: GenerateQuestionsOutput[] = [];

    // Helper for retries
    async function fetchWithRetry(chunk: string[], retries = maxRetries): Promise<GenerateQuestionsOutput[]> {
        const prompt = promptsConfig.structuredQuestions(maxQuestionsPerChunk, language);
        const jsonSchema = {
            "name": "question_answer_schema",
            "strict": true,
            "schema": {
                "type": "object",
                "properties": {
                    "questions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "question": { "type": "string" },
                                "options": {
                                    "type": "array",
                                    "items": { "type": "string" }
                                },
                                "answer": { "type": "string" }
                            },
                            "required": ["question", "options", "answer"],
                            "additionalProperties": false
                        }
                    }
                },
                "required": ["questions"],
                "additionalProperties": false
            }
        };

        try {
            const result = await openaiClient.chatCompletion([
                { role: "system", content: prompt },
                { role: "user", content: chunk.join(" ") }
            ], "gpt-4o-2024-08-06", 4096, undefined, jsonSchema);

            const parsed = JSON.parse(result);
            return parsed.questions;
        } catch (error) {
            if (retries > 0) {
                console.warn(`Retrying... attempts left: ${retries}`);
                return fetchWithRetry(chunk, retries - 1);
            } else {
                console.error("Failed to fetch questions after multiple attempts:", error);
                return [];
            }
        }
    }

    for (const chunk of chunks) {
        const questions = await fetchWithRetry(chunk);
        accumulatedQuestions.push(...questions);

        if (accumulatedQuestions.length >= questionsCount) {
            break;
        }
    }

    return accumulatedQuestions.slice(0, questionsCount);
}

// --- Roleplay Functions Start ---

// Comment out or remove old roleplay functions
/*
export async function generateRoleplayQuestion(
    openaiClient: OpenAIClient,
    studentPersonality: string,
    teacherResponse: string,
    responseType: 'summary' | 'response'
): Promise<string> { ... }

interface EvaluationResponse { ... }

export async function evaluateTeacherResponse(
    openaiClient: OpenAIClient,
    response: string,
    responseType: 'summary' | 'response',
    context: string | null,
    criteria: string[]
): Promise<EvaluationResponse> { ... }
*/

// NEW: Function for AI to generate Teacher response
export async function generateTeacherResponse(
    openaiClient: OpenAIClient,
    studentResponse: string,
    teacherPersona: string, 
    scenarioContext: string,
    language: string
): Promise<string> {
    // Refined prompt structure using message history

    try {
        const result = await openaiClient.chatCompletion(
            [
                {
                  role: "system",
                  content: `You are roleplaying as a teacher with the persona: ${teacherPersona}. You must strictly adhere to this persona. The scenario context is: ${scenarioContext}. Respond directly to the student in character, using the scenario context. **IMPORTANT: Respond ONLY in the following language: ${language}**`
                },
                {
                  role: "user",
                  content: `Scenario Reminder: "${scenarioContext}"
Student Input: "${studentResponse}"

Based on the scenario and my input, what is your response as the teacher (${teacherPersona})? **Remember to respond ONLY in ${language}.**`
                },
            ],
            "gpt-4o-mini",
            -1
        );
        return result;
    } catch (error) {
        console.error("Error generating teacher response:", error);
        // Provide a generic fallback, ideally this would also be localized
        return language === 'es' ? "Ese es un punto interesante. ¿Puedes dar más detalles?" : "That's an interesting point. Can you elaborate further?";
    }
}

// --- Roleplay Functions End ---

// Existing metaMap might be here or at the end of the file
// Assuming it's at the end based on common patterns

// ... potentially other existing functions ...

// Update or add the metaMap export
export const metaMap = {
    notes: generateNotes,
    summary: generateSummary,
    quiz: generateQuestions,
    mindmapStructure: generateMindMapStructure,
    // Add new teacher response function
    teacherResponse: generateTeacherResponse,
    // Remove or comment out old roleplay functions
    // roleplayQuestion: generateRoleplayQuestion,
    // evaluateResponse: evaluateTeacherResponse
    // Add other existing mappings if they were present
    // e.g., mindmap: generateMindMap, threeDPrompts: generate3DPrompts
};

// Ensure all previously exported functions remain exported
// ... potentially export other functions if they were defined after generateQuestions ...

// Final check: Ensure all imports and interfaces are correctly placed/defined.
