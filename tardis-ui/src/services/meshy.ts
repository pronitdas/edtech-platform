// meshClient.ts
// For interacting with Meshy API
const MESHY_API_BASE_URL = "https://api.meshy.ai/v1/tasks";
const MESHY_API_KEY = "YOUR_MESHY_API_KEY"; // Replace with your API key

export class MeshyClient {
    private apiKey: string;

    constructor(apiKey: string = MESHY_API_KEY) {
        this.apiKey = apiKey;
    }

    async create3DModelTask(prompt: string): Promise<string | null> {
        try {
            const response = await fetch(`${MESHY_API_BASE_URL}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
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

    async checkTaskStatus(taskId: string): Promise<any> {
        try {
            const response = await fetch(`${MESHY_API_BASE_URL}/${taskId}/status`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            return await response.json();
        } catch (error) {
            console.error("Error checking task status:", error);
            return null;
        }
    }
}