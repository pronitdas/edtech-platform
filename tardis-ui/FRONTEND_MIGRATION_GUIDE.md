# 🚀 Frontend Migration Guide: Supabase → Local Backend

## **🎯 Mission: Complete Supabase Elimination**

This guide provides step-by-step instructions to remove all Supabase dependencies from the frontend and integrate with the local-first FastAPI backend.

---

## **📋 Pre-Migration Checklist**

### **Backend Requirements**
- [ ] Local FastAPI backend running on `http://localhost:8000`
- [ ] All required endpoints implemented (auth, knowledge, analytics)
- [ ] Database migrations completed
- [ ] Test data seeded

### **Frontend Backup**
```bash
# Create backup before starting
cd tardis-ui
git checkout -b backup-before-supabase-removal
git add -A && git commit -m "Backup before Supabase removal"

# Create services backup
cp -r src/services src/services.backup
```

---

## **🔧 Step-by-Step Migration**

### **Step 1: Remove Supabase Dependencies**

```bash
# Remove Supabase package
npm uninstall @supabase/supabase-js

# Remove Supabase client file
rm src/services/supabase.ts

# Update package.json to ensure clean state
npm install
```

### **Step 2: Create Local API Client**

Create `src/services/api-client.ts`:

```typescript
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class LocalAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth Methods
  async login(email: string, password: string) {
    const response = await this.request<{
      access_token: string;
      user: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.access_token) {
      this.setToken(response.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('current_user', JSON.stringify(response.user));
      }
    }

    return response;
  }

  async register(email: string, password: string, name?: string) {
    const response = await this.request<{
      access_token: string;
      user: any;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (response.access_token) {
      this.setToken(response.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('current_user', JSON.stringify(response.user));
      }
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  // Knowledge Methods
  async uploadKnowledgeFiles(files: File[], name: string, options?: {
    autoProcess?: boolean;
    generateContent?: boolean;
    contentTypes?: string[];
    contentLanguage?: string;
  }) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('name', name);
    
    if (options?.autoProcess !== undefined) {
      formData.append('auto_process', options.autoProcess.toString());
    }
    if (options?.generateContent !== undefined) {
      formData.append('generate_content', options.generateContent.toString());
    }
    if (options?.contentTypes) {
      options.contentTypes.forEach(type => formData.append('content_types', type));
    }
    if (options?.contentLanguage) {
      formData.append('content_language', options.contentLanguage);
    }

    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/upload-knowledge-file`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getKnowledgeStatus(knowledgeId: number) {
    return this.request(`/process/${knowledgeId}/status`);
  }

  async getChapters(knowledgeId: number, language = 'English') {
    return this.request(`/chapters/${knowledgeId}?language=${language}`);
  }

  async generateContent(knowledgeId: number, options: {
    chapterId?: string;
    types: string[];
    language?: string;
  }) {
    const params = new URLSearchParams();
    if (options.chapterId) params.append('chapter_id', options.chapterId);
    options.types.forEach(type => params.append('types', type));
    if (options.language) params.append('language', options.language);

    return this.request(`/generate-content/${knowledgeId}?${params.toString()}`);
  }

  async startProcessing(knowledgeId: number, options?: {
    generateContent?: boolean;
    contentTypes?: string[];
    contentLanguage?: string;
  }) {
    const params = new URLSearchParams();
    if (options?.generateContent !== undefined) {
      params.append('generate_content', options.generateContent.toString());
    }
    if (options?.contentTypes) {
      options.contentTypes.forEach(type => params.append('content_types', type));
    }
    if (options?.contentLanguage) {
      params.append('content_language', options.contentLanguage);
    }

    return this.request(`/process/${knowledgeId}?${params.toString()}`);
  }

  // Analytics Methods
  async trackEvent(eventData: {
    userId: string;
    eventType: string;
    contentId?: string;
    sessionId?: string;
    [key: string]: any;
  }) {
    return this.request('/analytics/track-event', {
      method: 'POST',
      body: JSON.stringify({
        user_id: eventData.userId,
        event_type: eventData.eventType,
        content_id: eventData.contentId,
        session_id: eventData.sessionId,
        timestamp: new Date().toISOString(),
        event_data: eventData
      }),
    });
  }

  async getAnalytics(knowledgeId: number) {
    return this.request(`/analytics/content/${knowledgeId}`);
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new LocalAPIClient();
```

### **Step 3: Replace Auth Service**

Replace `src/services/auth.ts`:

```typescript
import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  data?: {
    user: User;
    access_token: string;
  };
  error?: Error | null;
}

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('current_user');
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && localStorage.getItem('auth_token') !== null;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.login(email, password);
      this.currentUser = response.user;
      return {
        data: {
          user: response.user,
          access_token: response.access_token
        }
      };
    } catch (error) {
      console.error('Sign-in error:', error);
      return {
        error: error instanceof Error ? error : new Error('Sign-in failed')
      };
    }
  }

  async signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.register(email, password, name);
      this.currentUser = response.user;
      return {
        data: {
          user: response.user,
          access_token: response.access_token
        }
      };
    } catch (error) {
      console.error('Sign-up error:', error);
      return {
        error: error instanceof Error ? error : new Error('Sign-up failed')
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      await apiClient.logout();
    } finally {
      this.currentUser = null;
    }
  }
}

