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
  private baseURL: string;
  private apiKey?: string;
  private headers: Record<string, string>;

  constructor(baseURL: string = 'http://localhost:8000', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.headers = {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    };
  }

  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    params?: URLSearchParams,
    body?: any
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);
    
    if (params) {
      url.search = params.toString();
    }

    const options: RequestInit = {
      method,
      headers: this.headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Request failed with status ${response.status}`
      );
    }

    return await response.json();
  }

  // Health Check
  async checkHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // Process Knowledge
  async startProcessing(knowledgeId: number): Promise<{
    knowledge_id: number;
    status: string;
    message: string;
  }> {
    return this.request<{
      knowledge_id: number;
      status: string;
      message: string;
    }>(`/process/${knowledgeId}`);
  }

  // Retry Processing
  async retryProcessing(knowledgeId: number, request: RetryRequest): Promise<void> {
    return this.request<void>(`/process/${knowledgeId}/retry`, 'POST', undefined, request);
  }

  // Get Retry History
  async getRetryHistory(knowledgeId: number): Promise<RetryHistory> {
    return this.request<RetryHistory>(`/process/${knowledgeId}/retry-history`);
  }

  // Get Processing Status
  async getProcessingStatus(knowledgeId: number): Promise<ProcessingStatus> {
    return this.request<ProcessingStatus>(`/process/${knowledgeId}/status`);
  }

  // Get Image Status
  async getImageStatus(knowledgeId: number): Promise<ImageUploadStatus> {
    return this.request<ImageUploadStatus>(`/process/${knowledgeId}/images`);
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

    return this.request<ContentGenerationResponse>(`/generate-content/${knowledgeId}`, 'GET', params);
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

    return this.request<ChapterDataResponse>(`/chapters/${knowledgeId}`, 'GET', params);
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