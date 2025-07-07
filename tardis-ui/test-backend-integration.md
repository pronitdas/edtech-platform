# Backend Integration Testing Guide

## 🚀 Quick Start

✅ **Backend Status**: Your backend is running and healthy at http://localhost:8000!

The dynamic API client is ready for testing with your live backend. Here are several ways to test all APIs:

### 1. Dedicated API Test Page (Recommended)

Visit the dedicated API testing page:
**http://localhost:3000/api-test**

This provides a clean, interactive dashboard for testing all APIs with:
- Real-time test execution
- Visual status indicators  
- Response data inspection
- Performance timing
- Knowledge ID tracking

### 2. Storybook Integration Testing

Visit Storybook at http://localhost:6006 and navigate to:
- **API Integration/Live Backend Testing**: Complete API test suite
- **API Integration/Knowledge Workflow**: End-to-end workflow demo
- **API Integration/Real-Time Analytics**: Live analytics dashboard

### 3. Browser Console Testing

Open your browser console in the running app and run:

```javascript
// Load the test runner (if not auto-loaded)
import('./src/test/manual-api-test.js').then(module => {
  window.apiTests = module
  console.log('API Tests loaded! Run apiTests.runCompleteTestSuite()')
})

// Run complete test suite
apiTests.runCompleteTestSuite()
```

### 3. NPM Script Testing

```bash
# Run integration tests (when implemented)
npm run test:integration

# Manual API test runner  
npm run test:api
```

### 4. Component Testing

Import and use the unified API service in any component:

```typescript
import { unifiedApiService } from './services/unified-api-service'

// Initialize once
await unifiedApiService.initialize('http://localhost:8000')

// Use anywhere
const health = await unifiedApiService.healthCheck()
const upload = await unifiedApiService.uploadKnowledgeFiles(files, 'Test Knowledge')
const status = await unifiedApiService.getProcessingStatus(knowledgeId)
```

## 📋 Test Coverage

### ✅ Implemented & Ready for Testing

1. **Health & Connectivity**
   - Health check endpoint
   - Available endpoints listing
   - API client initialization

2. **Analytics & Performance**
   - Dashboard analytics
   - Performance statistics
   - Content analytics per knowledge ID
   - Engagement metrics

3. **Knowledge Management**
   - File upload (multiple files, all formats)
   - Get knowledge files metadata
   - Start processing with content generation
   - Processing status monitoring
   - Retry processing capabilities

4. **Content Generation**
   - Generate content (notes, summaries, quizzes, mindmaps)
   - Get chapter data with generated content
   - Language-specific content generation

5. **Knowledge Graph**
   - Sync knowledge to Neo4j graph
   - Get knowledge graph structure
   - Get knowledge concepts and relationships
   - Graph schema information

### ⚠️ Authentication Testing (Requires Kratos Setup)

Authentication endpoints require Kratos flow IDs:

```typescript
// Login flow (requires Kratos flow_id)
const loginResult = await unifiedApiService.login(flowId)

// Register flow (requires Kratos flow_id)  
const registerResult = await unifiedApiService.register(flowId)
```

## 🧪 Testing Workflow

### Complete Knowledge Processing Pipeline:

1. **Upload** → Create knowledge entry with files
2. **Verify** → Confirm upload success
3. **Process** → Start AI processing pipeline  
4. **Monitor** → Track processing status
5. **Generate** → Create educational content
6. **Retrieve** → Get processed chapters
7. **Analytics** → View generation metrics
8. **Graph** → Sync to knowledge graph

### Sample Test Data:

The test suite includes realistic educational content for testing:

- **Mathematics Course**: Calculus, algebra, differential equations
- **Multiple File Types**: PDF, markdown, text files
- **Content Generation**: Notes, summaries, quizzes, mindmaps
- **Multiple Languages**: English (default), Spanish, French, etc.

## 📊 Expected Results

### Successful API Responses:

1. **Health Check**: `{ status: "ok" }` or similar
2. **File Upload**: `{ knowledge_id: 123, uploaded_files: [...] }`
3. **Processing**: `{ status: "queued", message: "..." }`
4. **Analytics**: Rich dashboard data with metrics
5. **Content Generation**: Generated educational materials

### Error Handling:

- Network errors are caught and displayed
- Invalid parameters show validation errors
- Processing failures include retry mechanisms
- All errors include helpful error messages

## 🔧 Debugging

### Browser Console Logs:

```javascript
// Enable detailed logging
localStorage.setItem('debug', 'api:*')

// View test results
console.log(window.testResults)

// Check API client status  
console.log(unifiedApiService.getAvailableEndpoints())
```

### Network Tab:

Monitor actual HTTP requests to `http://localhost:8000`:
- Check request/response payloads
- Verify authentication headers
- Monitor upload progress
- Inspect error responses

## 🎯 Integration Points

### Frontend Components:

All contexts now include API client access:

```typescript
// AuthContext - Authentication & JWT management
const { apiClient, login, register } = useAuth()

// CourseContext - Course content with API access
const { apiClient, ...courseState } = useCourse() 

// LearningContext - Learning workflow with API helpers
const { apiClient, fetchKnowledgeFiles, startProcessing } = useLearning()
```

### Service Integration:

```typescript
// Replace old API calls with unified service
import { unifiedApiService } from './services/unified-api-service'

// Old way
const oldClient = new EdTechAPI(baseUrl, apiKey)
const result = await oldClient.startProcessing(id)

// New way
await unifiedApiService.initialize()
const result = await unifiedApiService.startProcessing(id, options)
```

## 🚀 Production Readiness

### Configuration:

```typescript
// Development
await unifiedApiService.initialize('http://localhost:8000')

// Production  
await unifiedApiService.initialize('https://api.yourplatform.com')

// Environment-based
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000'
await unifiedApiService.initialize(apiUrl)
```

### Error Handling:

```typescript
try {
  const result = await unifiedApiService.uploadKnowledgeFiles(files, name)
  // Handle success
} catch (error) {
  // Handle errors
  console.error('Upload failed:', error.message)
  // Show user-friendly error message
}
```

The dynamic API client automatically adapts to your OpenAPI specification, so any backend changes are immediately reflected in the frontend without code changes! 🎉