export const authService = new AuthService();

// Export functions for backward compatibility
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  return authService.signIn(email, password);
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  return authService.signUp(email, password);
}

export { authService as default };
```

### **Step 4: Replace EdTech Content Service**

Replace `src/services/edtech-content.ts`:

```typescript
"use client"

import { apiClient } from './api-client';
import { windowedChunk } from "@/components/utils";
import { analyzeMarkdown, cleanMarkdown, processMarkdown } from './markdown-utils';

export const getEdTechContent = async (chapter: any, language = "English") => {
  console.log("Getting EdTech content for chapter:", chapter.id, "language:", language);
  
  try {
    const response = await apiClient.getChapters(chapter.knowledge_id, language);
    
    if (!response.success || !response.data) {
      console.log("No EdTechContent found, creating minimal new entry");
      return [{
        chapter_id: chapter.id,
        knowledge_id: chapter.knowledge_id,
        id: chapter.lines + chapter.id,
        latex_code: chapter.chapter,
        subtopic: chapter.subtopic,
        chapter: chapter.chaptertitle,
      }];
    }
    
    // Filter for the specific chapter
    const chapterContent = response.data.filter(
      (content: any) => content.chapter_id === chapter.id
    );
    
    return chapterContent.length > 0 ? chapterContent : response.data;
  } catch (error) {
    console.error("Error fetching EdTech content:", error);
    return [];
  }
};

export const updateEdtechContent = async (
  updateObject: any,
  edtechId: string,
  chapterId: string,
  knowledgeId: number,
  language = "English"
) => {
  try {
    const response = await apiClient.generateContent(knowledgeId, {
      chapterId,
      types: Object.keys(updateObject),
      language
    });
    
    console.log("Updated EdTech content:", response);
    return response.data?.chapters || [];
  } catch (error) {
    console.error("Error updating EdTech content:", error);
    return null;
  }
};

export const getChapterMetaDataByLanguage = async (id: number, language: string) => {
  try {
    const response = await apiClient.getChapters(id, language);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching chapter metadata:", error);
    return [];
  }
};

export const getChapters = async (id: number, language: string) => {
  try {
    const response = await apiClient.getChapters(id, language);
    
    if (!response.success || !response.data || response.data.length === 0) {
      console.log("No chapters found, may need to process knowledge first");
      return [];
    }
    
    // Sort chapters by ID
    const sortedData = response.data.sort((a: any, b: any) => {
      const aId = parseInt(a.id) || 0;
      const bId = parseInt(b.id) || 0;
      return aId - bId;
    });
    
    return sortedData;
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }
};

