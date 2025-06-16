# 🎯 Frontend Refactor Plan: Complete Supabase Removal & Local-First Integration

## ✅ **MISSION: SUPABASE ELIMINATION**
**Goal**: Remove all Supabase dependencies from the frontend and integrate with the local-first FastAPI backend.

---

## **📊 Current State Analysis**

### **🔍 Supabase Dependencies Found**
1. **`supabase.ts`** - Core Supabase client configuration
2. **`edtech-content.ts`** - Heavy Supabase usage for content management
3. **`auth.ts`** - Authentication via Supabase Auth
4. **`analytics-service.ts`** - Analytics tracking via Supabase
5. **Various components** - Direct Supabase imports throughout the app

### **🎯 Backend API Available**
- **Authentication**: `/auth/login`, `/auth/register`, `/auth/profile`
- **Knowledge Processing**: `/upload-knowledge-file`, `/process/{id}`, `/chapters/{id}`
- **Content Generation**: `/generate-content/{id}`
- **Analytics**: `/analytics/dashboard`, `/analytics/content/{id}`
- **Media Management**: `/media/upload`, `/media/download/{id}`
- **Health & Monitoring**: `/health`, `/api/info`

---

## **🚀 Implementation Plan**

### **Phase 1: Core Infrastructure (Priority 1)**

#### **1.1 Replace Supabase Client**
```typescript
// NEW: src/services/api-client.ts
export class LocalAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) { /* ... */ }
  async register(email: string, password: string) { /* ... */ }
  async logout() { /* ... */ }

  // Knowledge methods
  async uploadKnowledgeFiles(files: File[], name: string) { /* ... */ }
  async getKnowledgeStatus(id: number) { /* ... */ }
  async getChapters(id: number, language?: string) { /* ... */ }

  // Content methods
  async generateContent(id: number, types: string[], language?: string) { /* ... */ }
  
  // Analytics methods
  async trackEvent(event: AnalyticsEvent) { /* ... */ }
  async getAnalytics(id: number) { /* ... */ }
}
```

#### **1.2 Authentication Service Replacement**
```typescript
// REPLACE: src/services/auth.ts
import { LocalAPIClient } from './api-client';

export class AuthService {
  private api: LocalAPIClient;
  private currentUser: User | null = null;

  constructor() {
    this.api = new LocalAPIClient();
    this.loadUserFromStorage();
  }

  async signIn(email: string, password: string) {
    try {
      const response = await this.api.login(email, password);
      this.setUser(response.user, response.token);
      return { data: response, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signUp(email: string, password: string) {
    try {
      const response = await this.api.register(email, password);
      this.setUser(response.user, response.token);
      return { data: response, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signOut() {
    await this.api.logout();
    this.clearUser();
  }

  private setUser(user: User, token: string) {
    this.currentUser = user;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  private clearUser() {
    this.currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }
}

export const authService = new AuthService();
export { signIn, signUp } from './auth-legacy'; // Temporary compatibility
```

#### **1.3 Delete Supabase Configuration**
```bash
# REMOVE FILES:
rm tardis-ui/src/services/supabase.ts

# UPDATE package.json - Remove Supabase dependencies:
npm uninstall @supabase/supabase-js
```

---

### **Phase 2: Content Management Refactor (Priority 1)**

