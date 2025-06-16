// openaiClient.ts -> completionClient.ts
interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OpenAIClient {
    generateResponse: (prompt: string) => Promise<string>;
}

export class OpenAIService implements OpenAIClient {
    private apiKey?: string; // Made apiKey optional

    constructor(apiKey?: string) { // Made apiKey optional
        this.apiKey = apiKey;
    }

    async chatCompletion(
        messages: OpenAIMessage[],
        model: string = "microsoft_-_phi-3-mini-128k-instruct", // Default model from example
        max_tokens: number = -1, // Default max_tokens from example
        temperature: number = 0.7, // Added temperature
        stream: boolean = false // Added stream
        // Removed jsonSchema parameter
    ): Promise<string> {
        const body: any = {
            model,
            messages,
            temperature, // Added temperature
            max_tokens,
            stream // Added stream
        };
        try {
            // Updated URL to local endpoint
            const response = await fetch("http://localhost:1234/v1/chat/completions", {
                method: "POST",
                headers: {
                    // Removed Authorization header
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            // Handle potential streaming response structure if stream=true later
            if (data?.choices?.[0]?.message?.content) {
                return data.choices[0].message.content.trim();
            }
            // Improved error handling slightly
            console.error("Unexpected response structure:", data);
            throw new Error("No response content or unexpected format");
        } catch (error) {
            console.error("Error fetching data from local LLM:", error);
            // Return a more specific error message
            return `Error fetching data: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    async generateResponse(prompt: string): Promise<string> {
        // Implementation details
        throw new Error('Not implemented');
    }
}