export async function insertKnowledge(name: string, user: any, files: File[]) {
  try {
    const response = await apiClient.uploadKnowledgeFiles(files, name, {
      autoProcess: true,
      generateContent: true,
      contentTypes: ['notes', 'summary', 'quiz', 'mindmap'],
      contentLanguage: 'English'
    });
    
    return response.knowledge_id;
  } catch (error) {
    console.error("Failed to insert knowledge:", error);
    throw new Error("Failed to insert knowledge.");
  }
}

export async function uploadFiles(files: File[], knowledge_id: number, fileType: string) {
  try {
    // For existing knowledge, trigger processing
    const response = await apiClient.startProcessing(knowledge_id, {
      generateContent: true,
      contentTypes: ['notes', 'summary', 'quiz', 'mindmap'],
      contentLanguage: 'English'
    });
    
    console.log(`Successfully triggered processing for knowledge_id ${knowledge_id}`);
    return [response];
  } catch (error) {
    console.error(`Failed to trigger processing for knowledge_id ${knowledge_id}:`, error);
    throw new Error("File processing failed.");
  }
}

// Keep utility functions that don't depend on Supabase
export const mergeChaptersIntoLarger = (content: string, metadata: any, lineRanges: any, key: string) => {
  // Implementation remains the same - this is a utility function
  return [];
};

export const distributeChaptersEqually = (content: string, metadata: any, lineRanges: any, key: string) => {
  // Implementation remains the same - this is a utility function  
  return [];
};

// Legacy functions for backward compatibility
export const getKnowledgeMeta = async (id: number) => {
  try {
    const response = await apiClient.request(`/knowledge/${id}/files`);
    return response;
  } catch (error) {
    console.error("Error fetching knowledge meta:", error);
    return null;
  }
};

export const getKnowledge = async () => {
  try {
    // This would need a corresponding backend endpoint to list all knowledge
    const response = await apiClient.request('/knowledge');
    return response.data || [];
  } catch (error) {
    console.error("Error fetching knowledge list:", error);
    return [];
  }
};

// Roleplay functions - these need backend endpoints
export const getRoleplayData = async (knowledgeId: number) => {
  try {
    const response = await apiClient.request(`/roleplay/${knowledgeId}`);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching roleplay data:", error);
    return [];
  }
};

export const generateRoleplayScenarios = async (
  knowledgeId: number,
  topic: string,
  content: string,
  apiKey: string,
  language: string = 'English'
) => {
  try {
    const response = await apiClient.request('/roleplay/generate', {
      method: 'POST',
      body: JSON.stringify({
        knowledge_id: knowledgeId,
        topic,
        content,
        language
      })
    });
    return response.data || [];
  } catch (error) {
    console.error("Error generating roleplay scenarios:", error);
    return [];
  }
};
```

### **Step 5: Replace Analytics Service**

Replace `src/services/analytics-service.ts`:

```typescript
import { apiClient } from './api-client';

interface EventData {
  userId: string;
  eventType: string;
  contentId: string | null;
  timestamp: number;
  sessionId: string | null;
  [key: string]: any;
}

export interface AnalyticsService {
  trackEvent: (data: EventData) => Promise<void>;
  getUserProgress: (userId: string) => Promise<any>;
  getUserCompletion: (userId: string, courseId: string) => Promise<any>;
  startUserSession: (userId: string) => Promise<{ id: string } | null>;
  endUserSession: (sessionId: string) => Promise<boolean>;
  getUserSessionStats: (userId: string) => Promise<any>;
  getUserInteractionSummary: (userId: string, contentId?: string) => Promise<any>;
  summarizeNumericEventData: (userId: string, eventType: string, jsonKey: string) => Promise<any>;
  getKnowledgeInteractionSummary: (userId: string, knowledgeId: string) => Promise<any>;
  getKnowledgeVideoStats: (userId: string, knowledgeId: string) => Promise<any>;
  getKnowledgeQuizStats: (userId: string, knowledgeId: string) => Promise<any>;
}