#### **2.1 Replace EdTech Content Service**
```typescript
// REPLACE: src/services/edtech-content.ts
import { LocalAPIClient } from './api-client';

export class EdTechContentService {
  private api: LocalAPIClient;

  constructor() {
    this.api = new LocalAPIClient();
  }

  // Replace getEdTechContent
  async getEdTechContent(chapterId: string, knowledgeId: number, language = "English") {
    try {
      const response = await this.api.request<ChapterDataResponse>(
        `/chapters/${knowledgeId}?chapter_id=${chapterId}&language=${language}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching EdTech content:', error);
      return [];
    }
  }

  // Replace updateEdtechContent
  async updateEdtechContent(
    updateObject: any,
    edtechId: string,
    chapterId: string,
    knowledgeId: number,
    language = "English"
  ) {
    try {
      // Use the content generation endpoint to update content
      const response = await this.api.request<ContentGenerationResponse>(
        `/generate-content/${knowledgeId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            chapter_id: chapterId,
            types: Object.keys(updateObject),
            language,
            content: updateObject
          })
        }
      );
      return response.data?.chapters || [];
    } catch (error) {
      console.error('Error updating EdTech content:', error);
      return null;
    }
  }

  // Replace getChapters
  async getChapters(knowledgeId: number, language = "English") {
    try {
      const response = await this.api.request<ChapterDataResponse>(
        `/chapters/${knowledgeId}?language=${language}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
  }

  // Replace insertKnowledge
  async insertKnowledge(name: string, user: any, files: File[]) {
    try {
      const response = await this.api.uploadKnowledgeFiles(files, name);
      return response.knowledge_id;
    } catch (error) {
      console.error('Error inserting knowledge:', error);
      throw error;
    }
  }

  // Replace uploadFiles - now handled by uploadKnowledgeFiles
  async uploadFiles(files: File[], knowledgeId: number, fileType: string) {
    try {
      // Files are now uploaded during knowledge creation
      // This method can trigger processing if needed
      const response = await this.api.request(
        `/process/${knowledgeId}`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      console.error('Error processing files:', error);
      throw error;
    }
  }
}

export const edTechContentService = new EdTechContentService();

// Export individual functions for backward compatibility
export const getEdTechContent = edTechContentService.getEdTechContent.bind(edTechContentService);
export const updateEdtechContent = edTechContentService.updateEdtechContent.bind(edTechContentService);
export const getChapters = edTechContentService.getChapters.bind(edTechContentService);
export const insertKnowledge = edTechContentService.insertKnowledge.bind(edTechContentService);
export const uploadFiles = edTechContentService.uploadFiles.bind(edTechContentService);
```

#### **2.2 Update EdTech API Service**
```typescript
// UPDATE: src/services/edtech-api.ts
export class EdTechAPI {
  private baseURL: string;
  private apiKey?: string;
  private headers: Record<string, string>;

  constructor(baseURL: string = 'http://localhost:8000', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey || localStorage.getItem('auth_token');
    this.headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
    };
  }

  // Add new methods for local backend
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

### **Phase 3: Analytics Service Replacement (Priority 2)**

#### **3.1 Local Analytics Service**
```typescript
// REPLACE: src/services/analytics-service.ts
import { LocalAPIClient } from './api-client';

interface LocalEventData {
  userId: string;
  eventType: string;
  contentId: string | null;
  timestamp: number;
  sessionId: string | null;
  [key: string]: any;
}

export class LocalAnalyticsService {
  private api: LocalAPIClient;
  private currentSessionId: string | null = null;

  constructor() {
    this.api = new LocalAPIClient();
  }

  async trackEvent(data: LocalEventData): Promise<void> {
    try {
      await this.api.request('/analytics/track-event', {
        method: 'POST',
        body: JSON.stringify({
          user_id: data.userId,
          event_type: data.eventType,
          content_id: data.contentId,
          timestamp: new Date(data.timestamp).toISOString(),
          session_id: data.sessionId,
          event_data: data
        })
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  async getUserProgress(userId: string): Promise<any> {
    try {
      const response = await this.api.request(`/analytics/user/${userId}/progress`);
      return response.data || [];
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
      const response = await this.api.request(
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
      const response = await this.api.request('/analytics/session/start', {
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
      await this.api.request('/analytics/session/end', {
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

  // Add other methods with local backend integration...
  
  private getFallbackCompletion(): any {
    return {
      completion: 0,
      engagementScore: 0,
      videoCompletion: 0,
      quizCompletion: 0
    };
  }
}

export const analyticsService = new LocalAnalyticsService();
```

---

### **Phase 4: Component Updates (Priority 2)**

#### **4.1 Update Components with Supabase Dependencies**
```typescript
// EXAMPLE: Update any component using Supabase
// BEFORE:
import supabase from '@/services/supabase';

// AFTER:
import { edTechContentService } from '@/services/edtech-content';
import { analyticsService } from '@/services/analytics-service';
import { authService } from '@/services/auth';
```

#### **4.2 Global Search & Replace**
```bash
# Find all Supabase imports
grep -r "import.*supabase" tardis-ui/src/

# Find all Supabase usage
grep -r "supabase\." tardis-ui/src/

# Replace with local service calls
```

---

### **Phase 5: Environment Configuration (Priority 3)**

#### **5.1 Environment Variables**
```typescript
// NEW: src/config/api.ts
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// NEW: .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```

#### **5.2 API Client Configuration**
```typescript
// UPDATE: src/services/api-client.ts
import { API_CONFIG } from '@/config/api';

export class LocalAPIClient {
  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    // Use environment configuration
  }
}
```

---

### **Phase 6: Testing & Validation (Priority 3)**

#### **6.1 Integration Tests**
```typescript
// NEW: src/tests/api-integration.test.ts
describe('Local API Integration', () => {
  test('should authenticate user', async () => {
    const authService = new AuthService();
    const result = await authService.signIn('test@example.com', 'password');
    expect(result.data).toBeDefined();
  });

  test('should upload knowledge files', async () => {
    const api = new EdTechAPI();
    const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];
    const result = await api.uploadKnowledgeFiles(files, 'Test Knowledge');
    expect(result.knowledge_id).toBeDefined();
  });

  test('should track analytics events', async () => {
    const analytics = new LocalAnalyticsService();
    await analytics.trackEvent({
      userId: 'test-user',
      eventType: 'page_view',
      contentId: '1',
      timestamp: Date.now(),
      sessionId: 'test-session'
    });
    // Should not throw
  });
});
```

#### **6.2 Component Testing**
```typescript
// UPDATE: Existing component tests to use mocked local services
import { jest } from '@jest/globals';

jest.mock('@/services/edtech-content', () => ({
  getEdTechContent: jest.fn(),
  updateEdtechContent: jest.fn(),
  getChapters: jest.fn(),
}));
```

---

## **🗂️ File Structure Changes**

### **New Files to Create**
```
tardis-ui/src/
├── services/
│   ├── api-client.ts          # NEW - Core API client
│   ├── auth.ts                # REPLACE - Local auth service
│   ├── edtech-content.ts      # REPLACE - Local content service
│   ├── analytics-service.ts   # REPLACE - Local analytics service
│   └── edtech-api.ts          # UPDATE - Enhanced API service
├── config/
│   └── api.ts                 # NEW - API configuration
├── types/
│   ├── api.ts                 # NEW - API type definitions
│   ├── auth.ts                # NEW - Auth type definitions
│   └── analytics.ts           # NEW - Analytics type definitions
└── tests/
    ├── api-integration.test.ts # NEW - Integration tests
    └── services/               # NEW - Service tests
        ├── auth.test.ts
        ├── content.test.ts
        └── analytics.test.ts
```

### **Files to Delete**
```
tardis-ui/src/services/supabase.ts  # DELETE - Supabase client
```

### **Files to Update**
```
tardis-ui/package.json              # Remove @supabase/supabase-js
tardis-ui/.env.local                # Add local API configuration
tardis-ui/src/components/**/*.tsx   # Update Supabase imports
tardis-ui/src/pages/**/*.tsx        # Update Supabase imports
```

---

## **🚦 Implementation Phases**

### **Phase 1: Foundation (Week 1)**
- [ ] Create `api-client.ts` with core HTTP client
- [ ] Replace `auth.ts` with local authentication
- [ ] Delete `supabase.ts` and remove dependencies
- [ ] Update environment configuration

### **Phase 2: Core Services (Week 2)**
- [ ] Replace `edtech-content.ts` with local backend integration
- [ ] Update `edtech-api.ts` with new endpoints
- [ ] Replace `analytics-service.ts` with local analytics
- [ ] Update all service imports in components

### **Phase 3: Component Integration (Week 3)**
- [ ] Update all components using Supabase
- [ ] Fix authentication flows
- [ ] Update file upload workflows
- [ ] Test content generation flows

### **Phase 4: Testing & Polish (Week 4)**
- [ ] Write integration tests
- [ ] Performance testing
- [ ] Error handling improvements
- [ ] Documentation updates

---

## **🔧 Migration Commands**

### **Setup Commands**
```bash
# Remove Supabase dependencies
cd tardis-ui
npm uninstall @supabase/supabase-js

# Install additional dependencies if needed
npm install axios  # If preferred over fetch

# Update environment
cp .env.example .env.local
# Edit .env.local with local API URL
```

### **Development Commands**
```bash
# Start local backend
cd media-uploader
make up
make migrate
make seed

# Start frontend
cd tardis-ui
npm run dev

# Run tests
npm run test
```

### **Validation Commands**
```bash
# Check for remaining Supabase references
grep -r "supabase" tardis-ui/src/
grep -r "@supabase" tardis-ui/

# Test API connectivity
curl http://localhost:8000/health
curl http://localhost:8000/api/info
```

---

## **🎯 Success Criteria**

### **✅ Completion Checklist**
- [ ] Zero Supabase imports in codebase
- [ ] All authentication flows work with local backend
- [ ] File upload and processing works end-to-end
- [ ] Content generation integrates with local API
- [ ] Analytics tracking works with local backend
- [ ] All existing features maintain functionality
- [ ] Performance is equal or better than Supabase version
- [ ] Error handling is robust
- [ ] Tests pass with local services

### **🚀 Benefits Achieved**
- **100% Local Development**: No cloud dependencies
- **Faster Development**: No network latency for API calls
- **Better Debugging**: Full control over backend
- **Cost Reduction**: No Supabase subscription needed
- **Data Privacy**: All data stays local
- **Offline Capability**: Works without internet
- **Deterministic Testing**: Consistent test environment

---

## **⚠️ Risk Mitigation**

### **Potential Issues & Solutions**
1. **Authentication State Management**
   - Risk: JWT token handling complexity
   - Solution: Implement robust token refresh and storage

2. **File Upload Performance**
   - Risk: Large file uploads may be slower
   - Solution: Implement chunked uploads and progress tracking

3. **Real-time Features**
   - Risk: Loss of Supabase real-time subscriptions
   - Solution: Implement WebSocket or polling for real-time updates

4. **Data Migration**
   - Risk: Existing user data in Supabase
   - Solution: Create migration scripts to export/import data

### **Rollback Plan**
- Keep Supabase services in separate branch
- Implement feature flags for gradual migration
- Maintain backward compatibility during transition

---

**This plan ensures a complete, systematic removal of Supabase while maintaining all functionality through the local-first backend. The implementation is designed to be incremental, testable, and reversible if needed.** 