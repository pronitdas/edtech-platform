// openaiClient.ts
interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class OpenAIClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chatCompletion(
        messages: OpenAIMessage[],
        model: string = "gpt-3.5-turbo",
        max_tokens: number = 4096,
        jsonSchema?: any
    ): Promise<string> {
        const body: any = {
            model,
            messages,
            max_tokens
        };

        if (jsonSchema) {
            body.response_format = {
                type: "json_schema",
                json_schema: jsonSchema
            };
        }

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (data?.choices?.[0]?.message?.content) {
                return data.choices[0].message.content.trim();
            }
            throw new Error("No response content");
        } catch (error) {
            console.error("Error fetching data from OpenAI:", error);
            return "Error in fetching data.";
        }
    }
}
