import { auditServices } from '../utils/serviceAudit'

interface ServiceGap {
  service: string
  issue: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  action: string
}

async function runCompleteServiceAudit() {
  console.log('🔍 Starting comprehensive service audit...\n')

  const result = await auditServices()

  // Display summary
  console.log('📊 AUDIT SUMMARY')
  console.log('================')
  console.log(`Total services: ${result.summary.total}`)
  console.log(`Existing: ${result.summary.existing}`)
  console.log(`V2 Ready: ${result.summary.v2Ready}`)
  console.log(`Need work: ${result.summary.needsWork}`)
  console.log('')

  // Identify gaps and prioritize
  const gaps: ServiceGap[] = []

  result.services.forEach(service => {
    if (!service.exists) {
      gaps.push({
        service: service.name,
        issue: 'Service file missing',
        priority: getServicePriority(service.name),
        action: `Create /src/services/${service.name}.ts`,
      })
    } else if (!service.hasV2Integration) {
      gaps.push({
        service: service.name,
        issue: 'No /v2 endpoints found',
        priority: getServicePriority(service.name),
        action: `Update ${service.name} to use /v2 API endpoints`,
      })
    }

    service.issues.forEach(issue => {
      if (!gaps.some(g => g.service === service.name)) {
        gaps.push({
          service: service.name,
          issue,
          priority: getServicePriority(service.name),
          action: `Investigate and fix: ${issue}`,
        })
      }
    })
  })

  // Sort by priority
  gaps.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  // Display action plan
  console.log('🚨 ACTION PLAN')
  console.log('=============')

  const highPriority = gaps.filter(g => g.priority === 'HIGH')
  const mediumPriority = gaps.filter(g => g.priority === 'MEDIUM')
  const lowPriority = gaps.filter(g => g.priority === 'LOW')

  if (highPriority.length > 0) {
    console.log('\n🔴 HIGH PRIORITY (immediate action needed):')
    highPriority.forEach((gap, idx) => {
      console.log(`${idx + 1}. ${gap.service}: ${gap.issue}`)
      console.log(`   → ${gap.action}`)
    })
  }

  if (mediumPriority.length > 0) {
    console.log('\n🟡 MEDIUM PRIORITY (should address soon):')
    mediumPriority.forEach((gap, idx) => {
      console.log(`${idx + 1}. ${gap.service}: ${gap.issue}`)
      console.log(`   → ${gap.action}`)
    })
  }

  if (lowPriority.length > 0) {
    console.log('\n🟢 LOW PRIORITY (can defer):')
    lowPriority.forEach((gap, idx) => {
      console.log(`${idx + 1}. ${gap.service}: ${gap.issue}`)
      console.log(`   → ${gap.action}`)
    })
  }

  // Generate implementation suggestions
  console.log('\n💡 IMPLEMENTATION SUGGESTIONS')
  console.log('=============================')

  const missingServices = gaps.filter(g => g.issue === 'Service file missing')
  if (missingServices.length > 0) {
    console.log('\nMissing service files to create:')
    missingServices.forEach(gap => {
      console.log(`- ${gap.action}`)
    })
  }

  const v2Gaps = gaps.filter(g => g.issue === 'No /v2 endpoints found')
  if (v2Gaps.length > 0) {
    console.log('\nServices needing /v2 integration:')
    v2Gaps.forEach(gap => {
      console.log(`- ${gap.service}: Update API calls to use /v2/ prefix`)
    })
  }

  return {
    summary: result.summary,
    gaps,
    recommendations: generateRecommendations(gaps),
  }
}

function getServicePriority(serviceName: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const priorityMap: Record<string, 'HIGH' | 'MEDIUM' | 'LOW'> = {
    'auth-service': 'HIGH',
    'knowledge-service': 'HIGH',
    'analytics-service': 'MEDIUM',
    'content-service': 'MEDIUM',
    'roleplay-service': 'LOW',
    'search-service': 'LOW',
  }

  return priorityMap[serviceName] || 'MEDIUM'
}

function generateRecommendations(gaps: ServiceGap[]): string[] {
  const recommendations: string[] = []

  const highPriorityCount = gaps.filter(g => g.priority === 'HIGH').length
  if (highPriorityCount > 0) {
    recommendations.push(
      `🚨 ${highPriorityCount} high-priority service issues need immediate attention`
    )
  }

  const missingServices = gaps.filter(
    g => g.issue === 'Service file missing'
  ).length
  if (missingServices > 0) {
    recommendations.push(
      `📝 Create ${missingServices} missing service files using the ApiClient pattern`
    )
  }

  const v2Gaps = gaps.filter(g => g.issue === 'No /v2 endpoints found').length
  if (v2Gaps > 0) {
    recommendations.push(
      `🔄 Update ${v2Gaps} services to use /v2 API endpoints`
    )
  }

  recommendations.push(
    '✅ Run this audit again after implementing fixes to verify progress'
  )

  return recommendations
}

// Execute if run directly
if (import.meta.env.DEV) {
  runCompleteServiceAudit().then(result => {
    console.log('\n🎯 AUDIT COMPLETE')
    console.log(
      'Next steps: Address high-priority gaps first, then run audit again.'
    )
  })
}

export { runCompleteServiceAudit }
