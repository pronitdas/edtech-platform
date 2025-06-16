import { OpenAIClient } from './openAi';
import { generateTeacherResponse } from './openAiFns';

export class RoleplayService {
    private openaiClient: OpenAIClient;

    constructor(openaiClient: OpenAIClient) {
        this.openaiClient = openaiClient;
    }

    /**
     * Generates the AI teacher's response based on the student's input.
     *
     * @param studentResponse - The latest response provided by the student (user).
     * @param teacherPersona - Identifier for the AI teacher's persona.
     * @param scenarioContext - The context of the current roleplay scenario.
     * @param language - The language code for the response (e.g., 'en', 'es').
     * @returns A promise that resolves to the generated teacher response string.
     */
    async getTeacherResponse(
        studentResponse: string,
        teacherPersona: string,
        scenarioContext: string,
        language: string
    ): Promise<string> {
        console.log(`Generating teacher response for persona: ${teacherPersona} in language: ${language}`);
        try {
            const teacherResponse = await generateTeacherResponse(
                this.openaiClient,
                studentResponse,
                teacherPersona,
                scenarioContext,
                language
            );
            return teacherResponse;
        } catch (error) {
            console.error("RoleplayService: Error getting teacher response:", error);
            // Reuse the fallback logic from openAiFns, including basic localization
            return language === 'es' ? "Ese es un punto interesante. ¿Puedes dar más detalles?" : "That's an interesting point. Can you elaborate further?";
        }
    }

    // Future methods for evaluation etc. can be added here
} 