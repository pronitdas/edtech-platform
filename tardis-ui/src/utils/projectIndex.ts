interface FileNode {
  path: string
  type: 'file' | 'directory'
  summary: string
  exists: boolean
  category:
    | 'core'
    | 'page'
    | 'component'
    | 'service'
    | 'hook'
    | 'context'
    | 'util'
    | 'config'
    | 'asset'
    | 'test'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'complete' | 'partial' | 'needs_update' | 'unknown'
}

export const PROJECT_INDEX: FileNode[] = [
  // ===== EXISTING STRUCTURE (from file tree) =====

  // Root App Files
  {
    path: 'app/App.tsx',
    type: 'file',
    summary: 'Main Next.js app router entry point',
    exists: true,
    category: 'core',
    priority: 'critical',
    status: 'complete',
  },
  {
    path: 'app/main.tsx',
    type: 'file',
    summary: 'React app initialization and rendering',
    exists: true,
    category: 'core',
    priority: 'critical',
    status: 'complete',
  },
  {
    path: 'app/page.tsx',
    type: 'file',
    summary: 'Main application page with embedded chapter viewer',
    exists: true,
    category: 'page',
    priority: 'critical',
    status: 'needs_update',
  },
  {
    path: 'app/LoginPage.tsx',
    type: 'file',
    summary: 'User login authentication form',
    exists: true,
    category: 'page',
    priority: 'critical',
    status: 'complete',
  },
  {
    path: 'app/SignUp.tsx',
    type: 'file',
    summary: 'User registration form',
    exists: true,
    category: 'page',
    priority: 'critical',
    status: 'complete',
  },
  {
    path: 'app/globals.css',
    type: 'file',
    summary: 'Global CSS styles and Tailwind imports',
    exists: true,
    category: 'asset',
    priority: 'high',
    status: 'complete',
  },
  {
    path: 'app/favicon.ico',
    type: 'file',
    summary: 'App favicon icon',
    exists: true,
    category: 'asset',
    priority: 'low',
    status: 'complete',
  },

  // Landing & Marketing Pages
  {
    path: 'app/landing/page.tsx',
    type: 'file',
    summary: 'Marketing landing page component',
    exists: true,
    category: 'page',
    priority: 'medium',
    status: 'complete',
  },
  {
    path: 'app/pricing/page.tsx',
    type: 'file',
    summary: 'Pricing tiers and subscription plans',
    exists: true,
    category: 'page',
    priority: 'medium',
    status: 'complete',
  },

  // Account Pages (in /pages directory)
  {
    path: 'pages/AnalyticsPage.tsx',
    type: 'file',
    summary: 'Comprehensive analytics dashboard',
    exists: true,
    category: 'page',
    priority: 'high',
    status: 'complete',
  },
  {
    path: 'pages/LoginPage.tsx',
    type: 'file',
    summary: 'Dedicated login page (separate from app/)',
    exists: true,
    category: 'page',
    priority: 'critical',
    status: 'complete',
  },
  {
    path: 'pages/ProfilePage.tsx',
    type: 'file',
    summary: 'User profile management page',
    exists: true,
    category: 'page',
    priority: 'high',
    status: 'complete',
  },
  {
    path: 'pages/RegisterPage.tsx',
    type: 'file',
    summary: 'User registration page',
    exists: true,
    category: 'page',
    priority: 'critical',
    status: 'complete',
  },

  // Services - EXTENSIVE EXISTING IMPLEMENTATION
  {
    path: 'services/analytics-service.ts',
    type: 'file',
    summary: 'User analytics and progress tracking service',
    exists: true,
    category: 'service',
    priority: 'high',
    status: 'partial',
  },
  {
    path: 'services/auth.ts',
    type: 'file',
    summary: 'Authentication service',
    exists: true,
    category: 'service',
    priority: 'critical',
    status: 'partial',
  },
  {
    path: 'services/edtech-api.ts',
    type: 'file',
    summary: 'Main API client for edtech platform',
    exists: true,
    category: 'service',
    priority: 'critical',
    status: 'needs_update',
  },
  {
    path: 'services/edtech-content.ts',
    type: 'file',
    summary: 'Content management and generation service',
    exists: true,
    category: 'service',
    priority: 'high',
    status: 'partial',
  },
  {
    path: 'services/EvaluationService.ts',
    type: 'file',
    summary: 'Learning evaluation and assessment service',
    exists: true,
    category: 'service',
    priority: 'medium',
    status: 'unknown',
  },
  {
    path: 'services/learning-analytics-service.ts',
    type: 'file',
    summary: 'Advanced learning analytics and insights',
    exists: true,
    category: 'service',
    priority: 'medium',
    status: 'unknown',
  },
  {
    path: 'services/markdown-utils.ts',
    type: 'file',
    summary: 'Markdown processing and rendering utilities',
    exists: true,
    category: 'service',
    priority: 'medium',
    status: 'unknown',
  },
  {
    path: 'services/meshy.ts',
    type: 'file',
    summary: '3D mesh generation service integration',
    exists: true,
    category: 'service',
    priority: 'low',
    status: 'unknown',
  },
  {
    path: 'services/openAi.ts',
    type: 'file',
    summary: 'OpenAI API integration service',
    exists: true,
    category: 'service',
    priority: 'high',
    status: 'unknown',
  },
  {
    path: 'services/openAiFns.ts',
    type: 'file',
    summary: 'OpenAI function calling utilities',
    exists: true,
    category: 'service',
    priority: 'medium',
    status: 'unknown',
  },
  {
    path: 'services/promptsConfig.ts',
    type: 'file',
    summary: 'AI prompt templates and configuration',
    exists: true,
    category: 'service',
    priority: 'medium',
    status: 'unknown',
  },
  {
    path: 'services/RoleplayService.ts',
    type: 'file',
    summary: 'Roleplay scenario generation service',
    exists: true,
    category: 'service',
    priority: 'low',
    status: 'unknown',
  },
  {
    path: 'services/supabase.ts',
    type: 'file',
    summary: '🚨 LEGACY Supabase client - NEEDS REMOVAL',
    exists: true,
    category: 'service',
    priority: 'critical',
    status: 'needs_update',
  },
  {
    path: 'services/utils.ts',
    type: 'file',
    summary: 'General service utilities and helpers',
    exists: true,
    category: 'service',
    priority: 'medium',
    status: 'unknown',
  },

  // Services Backup (likely duplicates or old versions)
  {
    path: 'services.backup/analytics-service.ts',
    type: 'file',
    summary: 'Backup of analytics service',
    exists: true,
    category: 'service',
    priority: 'low',
    status: 'unknown',
  },
  {
    path: 'services.backup/auth.ts',
    type: 'file',
    summary: 'Backup of auth service',
    exists: true,
    category: 'service',
    priority: 'low',
    status: 'unknown',
  },
  {
    path: 'services.backup/component-mapper.tsx',
    type: 'file',
    summary: 'Backup of component mapping utilities',
    exists: true,
    category: 'service',
    priority: 'low',
    status: 'unknown',
  },

  // Scripts & Utilities
  {
    path: 'scripts/runServiceAudit.ts',
    type: 'file',
    summary: 'Service audit and gap analysis script',
    exists: true,
    category: 'util',
    priority: 'medium',
    status: 'complete',
  },
  {
    path: 'utils/analytics-test-helpers.ts',
    type: 'file',
    summary: 'Analytics testing utilities',
    exists: true,
    category: 'util',
    priority: 'low',
    status: 'unknown',
  },
  {
    path: 'utils/analytics-transformers.ts',
    type: 'file',
    summary: 'Data transformation utilities for analytics',
    exists: true,
    category: 'util',
    priority: 'medium',
    status: 'unknown',
  },
  {
    path: 'utils/analyzeProjectStructure.ts',
    type: 'file',
    summary: 'Project structure analysis utility',
    exists: true,
    category: 'util',
    priority: 'medium',
    status: 'complete',
  },
  {
    path: 'utils/cn.ts',
    type: 'file',
    summary: 'CSS class name utility (likely clsx/cn)',
    exists: true,
    category: 'util',
    priority: 'medium',
    status: 'unknown',
  },
  {
    path: 'utils/contentHelpers.ts',
    type: 'file',
    summary: 'Content processing and manipulation helpers',
    exists: true,
    category: 'util',
    priority: 'medium',
    status: 'unknown',
  },
  {
    path: 'utils/knowledge-analytics-test-helpers.ts',
    type: 'file',
    summary: 'Knowledge analytics testing utilities',
    exists: true,
    category: 'util',
    priority: 'low',
    status: 'unknown',
  },
  {
    path: 'utils/serviceAudit.ts',
    type: 'file',
    summary: 'Service integration audit utility',
    exists: true,
    category: 'util',
    priority: 'medium',
    status: 'complete',
  },
  {
    path: 'utils/test-helpers.ts',
    type: 'file',
    summary: 'General testing utilities and helpers',
    exists: true,
    category: 'util',
    priority: 'low',
    status: 'unknown',
  },

  // Test Configuration
  {
    path: 'setupTests.ts',
    type: 'file',
    summary: 'Jest/Vitest test setup configuration',
    exists: true,
    category: 'config',
    priority: 'medium',
    status: 'unknown',
  },

  // ===== MISSING CRITICAL PIECES =====
  {
    path: 'contexts/UserContext.tsx',
    type: 'file',
    summary: 'User authentication state management',
    exists: false,
    category: 'context',
    priority: 'critical',
    status: 'needs_update',
  },
  {
    path: 'contexts/InteractionTrackerContext.tsx',
    type: 'file',
    summary: 'User interaction tracking context',
    exists: false,
    category: 'context',
    priority: 'medium',
    status: 'needs_update',
  },
  {
    path: 'components/ProtectedRoute.tsx',
    type: 'file',
    summary: 'Authentication wrapper for secured routes',
    exists: false,
    category: 'component',
    priority: 'critical',
    status: 'needs_update',
  },
  {
    path: 'components/ChapterViewer.tsx',
    type: 'file',
    summary: 'Standalone chapter viewer (extract from app/page.tsx)',
    exists: false,
    category: 'component',
    priority: 'high',
    status: 'needs_update',
  },
  {
    path: 'hooks/useWebSocket.ts',
    type: 'file',
    summary: 'WebSocket connection management',
    exists: false,
    category: 'hook',
    priority: 'medium',
    status: 'needs_update',
  },
  {
    path: 'hooks/useKnowledgeData.ts',
    type: 'file',
    summary: 'Knowledge and chapter data hooks',
    exists: false,
    category: 'hook',
    priority: 'high',
    status: 'needs_update',
  },
  {
    path: 'services/api.ts',
    type: 'file',
    summary: 'V2 API client replacing supabase integration',
    exists: false,
    category: 'service',
    priority: 'critical',
    status: 'needs_update',
  },
]

