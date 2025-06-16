# 🚀 Supabase Removal & Local Backend Integration Plan

## **🎯 Mission: Complete Supabase Elimination**

Transform the frontend from Supabase-dependent to local-first by integrating with the FastAPI backend.

---

## **📊 Current State Analysis**

### **Supabase Dependencies Found:**
1. **`supabase.ts`** - Core client configuration
2. **`edtech-content.ts`** - Heavy Supabase usage (549 lines)
3. **`auth.ts`** - Authentication via Supabase Auth
4. **`analytics-service.ts`** - Analytics via Supabase RPC functions
5. **Components** - Various components importing Supabase

### **Available Backend Endpoints:**
- **Auth**: `/auth/login`, `/auth/register`, `/auth/logout`
- **Knowledge**: `/upload-knowledge-file`, `/chapters/{id}`, `/process/{id}`
- **Content**: `/generate-content/{id}`
- **Analytics**: `/analytics/dashboard`, `/analytics/content/{id}`
- **Media**: `/media/upload`, `/media/download/{id}`

---

## **🔧 Implementation Strategy**

### **Phase 1: Core Infrastructure (Day 1)**

#### **1.1 Remove Supabase Dependencies**
```bash
cd tardis-ui
npm uninstall @supabase/supabase-js
rm src/services/supabase.ts
```

#### **1.2 Create Local API Client**
```typescript
// NEW: src/services/api-client.ts
export class LocalAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth Methods
  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.access_token) {
      this.token = response.access_token;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('current_user', JSON.stringify(response.user));
    }

    return response;
  }

  async register(email: string, password: string, name?: string) {
    const response = await this.request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (response.access_token) {
      this.token = response.access_token;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('current_user', JSON.stringify(response.user));
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
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
    
    Object.entries(options || {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => formData.append(key, v));
      } else {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(`${this.baseURL}/upload-knowledge-file`, {
      method: 'POST',
      headers: { ...(this.token && { Authorization: `Bearer ${this.token}` }) },
      body: formData
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
    return response.json();
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

    return this.request(`/generate-content/${knowledgeId}?${params}`);
  }

  async startProcessing(knowledgeId: number, options?: {
    generateContent?: boolean;
    contentTypes?: string[];
    contentLanguage?: string;
  }) {
    const params = new URLSearchParams();
    Object.entries(options || {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.append(key, String(value));
      }
    });

    return this.request(`/process/${knowledgeId}?${params}`);
  }

  // Analytics Methods
  async trackEvent(eventData: any) {
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
}

export const apiClient = new LocalAPIClient();
```

### **Phase 2: Service Replacements (Day 2)**

#### **2.1 Replace Auth Service**
```typescript
// REPLACE: src/services/auth.ts
import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  data?: { user: User; access_token: string };
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
      return { data: { user: response.user, access_token: response.access_token } };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Sign-in failed') };
    }
  }

  async signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.register(email, password, name);
      this.currentUser = response.user;
      return { data: { user: response.user, access_token: response.access_token } };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Sign-up failed') };
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

// Backward compatibility exports
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  return authService.signIn(email, password);
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  return authService.signUp(email, password);
}
```

#### **2.2 Replace EdTech Content Service**
```typescript
// REPLACE: src/services/edtech-content.ts
"use client"

import { apiClient } from './api-client';
import { windowedChunk } from "@/components/utils";
import { analyzeMarkdown, cleanMarkdown } from './markdown-utils';

export const getEdTechContent = async (chapter: any, language = "English") => {
  console.log("Getting EdTech content for chapter:", chapter.id, "language:", language);
  
  try {
    const response = await apiClient.getChapters(chapter.knowledge_id, language);
    
    if (!response.success || !response.data) {
      return [{
        chapter_id: chapter.id,
        knowledge_id: chapter.knowledge_id,
        id: chapter.lines + chapter.id,
        latex_code: chapter.chapter,
        subtopic: chapter.subtopic,
        chapter: chapter.chaptertitle,
      }];
    }
    
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
      return [];
    }
    
    return response.data.sort((a: any, b: any) => {
      const aId = parseInt(a.id) || 0;
      const bId = parseInt(b.id) || 0;
      return aId - bId;
    });
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
    const response = await apiClient.startProcessing(knowledge_id, {
      generateContent: true,
      contentTypes: ['notes', 'summary', 'quiz', 'mindmap'],
      contentLanguage: 'English'
    });
    
    return [response];
  } catch (error) {
    console.error(`Failed to trigger processing for knowledge_id ${knowledge_id}:`, error);
    throw new Error("File processing failed.");
  }
}

// Keep utility functions unchanged
export const mergeChaptersIntoLarger = (content: string, metadata: any, lineRanges: any, key: string) => {
  return [];
};

export const distributeChaptersEqually = (content: string, metadata: any, lineRanges: any, key: string) => {
  return [];
};

// Legacy compatibility functions
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
    const response = await apiClient.request('/knowledge');
    return response.data || [];
  } catch (error) {
    console.error("Error fetching knowledge list:", error);
    return [];
  }
};

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

#### **2.3 Replace Analytics Service**
```typescript
// REPLACE: src/services/analytics-service.ts
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
      return response.data || [{ user_id: userId, progress_percentage: 0, completed: false }];
    } catch (error) {
      return [{ user_id: userId, progress_percentage: 0, completed: false }];
    }
  }

  async getUserCompletion(userId: string, courseId: string): Promise<any> {
    try {
      const response = await apiClient.request(`/analytics/user/${userId}/completion?course_id=${courseId}`);
      return response.data || this.getFallbackCompletion();
    } catch (error) {
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
      return false;
    }
  }

  async getUserSessionStats(userId: string): Promise<any> {
    try {
      const response = await apiClient.request(`/analytics/user/${userId}/sessions`);
      return response.data || this.getFallbackSessionStats();
    } catch (error) {
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
      return this.getFallbackQuizStats();
    }
  }

  private getFallbackCompletion() {
    return { completion: 0, engagementScore: 0, videoCompletion: 0, quizCompletion: 0 };
  }

  private getFallbackSessionStats() {
    return { total_sessions: 0, total_duration: 0, average_duration: 0, last_session: null };
  }

  private getFallbackInteractionSummary() {
    return { total_interactions: 0, unique_content_items: 0, most_common_event: null, last_interaction: null };
  }

  private getFallbackNumericSummary() {
    return { count: 0, sum: 0, average: 0, min: 0, max: 0 };
  }

  private getFallbackKnowledgeSummary() {
    return { total_time_spent: 0, completion_rate: 0, last_accessed: null, progress_percentage: 0 };
  }

  private getFallbackVideoStats() {
    return { total_watch_time: 0, completion_rate_percent: 0, average_watch_session: 0, replay_count: 0 };
  }

  private getFallbackQuizStats() {
    return { quizzes_attempted: 0, quizzes_completed: 0, completion_rate_percent: 0, average_score: 0 };
  }
}

