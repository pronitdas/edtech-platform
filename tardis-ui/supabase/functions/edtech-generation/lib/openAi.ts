// openaiClient.ts
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";


interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey, // This is the default and can be omitted
    });
    this.client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello, world!" }],
    });
  }

  async chatCompletion(
    messages: OpenAIMessage[],
    model: string = "gpt-3.5-turbo",
    max_tokens: number = 4096,
    jsonSchema?: any
  ): Promise<string> {
    try {
      const params: any = {
        model,
        messages,
        max_tokens
      };

      if (jsonSchema) {
        params.response_format = {
          type: "json_schema",
          schema: jsonSchema
        };
      }

      const response = await this.client.chat.completions.create(params);

      if (response.choices[0]?.message?.content) {
        return response.choices[0].message.content.trim();
      }
      throw new Error("No response content");
    } catch (error) {
      console.error("Error fetching data from OpenAI:", error);
      return "Error in fetching data.";
    }
  }
}