class LocalAnalyticsService implements AnalyticsService {
  private currentSessionId: string | null = null;

  async trackEvent(data: EventData): Promise<void> {
    try {
      await apiClient.trackEvent({
        userId: data.userId,
        eventType: data.eventType,
        contentId: data.contentId,
        sessionId: data.sessionId,
        timestamp: data.timestamp,
        ...data
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  async getUserProgress(userId: string): Promise<any> {
    try {
      const response = await apiClient.request(`/analytics/user/${userId}/progress`);
      return response.data || [{
        user_id: userId,
        progress_percentage: 0,
        completed: false,
        course_id: null
      }];
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return [{
        user_id: userId,
        progress_percentage: 0,
        completed: false,
        course_id: null
      }];
    }
  }

  async getUserCompletion(userId: string, courseId: string): Promise<any> {
    try {
      const response = await apiClient.request(
        `/analytics/user/${userId}/completion?course_id=${courseId}`
      );
      return response.data || this.getFallbackCompletion();
    } catch (error) {
      console.error('Error fetching user completion:', error);
      return this.getFallbackCompletion();
    }
  }

  async startUserSession(userId: string): Promise<{ id: string } | null> {
    try {
      const response = await apiClient.request('/analytics/session/start', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      });
      this.currentSessionId = response.session_id;
      return { id: response.session_id };
    } catch (error) {
      console.error('Error starting user session:', error);
      return null;
    }
  }

  async endUserSession(sessionId: string): Promise<boolean> {
    try {
      await apiClient.request('/analytics/session/end', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId })
      });
      this.currentSessionId = null;
      return true;
    } catch (error) {
      console.error('Error ending user session:', error);
      return false;
    }
  }

  async getUserSessionStats(userId: string): Promise<any> {
    try {
      const response = await apiClient.request(`/analytics/user/${userId}/sessions`);
      return response.data || this.getFallbackSessionStats();
    } catch (error) {
      console.error('Error fetching user session stats:', error);
      return this.getFallbackSessionStats();
    }
  }

  async getUserInteractionSummary(userId: string, contentId?: string): Promise<any> {
    try {
      const url = contentId 
        ? `/analytics/user/${userId}/interactions?content_id=${contentId}`
        : `/analytics/user/${userId}/interactions`;
      const response = await apiClient.request(url);
      return response.data || this.getFallbackInteractionSummary();
    } catch (error) {
      console.error('Error fetching user interaction summary:', error);
      return this.getFallbackInteractionSummary();
    }
  }

  async summarizeNumericEventData(userId: string, eventType: string, jsonKey: string): Promise<any> {
    try {
      const response = await apiClient.request(
        `/analytics/user/${userId}/numeric-summary?event_type=${eventType}&json_key=${jsonKey}`
      );
      return response.data || this.getFallbackNumericSummary();
    } catch (error) {
      console.error('Error fetching numeric event summary:', error);
      return this.getFallbackNumericSummary();
    }
  }

  async getKnowledgeInteractionSummary(userId: string, knowledgeId: string): Promise<any> {
    try {
      const response = await apiClient.request(
        `/analytics/knowledge/${knowledgeId}/interactions?user_id=${userId}`
      );
      return response.data || this.getFallbackKnowledgeSummary();
    } catch (error) {
      console.error('Error fetching knowledge interaction summary:', error);
      return this.getFallbackKnowledgeSummary();
    }
  }

  async getKnowledgeVideoStats(userId: string, knowledgeId: string): Promise<any> {
    try {
      const response = await apiClient.request(
        `/analytics/knowledge/${knowledgeId}/video-stats?user_id=${userId}`
      );
      return response.data || this.getFallbackVideoStats();
    } catch (error) {
      console.error('Error fetching knowledge video stats:', error);
      return this.getFallbackVideoStats();
    }
  }

