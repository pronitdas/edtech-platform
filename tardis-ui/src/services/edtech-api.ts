import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export type ProcessingStatus = {
  knowledge_id: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'unknown';
  message: string;
  retry_count: number;
  result: Record<string, any> | null;
};

export type RetryRequest = {
  force?: boolean;
  max_retries?: number;
};

export type RetryHistoryEntry = {
  timestamp: string;
  type: string;
  message: string;
};

export type RetryHistory = {
  knowledge_id: number;
  retries: RetryHistoryEntry[];
};

export type ImageUploadStatus = {
  knowledge_id: number;
  total_images: number;
  uploaded_images: number;
  failed_images: string[];
};

export type ContentGenerationResponse = {
  success: boolean;
  data?: {
    chapters: Record<string, any>[];
  };
  error?: string;
};

export type ChapterDataResponse = {
  success: boolean;
  data?: Record<string, any>[];
  error?: string;
};

export type ContentType = 'notes' | 'summary' | 'quiz' | 'mindmap';

// API Client Class
export class EdTechAPI {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api/v1', apiKey?: string) {
    this.client = axios.create({
      baseURL,
      headers: apiKey ? {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      } : {
        'Content-Type': 'application/json',
      },
    });
  }

  // Health Check
  async checkHealth(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Process Knowledge
  async startProcessing(knowledgeId: number): Promise<{
    knowledge_id: number;
    status: string;
    message: string;
  }> {
    const response = await this.client.get(`/process/${knowledgeId}`);
    return response.data;
  }

  // Retry Processing
  async retryProcessing(knowledgeId: number, request: RetryRequest): Promise<void> {
    await this.client.post(`/process/${knowledgeId}/retry`, request);
  }

  // Get Retry History
  async getRetryHistory(knowledgeId: number): Promise<RetryHistory> {
    const response = await this.client.get(`/process/${knowledgeId}/retry-history`);
    return response.data;
  }

  // Get Processing Status
  async getProcessingStatus(knowledgeId: number): Promise<ProcessingStatus> {
    const response = await this.client.get(`/process/${knowledgeId}/status`);
    return response.data;
  }

  // Get Image Status
  async getImageStatus(knowledgeId: number): Promise<ImageUploadStatus> {
    const response = await this.client.get(`/process/${knowledgeId}/images`);
    return response.data;
  }

  // Generate Content
  async generateContent(
    knowledgeId: number,
    options: {
      chapterId?: string;
      types: ContentType[];
      language?: string;
    }
  ): Promise<ContentGenerationResponse> {
    const params = new URLSearchParams();
    if (options.chapterId) params.append('chapter_id', options.chapterId);
    options.types.forEach(type => params.append('types', type));
    if (options.language) params.append('language', options.language);

    const response = await this.client.get(`/generate-content/${knowledgeId}`, {
      params
    });
    return response.data;
  }

  // Get Chapter Data
  async getChapterData(
    knowledgeId: number,
    options?: {
      chapterId?: string;
      types?: string[];
      language?: string;
    }
  ): Promise<ChapterDataResponse> {
    const params = new URLSearchParams();
    if (options?.chapterId) params.append('chapter_id', options.chapterId);
    if (options?.types) options.types.forEach(type => params.append('types', type));
    if (options?.language) params.append('language', options.language);

    const response = await this.client.get(`/chapters/${knowledgeId}`, {
      params
    });
    return response.data;
  }

  // Error Handler Helper
  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'An unknown error occurred'
      );
    }
    throw error;
  }
}

// Usage Example:
/*
const api = new EdTechAPI('http://your-api-base-url/api/v1', 'your-api-key');

// Example: Generate content
try {
  const content = await api.generateContent(123, {
    types: ['notes', 'summary'],
    language: 'English'
  });
  console.log(content);
} catch (error) {
  console.error('Error generating content:', error);
}
*/ 