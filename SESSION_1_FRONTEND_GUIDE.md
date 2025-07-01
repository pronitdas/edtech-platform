# Session 1: Frontend Build Fix Guide

**Developer**: Frontend Specialist  
**Duration**: 4-5 days  
**Goal**: Fix 592 TypeScript errors and achieve successful build

---

## 🎯 Day 1: Assessment & Type Definitions

### Morning: Setup & Analysis
```bash
cd tardis-ui
git checkout -b session-1-frontend-fix
pnpm install

# Generate error report
pnpm type-check > typescript-errors.txt 2>&1
```

### Categorize Errors:
1. **Missing type definitions** (~150 errors)
   - `@types/p5` not installed
   - Custom types missing
   
2. **Import errors** (~200 errors)
   - Supabase imports still present
   - Service paths incorrect
   
3. **Type mismatches** (~150 errors)
   - API response types
   - Component prop types
   
4. **Undefined properties** (~92 errors)
   - Missing method definitions
   - Incorrect interfaces

### Afternoon: Fix Type Definitions
```bash
# Install missing types
pnpm add -D @types/p5 @types/node

# Create missing type files
mkdir -p src/types
```

Create `src/types/index.d.ts`:
```typescript
// Global type definitions
declare module 'p5' {
  export default any;
}

// Add other missing module declarations
```

---

## 🔧 Day 2: Service Layer Fixes

### Morning: Fix Service Imports
1. **Remove all Supabase references**:
```bash
# Find remaining supabase imports
grep -r "from '@/services/supabase'" src/
grep -r "from '@supabase/supabase-js'" src/

# Remove backup directory
rm -rf src/services.backup/
```

2. **Update service imports**:
```typescript
// Before
import supabase from '@/services/supabase'

// After
import { apiClient } from '@/services/api-client'
```

### Afternoon: Fix Service Types
Update `src/services/analytics-service.ts`:
```typescript
// Add missing methods
async getUserSessionStats(userId: string): Promise<SessionStats> {
  return this.getUserSessions(userId);
}

async getUserInteractionSummary(userId: string, filters?: any): Promise<InteractionSummary> {
  const interactions = await this.getUserInteractions(userId, filters);
  return this.summarizeInteractions(interactions);
}
```

---

## 🛠️ Day 3: Component & Hook Fixes

### Morning: Fix Hook Errors
1. **Fix `useKnowledgeData.ts`**:
```typescript
import { Knowledge } from '@/types/api'

export const useKnowledgeData = () => {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([])
  const [loading, setLoading] = useState(true)
  
  const fetchKnowledge = async () => {
    setLoading(true)
    const data = await knowledgeService.listKnowledge()
    setKnowledge(data)
    setLoading(false)
  }
  
  return { knowledge, loading, fetchKnowledge }
}
```

2. **Fix Analytics Hooks**:
```typescript
// Fix optional property types
interface NavigationEvent {
  durationOnPreviousPage?: number // Make optional
  // ... other properties
}
```

### Afternoon: Fix Component Errors
1. **Remove test page with Supabase**:
```bash
rm src/pages/test/add-interactive-content.tsx
```

2. **Fix component imports**:
```typescript
// Update all components using old services
// Example: ChapterViewer.tsx
import { contentService } from '@/services/edtech-content'
// Not: import { getChapters } from '@/services/supabase'
```

---

## 🚀 Day 4: Build Verification

### Morning: Final Cleanup
1. **Run type check iteratively**:
```bash
# Fix remaining errors in batches
pnpm type-check | head -50  # Fix first 50
pnpm type-check | head -50  # Next 50
# Continue until 0 errors
```

2. **Common fixes**:
```typescript
// Add type assertions where needed
const data = response as Knowledge[]

// Fix strict null checks
const value = someValue ?? defaultValue

// Add optional chaining
const result = obj?.property?.method?.()
```

### Afternoon: Build & Test
```bash
# Final build attempt
pnpm build

# If successful, test the app
pnpm dev

# Visit http://localhost:3009
```

### Verification Checklist:
- [ ] `pnpm type-check` shows 0 errors
- [ ] `pnpm build` completes successfully
- [ ] App loads at localhost:3009
- [ ] Can navigate between pages
- [ ] No console errors in browser

---

## 📝 Day 5: Documentation & Handoff

### Document Changes:
1. **Create migration guide**:
```markdown
# Frontend Migration Changes

## Removed Dependencies
- @supabase/supabase-js
- All Supabase service files

## Updated Services
- auth.ts: Now uses local JWT
- knowledge.ts: Uses v2 API
- analytics.ts: Local implementation

## Type Changes
- Added strict null checks
- Updated API response types
- Fixed optional properties
```

2. **Update README**:
```markdown
# Building the Frontend

## Prerequisites
- Node.js 18+
- pnpm

## Setup
\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Type Checking
\`\`\`bash
pnpm type-check
\`\`\`
```

### Final Deliverables:
- [ ] PR with all fixes
- [ ] 0 TypeScript errors
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Handoff notes for integration

---

## 🆘 Common Issues & Solutions

### Issue: "Cannot find module '@/services/supabase'"
**Solution**: Update import to use new service files

### Issue: "Property does not exist on type"
**Solution**: Add property to interface or use optional chaining

### Issue: "Type 'undefined' is not assignable"
**Solution**: Make property optional with `?` or provide default

### Issue: Build hangs or crashes
**Solution**: Clear cache with `rm -rf node_modules .next && pnpm install`

---

## 🎯 Success Criteria
- ✅ 0 TypeScript errors
- ✅ Build completes in < 2 minutes
- ✅ All pages load without errors
- ✅ Services properly typed
- ✅ Ready for integration with backend 