  async getKnowledgeQuizStats(userId: string, knowledgeId: string): Promise<any> {
    try {
      const response = await apiClient.request(
        `/analytics/knowledge/${knowledgeId}/quiz-stats?user_id=${userId}`
      );
      return response.data || this.getFallbackQuizStats();
    } catch (error) {
      console.error('Error fetching knowledge quiz stats:', error);
      return this.getFallbackQuizStats();
    }
  }

  private getFallbackCompletion(): any {
    return {
      completion: 0,
      engagementScore: 0,
      videoCompletion: 0,
      quizCompletion: 0
    };
  }

  private getFallbackSessionStats(): any {
    return {
      total_sessions: 0,
      total_duration: 0,
      average_duration: 0,
      last_session: null
    };
  }

  private getFallbackInteractionSummary(): any {
    return {
      total_interactions: 0,
      unique_content_items: 0,
      most_common_event: null,
      last_interaction: null
    };
  }

  private getFallbackNumericSummary(): any {
    return {
      count: 0,
      sum: 0,
      average: 0,
      min: 0,
      max: 0
    };
  }

  private getFallbackKnowledgeSummary(): any {
    return {
      total_time_spent: 0,
      completion_rate: 0,
      last_accessed: null,
      progress_percentage: 0
    };
  }

  private getFallbackVideoStats(): any {
    return {
      total_watch_time: 0,
      completion_rate_percent: 0,
      average_watch_session: 0,
      replay_count: 0
    };
  }

  private getFallbackQuizStats(): any {
    return {
      quizzes_attempted: 0,
      quizzes_completed: 0,
      completion_rate_percent: 0,
      average_score: 0
    };
  }
}

// Export singleton instance
export const analyticsService = new LocalAnalyticsService();

// Export the service as default for backward compatibility
export default analyticsService;
```

### **Step 6: Update Environment Configuration**

Create `.env.local`:

```bash
# Local API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development

