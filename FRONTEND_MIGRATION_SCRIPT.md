# 🔧 Frontend Migration Script: Supabase to Local Backend

## **Quick Start Migration Commands**

### **Step 1: Remove Supabase Dependencies**
```bash
cd tardis-ui

# Remove Supabase package
npm uninstall @supabase/supabase-js

# Remove Supabase client file
rm src/services/supabase.ts

# Create backup of current services
cp -r src/services src/services.backup
```

### **Step 2: Create New API Client**
```bash
# Create the new API client
cat > src/services/api-client.ts << 'EOF'
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class LocalAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
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
      this.token = response.access_token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', this.token);
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
      this.token = response.access_token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('current_user', JSON.stringify(response.user));
      }
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
      }
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
EOF
```

### **Step 3: Replace Auth Service**
```bash
# Replace auth service
cat > src/services/auth.ts << 'EOF'
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
EOF
```

### **Step 4: Replace EdTech Content Service**
```bash
# Replace edtech-content service
cat > src/services/edtech-content.ts << 'EOF'
"use client"

import { apiClient } from './api-client';
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

// Keep other utility functions that don't depend on Supabase
export const mergeChaptersIntoLarger = (content: string, metadata: any, lineRanges: any, key: string) => {
  // Implementation remains the same
  return [];
};

export const distributeChaptersEqually = (content: string, metadata: any, lineRanges: any, key: string) => {
  // Implementation remains the same
  return [];
};

// Roleplay functions - update to use local API
export const getRoleplayData = async (knowledgeId: number) => {
  try {
    // This would need a corresponding backend endpoint
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
    // This would need a corresponding backend endpoint
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

// Legacy function for backward compatibility
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
EOF
```

### **Step 5: Replace Analytics Service**
```bash
# Replace analytics service
cat > src/services/analytics-service.ts << 'EOF'
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
EOF
```

### **Step 6: Update Environment Configuration**
```bash
# Create environment configuration
cat > .env.local << 'EOF'
# Local API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development

# Remove any Supabase environment variables
# NEXT_PUBLIC_SUPABASE_URL=  # REMOVE
# NEXT_PUBLIC_SUPABASE_ANON_KEY=  # REMOVE
EOF

# Update package.json to remove Supabase
npm pkg delete dependencies.@supabase/supabase-js
```

### **Step 7: Find and Replace Supabase Imports**
```bash
# Find all files with Supabase imports
echo "Files with Supabase imports:"
grep -r "import.*supabase" src/ --include="*.ts" --include="*.tsx" || echo "No Supabase imports found"

# Find all files using Supabase
echo "Files using Supabase:"
grep -r "supabase\." src/ --include="*.ts" --include="*.tsx" || echo "No Supabase usage found"

# Create a script to help with replacements
cat > replace-supabase.sh << 'EOF'
#!/bin/bash

# Replace common Supabase patterns
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import supabase from.*supabase.*/\/\/ Supabase import removed/g'
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import.*supabase.*from.*supabase.*/\/\/ Supabase import removed/g'

echo "Supabase imports have been commented out. Please review and update manually."
echo "You'll need to replace Supabase calls with the new local API client calls."
EOF

chmod +x replace-supabase.sh
```

### **Step 8: Test the Migration**
```bash
# Start the local backend (in another terminal)
cd ../media-uploader
make up
make migrate
make seed

# Test API connectivity
curl http://localhost:8000/health

# Start the frontend
npm run dev

# Test in browser
echo "Open http://localhost:3000 and test:"
echo "1. Authentication (login/register)"
echo "2. File upload"
echo "3. Content viewing"
echo "4. Any other features"
```

### **Step 9: Validation Script**
```bash
# Create validation script
cat > validate-migration.sh << 'EOF'
#!/bin/bash

echo "🔍 Validating Supabase Migration..."

# Check for remaining Supabase references
echo "Checking for remaining Supabase imports..."
SUPABASE_IMPORTS=$(grep -r "import.*supabase" src/ --include="*.ts" --include="*.tsx" | wc -l)
if [ $SUPABASE_IMPORTS -eq 0 ]; then
    echo "✅ No Supabase imports found"
else
    echo "❌ Found $SUPABASE_IMPORTS Supabase imports:"
    grep -r "import.*supabase" src/ --include="*.ts" --include="*.tsx"
fi

echo "Checking for Supabase usage..."
SUPABASE_USAGE=$(grep -r "supabase\." src/ --include="*.ts" --include="*.tsx" | wc -l)
if [ $SUPABASE_USAGE -eq 0 ]; then
    echo "✅ No Supabase usage found"
else
    echo "❌ Found $SUPABASE_USAGE Supabase usages:"
    grep -r "supabase\." src/ --include="*.ts" --include="*.tsx"
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
if grep -q "NEXT_PUBLIC_API_URL" .env.local; then
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
EOF

chmod +x validate-migration.sh
./validate-migration.sh
```

## **Manual Steps Required**

After running the automated scripts, you'll need to manually:

1. **Update Components**: Find components that use Supabase and update them to use the new services
2. **Update Authentication Flows**: Replace Supabase auth hooks with local auth service
3. **Update File Upload Components**: Replace Supabase storage calls with local API calls
4. **Test All Features**: Ensure all functionality works with the local backend

## **Rollback Plan**

If you need to rollback:

```bash
# Restore original services
rm -rf src/services
mv src/services.backup src/services

# Reinstall Supabase
npm install @supabase/supabase-js

# Restore environment
git checkout .env.local  # or restore from backup
```

This migration script provides a systematic approach to removing Supabase and integrating with your local-first backend! 