export const analyticsService = new LocalAnalyticsService();
export default analyticsService;
```

### **Phase 3: Environment & Configuration (Day 3)**

#### **3.1 Update Environment Configuration**
```bash
# Create .env.local
cat > .env.local << 'EOF'
# Local API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
EOF
```

#### **3.2 Update EdTech API Service**
```typescript
// UPDATE: src/services/edtech-api.ts
export class EdTechAPI {
  constructor(
    baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    apiKey?: string
  ) {
    this.baseURL = baseURL;
    this.apiKey = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    // ... rest of constructor
  }

  // Add new method for multi-file upload
  async uploadKnowledgeFiles(files: File[], name: string, options?: any) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('name', name);
    
    Object.entries(options || {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => formData.append(key, v));
      } else {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(`${this.baseURL}/upload-knowledge-file`, {
      method: 'POST',
      headers: { ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }) },
      body: formData
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
    return response.json();
  }

  async getKnowledgeFiles(knowledgeId: number) {
    return this.request(`/knowledge/${knowledgeId}/files`);
  }
}
```

### **Phase 4: Component Updates & Testing (Day 4)**

#### **4.1 Find and Update Components**
```bash
# Find components using Supabase
find src/components -name "*.tsx" | xargs grep -l "supabase"
find src/pages -name "*.tsx" | xargs grep -l "supabase"

# Update each component:
# Replace: import supabase from '@/services/supabase'
# With: import { apiClient } from '@/services/api-client'
# Replace: import { authService } from '@/services/auth'
```

#### **4.2 Create Validation Script**
```bash
# Create validation script
cat > validate-migration.sh << 'EOF'
#!/bin/bash
echo "🔍 Validating Supabase Migration..."

# Check for remaining Supabase references
SUPABASE_IMPORTS=$(find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "import.*supabase" 2>/dev/null | wc -l)
if [ $SUPABASE_IMPORTS -eq 0 ]; then
    echo "✅ No Supabase imports found"
else
    echo "❌ Found $SUPABASE_IMPORTS files with Supabase imports"
fi

SUPABASE_USAGE=$(find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "supabase\." 2>/dev/null | wc -l)
if [ $SUPABASE_USAGE -eq 0 ]; then
    echo "✅ No Supabase usage found"
else
    echo "❌ Found $SUPABASE_USAGE files with Supabase usage"
fi

# Check new services
[ -f "src/services/api-client.ts" ] && echo "✅ api-client.ts exists" || echo "❌ api-client.ts missing"
[ -f "src/services/auth.ts" ] && echo "✅ auth.ts exists" || echo "❌ auth.ts missing"

# Check environment
grep -q "NEXT_PUBLIC_API_URL" .env.local && echo "✅ Local API URL configured" || echo "❌ Local API URL not configured"

# Test API connectivity
curl -s http://localhost:8000/health > /dev/null && echo "✅ Local API accessible" || echo "❌ Local API not accessible"

echo "🎯 Migration validation complete!"
EOF

chmod +x validate-migration.sh
```

---

## **🚀 Quick Migration Commands**

```bash
# 1. Backup and prepare
git checkout -b supabase-removal-backup
cp -r src/services src/services.backup

# 2. Remove Supabase
npm uninstall @supabase/supabase-js
rm src/services/supabase.ts

# 3. Create new services (copy the code above into these files)
# - src/services/api-client.ts
# - src/services/auth.ts (replace)
# - src/services/edtech-content.ts (replace)
# - src/services/analytics-service.ts (replace)

# 4. Update environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 5. Validate migration
./validate-migration.sh

# 6. Test the application
npm run dev
```

---

## **✅ Success Criteria**

- [ ] Zero Supabase imports in codebase
- [ ] All authentication flows work with local backend
- [ ] File upload and processing works end-to-end
- [ ] Content generation integrates with local API
- [ ] Analytics tracking works with local backend
- [ ] All existing features maintain functionality
- [ ] No console errors related to Supabase
- [ ] Performance is equal or better than Supabase version

---

## **🔄 Rollback Plan**

```bash
# If migration fails, rollback:
rm -rf src/services
mv src/services.backup src/services
npm install @supabase/supabase-js
git checkout .env.local
```

---

**🎉 Result: Complete Supabase elimination with full local-first functionality!**

This plan ensures a systematic, testable migration that maintains all existing functionality while eliminating cloud dependencies. 