export interface ProjectSummary {
  totalFiles: number
  existingFiles: number
  missingFiles: number
  categoryCounts: Record<string, number>
  priorityCounts: Record<string, number>
  statusCounts: Record<string, number>
  criticalMissing: string[]
  legacyToRemove: string[]
  needsUpdate: string[]
}

export function generateProjectSummary(): ProjectSummary {
  const existing = PROJECT_INDEX.filter(f => f.exists)
  const missing = PROJECT_INDEX.filter(f => !f.exists)

  const categoryCounts = PROJECT_INDEX.reduce(
    (acc, file) => {
      acc[file.category] = (acc[file.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const priorityCounts = PROJECT_INDEX.reduce(
    (acc, file) => {
      acc[file.priority] = (acc[file.priority] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const statusCounts = existing.reduce(
    (acc, file) => {
      acc[file.status] = (acc[file.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const criticalMissing = missing
    .filter(f => f.priority === 'critical')
    .map(f => f.path)

  const legacyToRemove = existing
    .filter(f => f.summary.includes('LEGACY') || f.summary.includes('Supabase'))
    .map(f => f.path)

  const needsUpdate = existing
    .filter(f => f.status === 'needs_update')
    .map(f => f.path)

  return {
    totalFiles: PROJECT_INDEX.length,
    existingFiles: existing.length,
    missingFiles: missing.length,
    categoryCounts,
    priorityCounts,
    statusCounts,
    criticalMissing,
    legacyToRemove,
    needsUpdate,
  }
}

export function logProjectIndex() {
  const summary = generateProjectSummary()

  console.group('📂 PROJECT STRUCTURE INDEX')

  console.log('📊 SUMMARY')
  console.log(`Total files catalogued: ${summary.totalFiles}`)
  console.log(`Existing files: ${summary.existingFiles}`)
  console.log(`Missing files: ${summary.missingFiles}`)
  console.log('')

  console.log('📁 BY CATEGORY')
  Object.entries(summary.categoryCounts).forEach(([category, count]) => {
    console.log(`${category}: ${count} files`)
  })
  console.log('')

  console.log('🚨 CRITICAL MISSING FILES')
  summary.criticalMissing.forEach(path => console.log(`❌ ${path}`))
  console.log('')

  console.log('🔄 NEEDS UPDATE/INTEGRATION')
  summary.needsUpdate.forEach(path => console.log(`🟡 ${path}`))
  console.log('')

  console.log('🗑️ LEGACY TO REMOVE')
  summary.legacyToRemove.forEach(path => console.log(`🚫 ${path}`))

  console.groupEnd()

  return summary
}

// Auto-run in development
if (import.meta.env.DEV) {
  logProjectIndex()
}