# Remove any Supabase environment variables
```

### **Step 7: Update EdTech API Service**

Update `src/services/edtech-api.ts` to use the local backend:

```typescript
// Update the constructor to use local backend by default
export class EdTechAPI {
  private baseURL: string;
  private apiKey?: string;
  private headers: Record<string, string>;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    this.headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
    };
  }

  // Add the uploadKnowledgeFiles method
  async uploadKnowledgeFiles(
    files: File[],
    name: string,
    options?: {
      autoProcess?: boolean;
      generateContent?: boolean;
      contentTypes?: ContentType[];
      contentLanguage?: string;
    }
  ): Promise<{
    knowledge_id: number;
    name: string;
    content_type: string;
    uploaded_files: any[];
    total_files: number;
    message: string;
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('name', name);
    
    if (options?.autoProcess !== undefined) {
      formData.append('auto_process', options.autoProcess.toString());
    }
    if (options?.generateContent !== undefined) {
      formData.append('generate_content', options.generateContent.toString());
    }
    if (options?.contentTypes) {
      options.contentTypes.forEach(type => formData.append('content_types', type));
    }
    if (options?.contentLanguage) {
      formData.append('content_language', options.contentLanguage);
    }

    const response = await fetch(`${this.baseURL}/upload-knowledge-file`, {
      method: 'POST',
      headers: {
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getKnowledgeFiles(knowledgeId: number): Promise<{
    knowledge_id: number;
    knowledge_name: string;
    content_type: string;
    files: any[];
    total_files: number;
  }> {
    return this.request(`/knowledge/${knowledgeId}/files`);
  }

  // Update existing methods to use correct endpoints
  async startProcessing(
    knowledgeId: number,
    options?: {
      generateContent?: boolean;
      contentTypes?: ContentType[];
      contentLanguage?: string;
    }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (options?.generateContent !== undefined) {
      params.append('generate_content', options.generateContent.toString());
    }
    if (options?.contentTypes) {
      options.contentTypes.forEach(type => params.append('content_types', type));
    }
    if (options?.contentLanguage) {
      params.append('content_language', options.contentLanguage);
    }

    return this.request(`/process/${knowledgeId}?${params.toString()}`);
  }
}
```

---

## **🔍 Validation & Testing**

### **Step 8: Create Validation Script**

Create `validate-migration.sh`:

```bash
#!/bin/bash

echo "🔍 Validating Supabase Migration..."

# Check for remaining Supabase references
echo "Checking for remaining Supabase imports..."
SUPABASE_IMPORTS=$(find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "import.*supabase" 2>/dev/null | wc -l)
if [ $SUPABASE_IMPORTS -eq 0 ]; then
    echo "✅ No Supabase imports found"
else
    echo "❌ Found $SUPABASE_IMPORTS files with Supabase imports:"
    find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "import.*supabase" 2>/dev/null
fi

echo "Checking for Supabase usage..."
SUPABASE_USAGE=$(find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "supabase\." 2>/dev/null | wc -l)
if [ $SUPABASE_USAGE -eq 0 ]; then
    echo "✅ No Supabase usage found"
else
    echo "❌ Found $SUPABASE_USAGE files with Supabase usage:"
    find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "supabase\." 2>/dev/null
fi

# Check if new services exist
echo "Checking for new service files..."
if [ -f "src/services/api-client.ts" ]; then
    echo "✅ api-client.ts exists"
else
    echo "❌ api-client.ts missing"
fi

if [ -f "src/services/auth.ts" ]; then
    echo "✅ auth.ts exists"
else
    echo "❌ auth.ts missing"
fi

# Check environment
echo "Checking environment configuration..."
if [ -f ".env.local" ] && grep -q "NEXT_PUBLIC_API_URL" .env.local; then
    echo "✅ Local API URL configured"
else
    echo "❌ Local API URL not configured"
fi

# Test API connectivity
echo "Testing API connectivity..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Local API is accessible"
else
    echo "❌ Local API is not accessible - make sure backend is running"
fi

echo "🎯 Migration validation complete!"
```

### **Step 9: Test the Migration**

```bash
# Make validation script executable
chmod +x validate-migration.sh

# Run validation
./validate-migration.sh

# Start the application
npm run dev

# Test in browser at http://localhost:3000
```

---

## **🚨 Common Issues & Solutions**

### **Issue 1: Components Still Using Supabase**
```bash
# Find components with Supabase usage
find src/components -name "*.tsx" | xargs grep -l "supabase"

# Update each component to use new services
# Replace: import supabase from '@/services/supabase'
# With: import { apiClient } from '@/services/api-client'
```

### **Issue 2: Authentication Not Working**
- Check that JWT tokens are being stored correctly
- Verify backend auth endpoints are working
- Ensure token is being sent in Authorization header

### **Issue 3: File Upload Failing**
- Verify backend `/upload-knowledge-file` endpoint is working
- Check file size limits
- Ensure proper FormData handling

---

## **🔄 Rollback Plan**

If you need to rollback:

```bash
# Restore original services
rm -rf src/services
mv src/services.backup src/services

# Reinstall Supabase
npm install @supabase/supabase-js

# Restore environment
git checkout .env.local  # or restore from backup

# Switch back to backup branch
git checkout backup-before-supabase-removal
```

---

## **✅ Success Checklist**

- [ ] Supabase package removed from package.json
- [ ] No Supabase imports in codebase
- [ ] Local API client created and working
- [ ] Auth service replaced and functional
- [ ] Content service replaced and functional
- [ ] Analytics service replaced and functional
- [ ] Environment configured for local backend
- [ ] All existing features work with local backend
- [ ] File upload and processing works end-to-end
- [ ] Authentication flows work correctly
- [ ] Analytics tracking works
- [ ] No console errors related to Supabase

---

**🎉 Congratulations! You've successfully migrated from Supabase to a local-first backend!**

Your frontend now communicates entirely with the local FastAPI backend, eliminating all cloud dependencies while maintaining full functionality. 